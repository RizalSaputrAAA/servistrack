import test from "node:test";
import assert from "node:assert/strict";
import { triage, RULES } from "../lib/triage";
import { PriorityQueue } from "../lib/queue";

test("ada 24 aturan", () => assert.equal(RULES.length, 24));

test("satu gejala: tidak_charging -> power_charging 0.9", () => {
  const r = triage(["tidak_charging"]);
  assert.equal(r.diagnosis, "power_charging");
  assert.equal(r.score, 90);
});

test("kombinasi CF: mati_total + tidak_charging", () => {
  const r = triage(["mati_total", "tidak_charging"]); // 0.8 + 0.9*0.2 = 0.98
  assert.equal(r.confidence, 0.98);
});

test("gejala kosong -> skor 0", () => {
  assert.equal(triage([]).score, 0);
});

test("antrean: skor tinggi dulu, seri -> yang lebih lama", () => {
  const q = new PriorityQueue();
  q.push({ priority: 50, createdAt: 1, data: "a" });
  q.push({ priority: 80, createdAt: 3, data: "b" });
  q.push({ priority: 80, createdAt: 2, data: "c" });
  assert.deepEqual([q.pop()!.data, q.pop()!.data, q.pop()!.data], ["c", "b", "a"]);
});
