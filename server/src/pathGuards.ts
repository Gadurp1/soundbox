/**
 * Small path predicates shared by the routes and the service, for the places
 * a path arrives from a request or a settings field.
 */

import { isAbsolute, relative, resolve } from "node:path";

/**
 * Whether `path` names a network location: `\\host\share`, `//host/share`,
 * and the `\\?\UNC\` and `\\.\` device forms.
 *
 * Only meaningful on Windows, where merely resolving such a path makes the OS
 * contact the host — and hand it the signed-in user's NTLM credentials. A
 * page that can make the server list or create a folder there can leak those
 * without the user doing anything, so these are refused before they reach
 * the filesystem. On other platforms a leading `//` is just a root path.
 */
export function isUncPath(path: string, platform: NodeJS.Platform = process.platform): boolean {
  if (platform !== "win32") return false;
  return /^[\\/]{2}/.test(path.trim());
}

function norm(path: string): string {
  const resolved = resolve(path);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/** Whether two paths name the same location (case-insensitive on Windows). */
export function samePath(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

/** Whether `child` is `parent` itself or somewhere beneath it. */
export function isWithin(child: string, parent: string): boolean {
  const rel = relative(norm(parent), norm(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
