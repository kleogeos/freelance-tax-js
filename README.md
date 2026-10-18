# freelance-tax-js

Estimate US self-employment tax (15.3%) on freelance net profit — Social Security + Medicare, the deductible half, and a quarterly payment breakdown. Zero dependencies, runs via `npx` straight from GitHub — nothing leaves your machine. Node.js port of [freelance-tax-cli](https://github.com/kleogeos/freelance-tax-cli) (Python), byte-for-byte verified against it, including the rounding tie-breaking (ties-to-even, matching Python's `round()`, not JavaScript's `Math.round()`).

```bash
npx github:kleogeos/freelance-tax-js --net-profit 60000
```

```
Estimated self-employment tax: $8,477.73

Net earnings for SE tax (92.35%)   55,410.00
Social Security (12.4%)            6,870.84
Medicare (2.9%)                     1,606.89
Deductible half (line 13, Schedule 1)  4,238.86
~Quarterly estimated payment         2,119.43
Effective % of net profit            14.13%

This excludes federal/state income tax. An estimate, not tax advice — verify with a CPA or irs.gov.
```

### Install (optional)

```bash
npm install -g github:kleogeos/freelance-tax-js
freelance-tax --net-profit 60000
```

### Options

| Flag | Default | Meaning |
|---|---|---|
| `--net-profit` | required | Net profit: income minus deductible business expenses |
| `--wage-base` | `184500` | Social Security wage base for the current year — this changes yearly, verify the current figure at irs.gov |
| `--additional-medicare-threshold` | none | If set, also computes the extra 0.9% Additional Medicare Tax above this income threshold (e.g. `200000` for single filers, `250000` married filing jointly) |
| `--json` | off | Output as JSON instead of a formatted table |

### What this does and doesn't cover

Covers the 15.3% self-employment tax (12.4% Social Security + 2.9% Medicare) computed on 92.35% of net profit, same as IRS Schedule SE, plus the deductible half you can claim on Schedule 1 and a rough quarterly estimated-payment split.

Does **not** cover federal or state income tax, which are separate and stacked on top of this. This is an estimate for planning purposes, not tax advice — the wage base and thresholds change yearly, so verify current figures before filing.

There's also a free [browser version](https://kleogeos.github.io/freelancer-tools/self-employment-tax-estimator.html) with the same math if you'd rather not touch Node, a [Python CLI](https://github.com/kleogeos/freelance-tax-cli) if you'd rather not touch npx, and more free tools (invoicing, rate calculator, contract checklist) at [Freelancer Toolbox](https://kleogeos.github.io/freelancer-tools/).

### License

MIT
