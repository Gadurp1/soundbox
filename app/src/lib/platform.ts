/** Whether this looks like a Mac, for naming the modifier only. Handlers
 *  test `metaKey || ctrlKey` regardless. */
export const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** The platform's primary modifier, as a keycap label. */
export const MOD = IS_MAC ? "⌘" : "Ctrl";
