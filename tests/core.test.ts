import { describe, it, expect, beforeAll } from "vitest";
import { createDemoDb } from "../lib/pglite";
import { retrieve } from "../lib/retrieve";
import { answer } from "../lib/answer";
import { chunkText } from "../lib/chunk";
import { embed, DIM } from "../lib/embed";

let db: any;
beforeAll(async () => { db = await createDemoDb(); }, 60_000);

describe("chunking and embedding", () => {
  it("keeps section headings with chunks", () => {
    const c = chunkText("Article 1 Pets\nTwo pets allowed.\nArticle 2 Fees\nDues are $10.");
    expect(c.map((x) => x.section)).toEqual(["Article 1 Pets", "Article 2 Fees"]);
  });
  it("embeds to a unit vector of the right size", () => {
    const v = embed("fence height limit");
    expect(v).toHaveLength(DIM);
    expect(Math.hypot(...v)).toBeCloseTo(1, 5);
  });
  it("is deterministic", () => { expect(embed("pool hours")).toEqual(embed("pool hours")); });
});

const GOLD: [string, string, RegExp][] = [
  ["oak-hollow", "How tall can my fence be?", /6 feet/],
  ["oak-hollow", "Can I rent my house on Airbnb for a weekend?", /fewer than 30 consecutive days/],
  ["oak-hollow", "When is the annual assessment due and what is the late fee?", /January 31|\$25/],
  ["oak-hollow", "How many guests can I bring to the pool?", /4 guests/],
  ["oak-hollow", "What are the pool hours?", /8 AM to 9 PM/],
  ["oak-hollow", "How many pets can I have?", /3 household pets/],
  ["lakeside-commons", "What is the minimum lease term?", /6 months/],
  ["lakeside-commons", "Do I need approval to put in hardwood floors?", /flooring/],
  ["lakeside-commons", "How long can guests park?", /48 hours/],
  ["lakeside-commons", "How many pets can I keep in my unit?", /2 pets/],
  ["lakeside-commons", "When is the late fee charged?", /\$50/],
  ["lakeside-commons", "Can my car be towed?", /towed/],
];

describe("cited answers on the gold set", () => {
  it.each(GOLD)("%s: %s", async (tenant, q, re) => {
    const hits = await retrieve(db, tenant, q);
    const a = answer(q, hits);
    expect(a.refused).toBe(false);
    expect(a.text).toMatch(re);
    expect(a.text).toMatch(/\[\d\]/);
    expect(a.citations.length).toBeGreaterThan(0);
  });
  it("refuses when the documents don't cover the question", async () => {
    const a = answer("What is the capital of France?", await retrieve(db, "oak-hollow", "What is the capital of France?"));
    expect(a.refused).toBe(true);
  });
});
