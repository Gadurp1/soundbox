/**
 * Bridge to the Tauri desktop shell.
 *
 * The web build runs standalone (no Tauri, no `window.__TAURI_INTERNALS__`),
 * so every call here is guarded by {@link isDesktop} first — invoking on the
 * plain web build would just reject, but callers should never get that far.
 */

import { isTauri, invoke } from "@tauri-apps/api/core";

export function isDesktop(): boolean {
  return isTauri();
}

/** Is the backend answering right now? */
export function getBackendHealth(): Promise<boolean> {
  return invoke<boolean>("backend_health");
}

/** Stop whatever backend we own (if any) and start a fresh one. */
export function restartBackend(): Promise<void> {
  return invoke<void>("restart_backend");
}
