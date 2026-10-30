import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFilter } from "./filter.mjs";

const job = (title, description = "", location = "Remote, US") => ({ title, description, location });

test("matches a target role inside a longer title and files it under that role", () => {
  const match = buildFilter({ targetRoles: "Data Engineer, SAP Basis Consultant" });
  assert.equal(match(job("Senior Data Engineer II")), "Data Engineer");
  assert.equal(match(job("SAP Basis Consultant (Contract)")), "SAP Basis Consultant");
  assert.equal(match(job("Data Analyst")), null);
});

test("drops jobs with excluded keywords or missing must-haves", () => {
  const match = buildFilter({ targetRoles: "Data Engineer", excludeKeywords: "clearance required", keywords: "snowflake, databricks" });
  assert.equal(match(job("Data Engineer", "Active clearance required")), null);
  assert.equal(match(job("Data Engineer", "We use Oracle")), null);
  assert.equal(match(job("Data Engineer", "Snowflake and dbt")), "Data Engineer");
});

test("remote-only profiles skip on-site jobs", () => {
  const match = buildFilter({ targetRoles: "Data Engineer", workplaceType: "Remote" });
  assert.equal(match(job("Data Engineer", "", "Dallas, TX")), null);
  assert.equal(match(job("Data Engineer", "", "Remote - US")), "Data Engineer");
});
