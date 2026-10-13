// Prevents a console window from appearing alongside the GUI on Windows in
// release builds. Kept enabled in debug too would hide backend stdout, which
// is useful while developing the shell.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    soundbox_desktop_lib::run()
}
