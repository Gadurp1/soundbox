/**
 * The history store: one ordered list per studio of what happened and who
 * caused it. Run against a real in-memory SQLite, because ordering, cascade
 * and the JSON columns are the whole feature and a fake would prove none of
 * them.
 */

import BetterSqlite3 from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HistoryStore } from "../src/history.js";

let store: HistoryStore;
let seq: number;

/*
 * Every connection a test opens is closed after it. Left open,
 * better-sqlite3 finalizes its statements after the worker's Node
 * environment is gone at exit, and the process aborts — taking the whole
 * run with it (seen on Linux, Node 24).
 */
const opened: BetterSqlite3.Database[] = [];
function connect(): BetterSqlite3.Database {
  const conn = new BetterSqlite3(":memory:");
  opened.push(conn);
  return conn;
}
afterEach(() => {
  for (const conn of opened.splice(0)) conn.close();
});

beforeEach(() => {
  const conn = connect();
  conn.pragma("foreign_keys = ON");
  // `conversations.story_id` references it; the real schema builds this.
  conn.exec("CREATE TABLE stories (id TEXT PRIMARY KEY)");
  conn.prepare("INSERT INTO stories (id) VALUES (?)").run("story-1");
  seq = 0;
  store = new HistoryStore(
    conn,
    () => `id-${++seq}`,
    () => `2026-01-01T00:00:${String(seq).padStart(2, "0")}.000Z`,
  );
});

describe("conversations", () => {
  it("creates one and finds it again", () => {
    const made = store.create("Lighthouse", "story-1");
    expect(store.get(made.id)).toMatchObject({
      title: "Lighthouse",
      story_id: "story-1",
      entry_count: 0,
    });
  });

  it("lists newest first", () => {
    const a = store.create("first");
    const b = store.create("second");
    expect(store.list().map((c) => c.id)).toEqual([b.id, a.id]);
  });

  it("finds the conversation held in a studio", () => {
    store.create("elsewhere");
    const inStudio = store.create("here", "story-1");
    expect(store.forStory("story-1")?.id).toBe(inStudio.id);
    expect(store.forStory("story-none")).toBeNull();
  });

  it("gives a studio one thread, however many times it is asked for one", () => {
    // Two first writes racing both see no thread and both create one.
    const first = store.create("first", "story-1");
    const second = store.create("second", "story-1");
    expect(second.id).toBe(first.id);
    store.append(second.id, [{ role: "user", content: "hello" }]);
    expect(store.list().filter((c) => c.story_id === "story-1")).toHaveLength(1);
    // Threads outside a studio are not limited.
    expect(store.create("a").id).not.toBe(store.create("b").id);
  });

  it("folds threads an older database already doubled up", () => {
    const conn = connect();
    conn.exec("CREATE TABLE stories (id TEXT PRIMARY KEY)");
    conn.prepare("INSERT INTO stories (id) VALUES (?)").run("story-1");
    // The schema as it was, without the unique index.
    conn.exec(`
      CREATE TABLE conversations (id TEXT PRIMARY KEY, title TEXT NOT NULL,
        story_id TEXT REFERENCES stories(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE conversation_entries (id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        position INTEGER NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
        actions TEXT, sound_ids TEXT, job_id TEXT, created_at TEXT NOT NULL);
    `);
    const thread = conn.prepare("INSERT INTO conversations VALUES (?,?,?,?,?)");
    thread.run("old", "Old", "story-1", "T1", "T3");
    thread.run("new", "New", "story-1", "T2", "T4");
    thread.run("loose", "Loose", null, "T1", "T1");
    const entry = conn.prepare(
      "INSERT INTO conversation_entries (id, conversation_id, position, role, content, created_at) VALUES (?,?,?,?,?,?)",
    );
    entry.run("e1", "old", 0, "user", "first", "T1");
    entry.run("e2", "new", 0, "user", "second", "T2");
    entry.run("e3", "old", 1, "assistant", "third", "T3");

    const migrated = new HistoryStore(conn, () => "fresh", () => "T9");

    const kept = migrated.forStory("story-1");
    expect(kept?.id).toBe("new");
    expect(migrated.entries("new").map((e) => [e.content, e.position])).toEqual([
      ["first", 0],
      ["second", 1],
      ["third", 2],
    ]);
    expect(migrated.get("old")).toBeNull();
    expect(migrated.get("loose")).not.toBeNull();
    expect(migrated.create("again", "story-1").id).toBe("new");
  });

  it("renames", () => {
    const made = store.create("New conversation");
    expect(store.rename(made.id, "Door slams")?.title).toBe("Door slams");
  });

  it("deletes, and takes its entries with it", () => {
    const made = store.create("doomed");
    store.append(made.id, [{ role: "user", content: "hello" }]);
    expect(store.remove(made.id)).toBe(true);
    expect(store.get(made.id)).toBeNull();
    expect(store.entries(made.id)).toEqual([]);
  });

  it("says so when there was nothing to delete", () => {
    expect(store.remove("nope")).toBe(false);
  });
});

describe("entries", () => {
  it("keeps the order they happened in", () => {
    const c = store.create("thread");
    store.append(c.id, [
      { role: "user", content: "one" },
      { role: "assistant", content: "two" },
    ]);
    store.append(c.id, [{ role: "user", content: "three" }]);
    expect(store.entries(c.id).map((e) => e.content)).toEqual(["one", "two", "three"]);
    expect(store.entries(c.id).map((e) => e.position)).toEqual([0, 1, 2]);
  });

  // The three halves of an entry — words, effect, result — in one row, so
  // "what happened here" is one list rather than three interleaved ones.
  it("carries what was said, what it did and what it produced", () => {
    const c = store.create("thread");
    store.append(c.id, [
      {
        role: "assistant",
        content: "Wrote the intro.",
        actions: ["Rename track 0 to Kick", "Write 4 lines for Narrator"],
        sound_ids: ["snd-1", "snd-2"],
        job_id: "job-9",
      },
    ]);
    expect(store.entries(c.id)[0]).toMatchObject({
      content: "Wrote the intro.",
      actions: ["Rename track 0 to Kick", "Write 4 lines for Narrator"],
      sound_ids: ["snd-1", "snd-2"],
      job_id: "job-9",
    });
  });

  it("treats the optional halves as empty rather than missing", () => {
    const c = store.create("thread");
    store.append(c.id, [{ role: "user", content: "just words" }]);
    expect(store.entries(c.id)[0]).toMatchObject({
      actions: [],
      sound_ids: [],
      job_id: null,
    });
  });

  it("touches the conversation so it sorts to the top", () => {
    const older = store.create("older");
    const newer = store.create("newer");
    store.append(older.id, [{ role: "user", content: "bump" }]);
    expect(store.list()[0]!.id).toBe(older.id);
    expect(store.list()[1]!.id).toBe(newer.id);
  });

  it("counts what is in it", () => {
    const c = store.create("thread");
    store.append(c.id, [
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
    ]);
    expect(store.get(c.id)!.entry_count).toBe(2);
  });

  it("appending nothing changes nothing", () => {
    const c = store.create("thread");
    expect(store.append(c.id, [])).toEqual([]);
    expect(store.get(c.id)!.entry_count).toBe(0);
  });

  // A row hand-edited, or written by a build that stored something else,
  // should cost its extras rather than the entry it belongs to.
  it("survives unreadable JSON in a list column", () => {
    const c = store.create("thread");
    store.append(c.id, [{ role: "user", content: "x", actions: ["real"] }]);
    const conn = (store as unknown as { conn: BetterSqlite3.Database }).conn;
    conn.prepare("UPDATE conversation_entries SET actions = ?").run("{not json");
    expect(store.entries(c.id)[0]!.actions).toEqual([]);
    expect(store.entries(c.id)[0]!.content).toBe("x");
  });
});

describe("titleFrom", () => {
  it("uses what was said", () => {
    expect(HistoryStore.titleFrom("make me a door slam")).toBe("make me a door slam");
  });

  it("never returns nothing", () => {
    expect(HistoryStore.titleFrom("   ")).toBe("New conversation");
  });

  it("cuts a long one at a word boundary", () => {
    const title = HistoryStore.titleFrom(
      "help me make a short theme song with vocals for an indie game about a lighthouse keeper",
    );
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(49);
    expect(title).not.toMatch(/\s…$/);
  });

  it("flattens whitespace so a pasted paragraph still reads as a title", () => {
    expect(HistoryStore.titleFrom("two\n\n  words")).toBe("two words");
  });
});
