/** Text to Speech nav entry — the Library filtered to `category: "voice"`
 *  sounds only (both "tts" reads and "vc" conversions live in this category;
 *  see `Model.category` in lib/api.ts). */

import { LibraryPage } from "@/routes/library";

export function SpeechLibraryPage() {
  return <LibraryPage category="voice" />;
}
