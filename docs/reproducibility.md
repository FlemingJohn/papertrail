# Reproducibility

## Models

| Purpose | Model | Where |
| --- | --- | --- |
| All twenty-four agents | GPT-4o | Azure OpenAI, api-version `2025-01-01-preview` |
| PDF to structured text | `prebuilt-layout` | Azure Document Intelligence, service version `2024-11-30` |

Every agent uses strict JSON schema mode, so the model is constrained to the exact output shape and the result is validated with Zod before it enters the report. A validation failure is retried with the error text, twice.

Temperature is 0 for anything that resolves or judges, and between 0.1 and 0.3 for the agents that argue or write. `number-reader-two` runs at 0.15 rather than 0 so that its reading is genuinely independent of `number-reader-one` rather than a copy.

## Data sources

| Source | Used for | Key needed |
| --- | --- | --- |
| OpenAlex | reference resolution, related paper search, reference lists | no |
| Crossref | retraction and correction status | no |
| Europe PMC | full text of open access sources | no |

All three are public, free, and require no registration. OpenAlex asks for a contact email in the user agent, which the code supplies from `OPENALEX_CONTACT_EMAIL`.

No proprietary dataset is used. No data is sent anywhere except Azure and those three public APIs.

## Cost

Measured per run and shown in the interface. Approximate figures for a fourteen page paper:

| Depth | Model tokens | Cost |
| --- | --- | --- |
| Quick | about 60k in, 8k out | around $0.09 |
| Standard | about 210k in, 26k out | around $0.35 |
| Deep | about 480k in, 55k out | around $0.78 |

Document Intelligence is charged per page and is included above at roughly a cent per page. Confirm the current rate for your region; that number is the one most likely to be out of date.

The rates used for the displayed figure are in `lib/config/pricing.ts`. Change them there if yours differ.

Lookup results are cached for a week, so re-running the same paper costs materially less. The cache hit count is reported alongside the cost.

## Reproducing a run

Reports carry a `fingerprint`: a SHA-256 over the claim identifiers, citation verdicts, extracted values, conflicts and confidence levels. Two runs of the same paper that reach the same conclusions produce the same fingerprint even though the wording differs.

The fingerprint deliberately excludes the narrative text and the agents' reasoning. Those vary between runs; the conclusions should not.

## Known limits

**Scanned PDFs.** Document Intelligence reads them, but a reference list rendered as an image cannot be matched to citation markers in the body, so citation checking degrades to nothing. The report says so.

**Paywalled sources.** Roughly half of cited sources in most fields are not open access. Those are checked against the abstract where one exists, and marked `Could not check` where none does. This is the single largest limit on coverage, and it is a property of academic publishing rather than of this tool.

**Comparison at small scale.** Conflict detection runs on two to ten related papers. That is enough to surface a disagreement worth knowing about, and not enough to be a meta-analysis. Combined values shown for a group are descriptive, not a pooled estimate with proper weighting.

**Citation markers.** Numeric styles such as `[12]` and `12.` are matched reliably. Author-year styles are matched less reliably, and unmatched markers are counted and reported rather than quietly dropped.

**No calibration study.** The verdicts have not been measured against a labelled set of known-good and known-bad citations. Agreement between the two number readers is reported and is a real measure, but the citation verdicts themselves carry no accuracy figure. Treat them as a prompt to look, not as a finding.

**Figures.** Numbers that appear only inside a chart image are not extracted. Only text and tables are read.

**English only.** The prompts and the reference parsing assume English.

## Determinism

The run is not bit-for-bit reproducible. Temperature is zero for most agents but not all, external APIs return different results as their indexes change, and the retraction status of a source can genuinely change between runs. That last one is the point of the watch feature rather than a defect.

What is stable is the structure: the same paper produces the same claims, and the same evidence produces the same verdicts.
