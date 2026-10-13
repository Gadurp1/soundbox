//! Soundbox desktop shell.
//!
//! Deliberately thin. The Node server already serves the built frontend,
//! the HTTP API and the MCP server on one port, so this process starts that
//! server, waits for it, and points a webview at it. Everything the user sees
//! after the splash is the same app that runs in a browser — which means the
//! desktop build cannot drift from the web build, and there is no second copy
//! of the UI to keep in sync.

mod backend;

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

use tauri::{Emitter, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};

/// How long to wait for the backend before giving up and showing an error.
/// Generous on purpose: a first launch after a model install can be slow.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(180);

struct AppState {
    backend: Mutex<Option<backend::Backend>>,
}

/// Is the backend answering on its port right now?
///
/// Exposed to the frontend so the desktop app's Activity page can show real
/// status instead of assuming "started once" still means "healthy now" — the
/// server process can die independently of this shell (OOM, a bad model
/// load, `kill` from a terminal) without us finding out any other way.
#[tauri::command]
fn backend_health() -> bool {
    backend::is_healthy(backend::DEFAULT_PORT)
}

/// (Re)start the backend, replacing anything we already own.
///
/// Used for both "it crashed, bring it back" and "it's stuck, restart it" —
/// both look the same from here: stop whatever we own, then start fresh.
/// Adopted servers (`owned` empty) are left alone rather than killed, same as
/// at launch — we didn't start it, so we don't get to stop it either; the
/// user should restart it themselves in that case.
#[tauri::command]
fn restart_backend(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    {
        let mut guard = state.backend.lock().unwrap();
        if let Some(mut b) = guard.take() {
            b.shutdown();
        }
    }

    let root = find_project_root().ok_or_else(|| {
        "Could not find the Soundbox project. Set SOUNDBOX_PROJECT_ROOT to your checkout."
            .to_string()
    })?;
    let port = backend::DEFAULT_PORT;
    let started = backend::start(&root, port)?;
    *state.backend.lock().unwrap() = Some(started);

    if !backend::wait_until_healthy(port, STARTUP_TIMEOUT) {
        return Err("The backend did not come up in time.".to_string());
    }
    Ok(())
}

/// Find the Soundbox checkout by walking up from the executable, then the
/// working directory, looking for the server package.
///
/// This shell runs against a real checkout: it does not yet bundle a Node
/// interpreter or the server source (that is the packaging work this build
/// deliberately defers). Failing loudly with a findable reason beats silently
/// launching nothing.
fn find_project_root() -> Option<PathBuf> {
    fn has_backend(dir: &std::path::Path) -> bool {
        dir.join("server").join("package.json").is_file()
    }

    if let Ok(explicit) = std::env::var("SOUNDBOX_PROJECT_ROOT") {
        let p = PathBuf::from(explicit);
        if has_backend(&p) {
            return Some(p);
        }
    }

    let mut starts: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        starts.push(exe);
    }
    if let Ok(cwd) = std::env::current_dir() {
        starts.push(cwd);
    }

    for start in starts {
        let mut dir = start.as_path();
        // Walk up a bounded number of levels rather than to the filesystem
        // root, so a stray `server/package.json` far above us can't be
        // mistaken for the project.
        for _ in 0..6 {
            if has_backend(dir) {
                return Some(dir.to_path_buf());
            }
            match dir.parent() {
                Some(parent) => dir = parent,
                None => break,
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            backend: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![backend_health, restart_backend])
        .setup(|app| {
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index.html".into()),
            )
            .title("Soundbox")
            .inner_size(1200.0, 820.0)
            .min_inner_size(720.0, 560.0)
            .resizable(true)
            .build()?;

            let handle = app.handle().clone();
            // Startup blocks on network and process spawning, so it cannot run
            // on the main thread — the splash would never paint.
            std::thread::spawn(move || {
                let notify = |stage: &str, message: &str| {
                    let _ = handle.emit("backend-status", serde_json::json!({
                        "stage": stage,
                        "message": message,
                    }));
                };

                let Some(root) = find_project_root() else {
                    notify(
                        "error",
                        "Could not find the Soundbox project. Set SOUNDBOX_PROJECT_ROOT to your \
                         checkout, or launch the app from inside it.",
                    );
                    return;
                };

                notify("starting", "Starting the Soundbox server…");
                let port = backend::DEFAULT_PORT;
                match backend::start(&root, port) {
                    Ok(handle_backend) => {
                        let state = handle.state::<AppState>();
                        *state.backend.lock().unwrap() = Some(handle_backend);
                    }
                    Err(e) => {
                        notify("error", &e);
                        return;
                    }
                }

                notify("waiting", "Loading models and starting up…");
                if !backend::wait_until_healthy(port, STARTUP_TIMEOUT) {
                    notify(
                        "error",
                        "The Soundbox server did not start in time. Check the log file in your \
                         data directory (docs/INSTALL.md explains where it lives).",
                    );
                    return;
                }

                notify("ready", "Ready");
                if let Some(win) = handle.get_webview_window("main") {
                    match tauri::Url::parse(&backend::base_url(port)) {
                        Ok(url) => {
                            if let Err(e) = win.navigate(url) {
                                notify("error", &format!("Could not open the app: {e}"));
                            }
                        }
                        Err(e) => notify("error", &format!("Bad server URL: {e}")),
                    }
                }
            });

            let _ = window;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to start Soundbox");

    app.run(|handle, event| {
        // Stop the server we started. Without this the server process outlives
        // the window and keeps both the port and the GPU held, so the next
        // launch adopts a server the user thinks they closed.
        if let RunEvent::Exit = event {
            let state = handle.state::<AppState>();
            // Take the value out and drop the guard before using it: holding
            // the lock across shutdown() would keep a borrow of `state` alive
            // past the end of this block.
            let taken = state.backend.lock().unwrap().take();
            if let Some(mut b) = taken {
                b.shutdown();
            }
        }
    });
}
