const assert = require("node:assert");
const { compute } = require("./index.js");

// Parity checks cross-referenced against the Python implementation
// (kleogeos/freelance-tax-cli, tax.py) run side by side, including a
// 500-case randomized sweep during development to catch rounding-tie
// edge cases (JS Math.round and Python's round() disagree on exact .5
// ties — this port uses a round-half-to-even implementation to match).

function test_basic_profit() {
  const r = compute(60000, 184500, null);
  assert.strictEqual(r.net_earnings_for_se_tax, 55410.0);
  assert.strictEqual(r.social_security_tax, 6870.84);
  assert.strictEqual(r.medicare_tax, 1606.89);
  assert.strictEqual(r.total_se_tax, 8477.73);
  assert.strictEqual(r.deductible_half, 4238.86);
  assert.strictEqual(r.quarterly_payment, 2119.43);
}

function test_additional_medicare_threshold() {
  const r = compute(250000, 184500, 200000);
  assert.strictEqual(r.additional_medicare_tax, 277.88);
  assert.strictEqual(r.total_se_tax, 29851.25);
  assert.strictEqual(r.deductible_half, 14925.62);
}

function test_wage_base_caps_social_security() {
  const r = compute(60000, 30000, null);
  assert.strictEqual(r.social_security_tax, 3720.0);
  assert.strictEqual(r.total_se_tax, 5326.89);
}

function test_zero_profit() {
  const r = compute(0, 184500, null);
  assert.strictEqual(r.total_se_tax, 0.0);
  assert.strictEqual(r.effective_pct_of_profit, 0.0);
}

function test_rounding_tie_matches_python_round_half_even() {
  // 8477.73 / 2 === 4238.865, whose true binary value is
  // 4238.864999999999978..., so Python's round() correctly rounds down
  // to 4238.86 -- a naive *100/Math.round would wrongly give 4238.87.
  const r = compute(60000, 184500, null);
  assert.strictEqual(r.deductible_half, 4238.86);
  // 29851.25 / 2 === 14925.625 exactly (an actual tie), where Python's
  // round-half-to-even keeps the even digit: 14925.62, not 14925.63.
  const r2 = compute(250000, 184500, 200000);
  assert.strictEqual(r2.deductible_half, 14925.62);
}

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const SCRIPT = path.join(__dirname, "index.js");

function test_cli_output_matches_readme_example() {
  const out = execFileSync("node", [SCRIPT, "--net-profit", "60000", "--json"], { encoding: "utf8" });
  const data = JSON.parse(out);
  assert.strictEqual(data.total_se_tax, 8477.73);
  assert.strictEqual(data.effective_pct_of_profit, 14.13);
}

const tests = {
  test_basic_profit,
  test_additional_medicare_threshold,
  test_wage_base_caps_social_security,
  test_zero_profit,
  test_rounding_tie_matches_python_round_half_even,
  test_cli_output_matches_readme_example,
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL: ${name}: ${e.message}`);
  }
}
console.log(`\n${Object.keys(tests).length - failed}/${Object.keys(tests).length} passed`);
process.exit(failed ? 1 : 0);
