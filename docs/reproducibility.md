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

Measured per run and shown in the interface.

The quick figure below is measured, not estimated: a fifteen page paper, *Attention Is All You Need*, run end to end against Azure OpenAI and Document Intelligence.

| Depth | Model tokens | Cost | Basis |
| --- | --- | --- | --- |
| Quick | 56k in, 12k out | **$0.41** | measured |
| Standard | roughly 3× quick | around $1.20 | extrapolated |
| Deep | roughly 6× quick | around $2.40 | extrapolated |

Standard and deep are extrapolated from the quick run and have not been measured. Treat them as the right order of magnitude, nothing more.

Document Intelligence is charged per page and is included above at roughly a cent per page. Confirm the current rate for your region; that number is the one most likely to be out of date.

An earlier version of this file estimated quick mode at $0.09. The first real run cost $0.61, because every agent was being handed the entire paper. Scoping each agent to the sections it needs, and replacing page coordinates in prompts with block indexes, brought input tokens down 53% and cost down to $0.41. The estimate was wrong by 7×; measuring it was the only way to find that out.

The rates used for the displayed figure are in `lib/config/pricing.ts`. Change them there if yours differ.

Lookup results are cached for a week, so re-running the same paper costs materially less. The cache hit count is reported alongside the cost.

### Cost of taking a question to a draft

Measured across four real runs against live Azure on 16 August 2026, on the question *whether retrieval augmentation improves multi step reasoning in long context language models*.

| Step | Cost | What ran |
| --- | --- | --- |
| Gathering and mapping | **$0.0149** | 6 papers gathered, evidence mapped, 3 gaps found |
| Proposals and prior art | **$0.0599** | 2 proposals, 79 works searched across 8 lookups |
| Designing the plan | **$0.0059** | steps, measurements, falsifying result |
| Writing the draft | **$0.0261** | 1 figure, 2 tables, 6 sources, 12 citations |
| **Total** | **$0.1068** | question to exportable draft |

This path costs less than checking a single paper because the gathered papers are read as abstracts from OpenAlex rather than through Document Intelligence. No page charge applies, and no full text is fetched. That is a real limit as much as a saving — see below.

## Reproducing a run

Reports carry a `fingerprint`: a SHA-256 over the claim identifiers, citation verdicts, extracted values, conflicts and confidence levels. Two runs of the same paper that reach the same conclusions produce the same fingerprint even though the wording differs.

The fingerprint deliberately excludes the narrative text and the agents' reasoning. Those vary between runs; the conclusions should not.

## Known limits

**One workspace, shared by every account.** Signing in controls who may use the
application, not what they may see. No table records an owner, and every query is
unscoped, so any signed-in account reads and writes the same papers, reports and
projects as every other one. Row level security is switched off and would not help
if it were on: the application talks to Postgres directly over `DATABASE_URL`
through Drizzle, which bypasses it entirely.

This was a deliberate choice for a hackathon submission, where the point is that a
reviewer signs in and immediately finds a finished report and a finished project
instead of an empty screen. It is not defensible beyond that. Making it
multi-tenant means adding an owner column to `documents` and `projects`, filtering
every read and write by the signed-in account, and backfilling what already exists.
Until that is done, treat anything uploaded here as visible to everyone with an
account.

**Scanned PDFs.** Document Intelligence reads them, but a reference list rendered as an image cannot be matched to citation markers in the body, so citation checking degrades to nothing. The report says so.

**Paywalled sources.** Roughly half of cited sources in most fields are not open access. Those are checked against the abstract where one exists, and marked `Could not check` where none does. This is the single largest limit on coverage, and it is a property of academic publishing rather than of this tool.

**Comparison at small scale.** Conflict detection runs on two to ten related papers. That is enough to surface a disagreement worth knowing about, and not enough to be a meta-analysis. Combined values shown for a group are descriptive, not a pooled estimate with proper weighting.

**Citation markers.** Numeric styles such as `[12]` and `12.` are matched reliably. Author-year styles are matched less reliably, and unmatched markers are counted and reported rather than quietly dropped.

**A small calibration set, not a validation.** Twelve cases is an indication, not proof. It covers four failure modes and says nothing about how the system behaves on citation styles, fields or languages outside them. Treat the verdicts as a prompt to look, not as a finding.

**Figures.** Numbers that appear only inside a chart image are not extracted. Only text and tables are read.

**Gathered papers are abstracts, not full text.** On the question-to-draft path, papers found by search enter the project as their OpenAlex abstract. Gaps and proposals are therefore reasoned from abstracts, and every table cell about those papers reads `Not checked`. To reason from checked full text, add the paper to your knowledge base and check it first; it then joins the project with its verdicts attached.

**A gap in these papers is not a gap in the field.** The gap finder is told this explicitly and its output is worded accordingly, but the constraint is structural: ten papers cannot tell you what an entire literature has not done.

**`Nothing found` is not novelty.** The prior art checker reports the number of works it searched and the phrases it used, and the draft carries both. A verdict of nothing found means those searches, on OpenAlex, on that day. It has never been a claim that the idea is new, and the interface does not present it as one.

**No LaTeX toolchain on the server.** PDF export goes through the browser's print view of a styled HTML preview, which is why the preview and the `.tex` are rendered from the same agent output by two separate renderers. The `.tex` is not compiled or validated here — it is written to compile in Overleaf against the exported `verified.bib`.

**English only.** The prompts and the reference parsing assume English.

## Measured accuracy

Twelve citation cases where the correct answer is established independently of this system: real retractions recorded by Crossref or OpenAlex, DOIs that resolve nowhere, claims taken verbatim from a paper's own abstract, and claims taken from a different paper entirely.

Run it with `npm run evaluate`.

| Case type | Correct | Ground truth comes from |
| --- | --- | --- |
| Retracted source | 3 of 3 | The retraction records themselves |
| Fabricated source | 2 of 2 | The DOI resolves in no registry |
| Genuine citation | 3 of 4 | The claim is the paper's own abstract |
| Claim from another paper | 3 of 3 | Mismatched by construction |
| **Total** | **11 of 12** | **$0.14 for the full set** |

The one failure is the useful one. Asked to verify a claim against the BERT paper, the source text could not be retrieved, and the system returned `Could not check` rather than guessing. That is the designed behaviour: it declines to assert rather than asserting wrongly. It also shows the real ceiling — a citation whose source cannot be read cannot be verified, however obviously true the claim is.

Building this set found a live defect. Retraction checking consulted only Crossref, whose `update-to` field does not record the 1998 Wakefield MMR retraction or the 2020 NEJM Surgisphere retraction. Both are recorded by OpenAlex. The check now consults both registries and reports which one carried the record; before that fix, two of the three most famous retractions in modern science passed as clean.

## Determinism

The run is not bit-for-bit reproducible. Temperature is zero for most agents but not all, external APIs return different results as their indexes change, and the retraction status of a source can genuinely change between runs. That last one is the point of the watch feature rather than a defect.

What is stable is the structure: the same paper produces the same claims, and the same evidence produces the same verdicts.
