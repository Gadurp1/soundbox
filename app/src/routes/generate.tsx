/**
 * Chat — the agent, and nothing else.
 *
 * This page used to be the Generate composer with the assistant bolted on as
 * a second tab. That is backwards now: the conversation is the interface, and
 * generating is something that happens where the work lands — on a timeline
 * in the studio, or in the request form on the Music, SFX and Voice pages. A
 * "Generate" tab here was a second way to do the same job, in the one place
 * with nothing to put the result on.
 *
 * So the composer is gone from this route, along with the mode switch that
 * chose between the two. `GenerateComposer` itself is not gone: the Library
 * still uses it, and the studio drives the same `useGenerateSession` through
 * its Prompt panel. What was removed is this page's copy.
 *
 * With no composer here, a proposal card offers only what this page can
 * actually do — open a studio, and take the conversation with it. Generate
 * and Load appear where they mean something, which is inside a studio.
 */

import { AssistantChat } from "@/components/assistant-chat";

export function GeneratePage() {
  return (
    // A height, not a minimum: the chat scrolls its own thread and keeps the
    // composer at the bottom of the box (see `assistant-chat`), which it can
    // only do if the box itself ends somewhere. With `min-h` the page grew
    // with the conversation and the thing you type in went with it.
    <div className="mx-auto flex h-[calc(100svh-6rem)] w-full max-w-4xl flex-col">
      <AssistantChat />
    </div>
  );
}
