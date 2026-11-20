import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContributionInput } from "../lib/contribution-validation.js";
import {
  validateOptionalUrl,
  validateUsername,
} from "../lib/usernames.js";
import {
  sanitizeFilename,
  validateProjectFiles,
} from "../lib/project-files.js";
import { formatFileSize, fundingProgress } from "../lib/format.js";

test("contribution input is normalised and accepted", () => {
  const result = validateContributionInput({
    username: "  Divan_17 ",
    name: " Asha ",
    message: " Great work ",
    amount: "500",
  });

  assert.deepEqual(result, {
    ok: true,
    value: { username: "divan_17", name: "Asha", message: "Great work", amount: 500 },
  });
});

test("contribution amount must be a whole number in range", () => {
  for (const amount of [9, 100001, 10.5, "abc", null]) {
    const result = validateContributionInput({ username: "creator", name: "Asha", amount });
    assert.equal(result.ok, false, `amount ${amount} should be rejected`);
  }
});

test("contribution rejects short names and long messages", () => {
  assert.equal(validateContributionInput({ username: "creator", name: "A", amount: 100 }).ok, false);
  assert.equal(
    validateContributionInput({ username: "creator", name: "Asha", message: "x".repeat(241), amount: 100 }).ok,
    false,
  );
});

test("usernames reject reserved routes and invalid characters", () => {
  assert.equal(validateUsername("explore").ok, false);
  assert.equal(validateUsername("dashboard").ok, false);
  assert.equal(validateUsername("ab").ok, false);
  assert.equal(validateUsername("bad-name").ok, false);
  assert.deepEqual(validateUsername(" New_Creator "), { ok: true, value: "new_creator" });
});

test("optional URLs allow empty values and only http(s)", () => {
  assert.deepEqual(validateOptionalUrl("", "Website"), { ok: true, value: "" });
  assert.equal(validateOptionalUrl("https://example.com", "Website").ok, true);
  assert.equal(validateOptionalUrl("javascript:alert(1)", "Website").ok, false);
  assert.equal(validateOptionalUrl("not a url", "Website").ok, false);
  assert.equal(validateOptionalUrl(`https://example.com/${"a".repeat(300)}`, "Website").ok, false);
});

test("project files enforce count, type and size limits", () => {
  const file = (name, size, type = "") => ({ name, size, type });

  assert.equal(validateProjectFiles([file("notes.md", 100)]), null);
  assert.match(validateProjectFiles([]), /between 1 and 5/);
  assert.match(validateProjectFiles([file("virus.exe", 100)]), /unsupported/);
  assert.match(validateProjectFiles([file("big.pdf", 6 * 1024 * 1024)]), /5 MB/);
  assert.match(
    validateProjectFiles(Array.from({ length: 4 }, (_, i) => file(`f${i}.pdf`, 4 * 1024 * 1024))),
    /15 MB/,
  );
});

test("filenames are sanitised", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), ".._.._etc_passwd");
  assert.equal(sanitizeFilename("  "), "file");
});

test("format helpers", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(2048), "2 KB");
  assert.equal(formatFileSize(1.5 * 1024 * 1024), "1.5 MB");
  assert.equal(fundingProgress(2500, 10000), 25);
  assert.equal(fundingProgress(50000, 10000), 100);
  assert.equal(fundingProgress(0, 0), 0);
});
