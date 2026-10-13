//! Starting, waiting on, and shutting down the Soundbox Node server.
//!
//! The desktop app is a thin shell: the server already serves the built
//! frontend at `/` (see `scripts/build.mjs`, which stages `app/dist` into
//! `server/web`), exposes the HTTP API, and hosts the MCP server. So this
//! process does not bundle any web assets of its own — it launches the server
//! and points a webview at it.

use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::time::{Duration, Instant};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Suppresses the console window Windows would otherwise pop up alongside the
/// GUI when spawning a console subsystem executable like node.exe.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub const DEFAULT_PORT: u16 = 17494;

/// A server we are responsible for stopping when the app exits.
///
/// If the user already had a server running (common in development, where
/// `npm run dev` owns one), we adopt it instead of starting a second copy —
/// and in that case we must *not* kill it on exit, since we did not start it.
pub struct Backend {
    /// The server process we started. Empty when we adopted a server someone
    /// else is running, which must not be killed on exit since we did not
    /// start it.
    owned: Vec<Child>,
}

/// How long the server gets to shut down on its own before it is killed.
const SHUTDOWN_GRACE: Duration = Duration::from_secs(5);

impl Backend {
    pub fn shutdown(&mut self) {
        for child in &mut self.owned {
            // Ask first where the platform has a way to ask: on SIGTERM the
            // server closes its MCP sessions and stops the engine processes
            // it started, which a kill skips — leaving them holding the GPU
            // and their ports.
            if request_stop(child) {
                let deadline = Instant::now() + SHUTDOWN_GRACE;
                while Instant::now() < deadline {
                    match child.try_wait() {
                        Ok(None) => std::thread::sleep(Duration::from_millis(100)),
                        _ => break,
                    }
                }
            }
            // This is our child, but Windows does not reap process trees
            // automatically, so ask explicitly. A failure here means it had
            // already exited — the outcome we wanted anyway.
            let _ = child.kill();
            let _ = child.wait();
        }
        self.owned.clear();
    }
}

/// Send the server a polite stop. True if one was sent.
///
/// Unix only, via `kill -TERM` rather than a libc dependency for one call.
/// Windows has no signal to send a windowless child; there the kill below
/// plus the job object (see `kill_on_close`) is what stops the tree.
fn request_stop(child: &Child) -> bool {
    #[cfg(unix)]
    {
        Command::new("kill")
            .arg("-TERM")
            .arg(child.id().to_string())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
    #[cfg(not(unix))]
    {
        let _ = child;
        false
    }
}

/// Where the server should be reachable.
pub fn base_url(port: u16) -> String {
    format!("http://127.0.0.1:{port}")
}

/// Is a Soundbox server already answering on this port?
///
/// A plain TCP connect is not enough — it would be satisfied by any process
/// holding the port, including a half-started one. We do a real request and
/// require a 2xx, using a hand-rolled GET rather than pulling in an HTTP
/// client crate for one call against localhost.
pub fn is_healthy(port: u16) -> bool {
    let addr: SocketAddr = match format!("127.0.0.1:{port}").parse() {
        Ok(a) => a,
        Err(_) => return false,
    };
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(400)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(1500)));
    let request = format!(
        "GET /api/health HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n"
    );
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }
    let mut buf = [0u8; 128];
    let Ok(n) = stream.read(&mut buf) else {
        return false;
    };
    let status_line = String::from_utf8_lossy(&buf[..n]);
    status_line.starts_with("HTTP/1.1 2") || status_line.starts_with("HTTP/1.0 2")
}

/// Block until the server answers, or give up.
///
/// A cold start (module resolution, opening the SQLite file, HF cache
/// scan) is normally well under a second, but a first launch after an
/// model install can be slower, so this stays generous and the UI shows
/// progress meanwhile.
pub fn wait_until_healthy(port: u16, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if is_healthy(port) {
            return true;
        }
        std::thread::sleep(Duration::from_millis(300));
    }
    false
}

/// Locate the Node interpreter to run the server with.
///
/// Order matters: an explicit override wins, then whatever is on PATH. Unlike
/// the old Python shell, this does not need a project-local venv — Node has
/// no per-project interpreter convention, and `server/node_modules` holds
/// dependencies, not a runtime.
pub fn find_node() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("SOUNDBOX_NODE") {
        let p = PathBuf::from(explicit);
        if p.is_file() {
            return Some(p);
        }
    }

    let names: &[&str] = if cfg!(windows) { &["node.exe", "node"] } else { &["node"] };
    for name in names {
        if Command::new(name).arg("--version").output().is_ok() {
            return Some(PathBuf::from(name));
        }
    }
    None
}

/// What to actually run: the built server if `npm run build` has staged one,
/// otherwise `tsx` running the TypeScript source directly.
///
/// The built path is what a packaged release ships (see `scripts/build.mjs`);
/// the `tsx` fallback exists so `npm run desktop` works in a fresh checkout
/// without a separate manual build step, the same way `cargo run` itself
/// compiles from source rather than requiring a prior `cargo build`.
enum ServerEntry {
    Built(PathBuf),
    Source { tsx: PathBuf, entry: PathBuf },
}

fn find_server_entry(project_root: &Path) -> Result<ServerEntry, String> {
    let server_dir = project_root.join("server");
    let built = server_dir.join("dist").join("cli.js");
    if built.is_file() {
        return Ok(ServerEntry::Built(built));
    }

    let tsx_name = if cfg!(windows) { "tsx.cmd" } else { "tsx" };
    // node_modules is hoisted to the workspace root by npm workspaces, so
    // server/node_modules/.bin only exists if something gave server its own
    // nested copy — check both.
    let candidates = [
        server_dir.join("node_modules").join(".bin").join(tsx_name),
        project_root.join("node_modules").join(".bin").join(tsx_name),
    ];
    for tsx in candidates {
        if tsx.is_file() {
            return Ok(ServerEntry::Source { tsx, entry: server_dir.join("src").join("cli.ts") });
        }
    }

    Err(format!(
        "Could not find a Soundbox server to run.\n\n\
         Expected server/dist/cli.js (run `npm run build`) or tsx installed \
         at the workspace root (run `npm install`). See docs/INSTALL.md."
    ))
}

/// Spawn the server, optionally with extra env.
fn spawn_server(
    project_root: &Path,
    port: u16,
    env: &[(&str, String)],
) -> Result<Child, String> {
    let entry = find_server_entry(project_root)?;
    let server_dir = project_root.join("server");

    let mut cmd = match &entry {
        ServerEntry::Built(js) => {
            let node = find_node().ok_or_else(|| {
                "Could not find a Node.js interpreter.\n\n\
                 Node 22.12+ is required; set SOUNDBOX_NODE to an interpreter that has \
                 it if it is not on PATH. See docs/INSTALL.md."
                    .to_string()
            })?;
            log_line(&format!("starting server: {} {} --port {port}", node.display(), js.display()));
            let mut c = Command::new(&node);
            c.arg(js);
            c
        }
        ServerEntry::Source { tsx, entry } => {
            log_line(&format!(
                "starting server (dev, no build found): {} {} --port {port}",
                tsx.display(),
                entry.display()
            ));
            let mut c = Command::new(tsx);
            c.arg(entry);
            c
        }
    };
    cmd.arg("--port").arg(port.to_string()).current_dir(&server_dir);
    for (k, v) in env {
        cmd.env(k, v);
    }

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to launch the Soundbox server: {e}"))?;

    #[cfg(windows)]
    if let Err(e) = kill_on_close::adopt(&child) {
        // Not fatal: the graceful path still cleans up. This only weakens the
        // guarantee for the crash/force-kill case, so say so rather than
        // failing a launch that would otherwise work.
        log_line(&format!(
            "could not attach a server process to the job object ({e}); it may outlive a crash"
        ));
    }
    Ok(child)
}

/// Start the server, or adopt one already running.
pub fn start(project_root: &Path, port: u16) -> Result<Backend, String> {
    if is_healthy(port) {
        log_line(&format!(
            "server already running on {port}; adopting it rather than starting a second copy"
        ));
        return Ok(Backend { owned: Vec::new() });
    }

    let child = spawn_server(project_root, port, &[])?;

    Ok(Backend { owned: vec![child] })
}

/// Tie the server's lifetime to ours at the OS level.
///
/// `Backend::shutdown` handles the ordinary case, but it only runs if we get
/// to run — a panic, a force-kill, or a debugger stop leaves the server
/// process alive holding the port. A job object with `KILL_ON_JOB_CLOSE`
/// makes the kernel do it: when our handle to the job closes (however we
/// die), everything in the job is terminated.
#[cfg(windows)]
mod kill_on_close {
    use std::os::windows::io::AsRawHandle;
    use std::process::Child;
    use std::sync::OnceLock;

    use windows::Win32::Foundation::HANDLE;
    use windows::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };

    /// Held for the life of the process on purpose: dropping this handle is
    /// exactly what triggers the kill, so it must not be closed early.
    static JOB: OnceLock<usize> = OnceLock::new();

    pub fn adopt(child: &Child) -> Result<(), String> {
        unsafe {
            let job_raw = *JOB.get_or_init(|| {
                match CreateJobObjectW(None, None) {
                    Ok(h) => {
                        let mut info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
                        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
                        let _ = SetInformationJobObject(
                            h,
                            JobObjectExtendedLimitInformation,
                            &info as *const _ as *const core::ffi::c_void,
                            u32::try_from(size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>())
                                .unwrap_or(0),
                        );
                        h.0 as usize
                    }
                    Err(_) => 0,
                }
            });
            if job_raw == 0 {
                return Err("could not create job object".into());
            }
            AssignProcessToJobObject(
                HANDLE(job_raw as *mut core::ffi::c_void),
                HANDLE(child.as_raw_handle()),
            )
            .map_err(|e| e.to_string())
        }
    }
}

fn log_line(msg: &str) {
    // Deliberately stdout rather than a logging crate: this shell has exactly
    // one job and a handful of lifecycle events. The server writes its own
    // rotating log under the data directory, which is where real diagnosis
    // happens (see docs/INSTALL.md#troubleshooting).
    println!("[soundbox-desktop] {msg}");
}
