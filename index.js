#!/usr/bin/env node
"use strict";

const SS_RATE = 0.124;
const MEDICARE_RATE = 0.029;
const NET_EARNINGS_FACTOR = 0.9235; // the 92.35% adjustment baked into Schedule SE

// Matches Python's round(n, 2): correctly-rounded decimal with ties-to-even,
// based on the exact binary value rather than a naive *100 multiply (which
// can itself introduce a spurious tie, e.g. 4238.864999999999978 * 100 ===
// 423886.5 in IEEE 754 even though the true value is strictly below .5).
function round2(n) {
  if (n === 0) return 0;
  const neg = n < 0;
  const ax = Math.abs(n);
  // toFixed(20) on a double gives its exact decimal expansion (doubles have
  // finite binary fractions, so this never loses precision like toString()'s
  // shortest-round-trip mode could in a tie-detection context).
  let s = ax.toFixed(20);
  let [intPart, fracPart] = s.split(".");
  const keep = fracPart.slice(0, 2);
  const rest = fracPart.slice(2);
  let roundUp;
  if (rest[0] > "5") roundUp = true;
  else if (rest[0] < "5") roundUp = false;
  else {
    const restAfter = rest.slice(1).replace(/0+$/, "");
    if (restAfter.length > 0) roundUp = true;
    else roundUp = parseInt(keep[1] || "0", 10) % 2 === 1; // tie: round to even
  }
  let keepNum = BigInt(intPart + keep.padEnd(2, "0"));
  if (roundUp) keepNum += 1n;
  const result = Number(keepNum) / 100;
  return neg ? -result : result;
}

// mirrors Python's repr() of a float: integers keep a trailing ".0",
// everything else prints as the shortest round-trip decimal.
function asFloat(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

function compute(netProfit, wageBase, additionalMedicareThreshold) {
  const base = netProfit * NET_EARNINGS_FACTOR;
  const ss = Math.min(base, wageBase) * SS_RATE;
  const medicare = base * MEDICARE_RATE;
  let additionalMedicare = 0.0;
  if (additionalMedicareThreshold !== null && additionalMedicareThreshold !== undefined && base > additionalMedicareThreshold) {
    additionalMedicare = (base - additionalMedicareThreshold) * 0.009;
  }
  const total = ss + medicare + additionalMedicare;
  return {
    net_earnings_for_se_tax: round2(base),
    social_security_tax: round2(ss),
    medicare_tax: round2(medicare),
    additional_medicare_tax: round2(additionalMedicare),
    total_se_tax: round2(total),
    deductible_half: round2(total / 2),
    quarterly_payment: round2(total / 4),
    effective_pct_of_profit: netProfit ? round2((total / netProfit) * 100) : 0.0,
  };
}

function toJson(r) {
  return [
    "{",
    `  "net_earnings_for_se_tax": ${asFloat(r.net_earnings_for_se_tax)},`,
    `  "social_security_tax": ${asFloat(r.social_security_tax)},`,
    `  "medicare_tax": ${asFloat(r.medicare_tax)},`,
    `  "additional_medicare_tax": ${asFloat(r.additional_medicare_tax)},`,
    `  "total_se_tax": ${asFloat(r.total_se_tax)},`,
    `  "deductible_half": ${asFloat(r.deductible_half)},`,
    `  "quarterly_payment": ${asFloat(r.quarterly_payment)},`,
    `  "effective_pct_of_profit": ${asFloat(r.effective_pct_of_profit)}`,
    "}",
  ].join("\n");
}

function fmt2(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseArgs(argv) {
  const out = { netProfit: null, wageBase: 184500, additionalMedicareThreshold: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--net-profit") out.netProfit = Number(argv[++i]);
    else if (a === "--wage-base") out.wageBase = Number(argv[++i]);
    else if (a === "--additional-medicare-threshold") out.additionalMedicareThreshold = Number(argv[++i]);
    else if (a === "--json") out.json = true;
  }
  return out;
}

function printHelp() {
  console.log(`freelance-tax-js - estimate US self-employment tax (15.3%) on freelance net profit. Not tax advice.

Usage:
  freelance-tax --net-profit N [--wage-base N] [--additional-medicare-threshold N] [--json]

Run without installing:
  npx github:kleogeos/freelance-tax-js --net-profit 60000
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const args = parseArgs(argv);
  if (args.netProfit === null) {
    console.error("error: --net-profit is required");
    printHelp();
    process.exit(1);
  }

  const r = compute(args.netProfit, args.wageBase, args.additionalMedicareThreshold);

  if (args.json) {
    console.log(toJson(r));
    return;
  }

  console.log(`Estimated self-employment tax: $${fmt2(r.total_se_tax)}\n`);
  console.log(`Net earnings for SE tax (92.35%)   ${fmt2(r.net_earnings_for_se_tax)}`);
  console.log(`Social Security (12.4%)            ${fmt2(r.social_security_tax)}`);
  console.log(`Medicare (2.9%)                     ${fmt2(r.medicare_tax)}`);
  if (args.additionalMedicareThreshold !== null) {
    console.log(`Additional Medicare (0.9% above threshold)  ${fmt2(r.additional_medicare_tax)}`);
  }
  console.log(`Deductible half (line 13, Schedule 1)  ${fmt2(r.deductible_half)}`);
  console.log(`~Quarterly estimated payment         ${fmt2(r.quarterly_payment)}`);
  console.log(`Effective % of net profit            ${r.effective_pct_of_profit.toFixed(2)}%`);
  console.log("\nThis excludes federal/state income tax. An estimate, not tax advice — verify with a CPA or irs.gov.");
}

if (require.main === module) {
  main();
}

module.exports = { compute };
