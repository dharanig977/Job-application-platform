import { test } from "node:test";
import assert from "node:assert/strict";
import { jobKeywords, scoreResume, has } from "./ats.mjs";

test("whole-word matching handles symbols and avoids partial words", () => {
  assert.ok(has("Built CI/CD with Jenkins", "CI/CD"));
  assert.ok(has("Strong C# and .NET skills", "C#"));
  assert.ok(!has("Golang expert", "Go"));
  assert.ok(!has("Sparkling water", "Spark"));
});

test("a longer matched term replaces the shorter one inside it", () => {
  const kws = jobKeywords("Looking for an SAP Basis admin with S/4HANA and Linux.");
  assert.deepEqual(kws.sort(), ["Linux", "S/4HANA", "SAP Basis"].sort());
});

test("splits missing keywords into supported and unsupported", () => {
  const job = { title: "Data Engineer", description: "Python, Snowflake, Airflow and Kafka required." };
  const resume = "Data Engineer with Python and Snowflake.";
  const r = scoreResume(resume, job, { skills: "Airflow, dbt" });
  assert.deepEqual(r.matched.sort(), ["Python", "Snowflake"]);
  assert.deepEqual(r.supported, ["Airflow"]);
  assert.deepEqual(r.unsupported, ["Kafka"]);
  assert.equal(r.score, Math.round(0.5 * 85 + 15));
});
