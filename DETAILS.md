# PaperTrail

**Thirty-two agents that check whether a research paper holds up, and then help you write one that does.**

![PaperTrail](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/banner.jpg)

| | |
| --- | --- |
| **Live application** | https://papertrail-five-ruby.vercel.app |
| **Sign in** | `judge@papertrail.app` · `PaperTrail2026` |
| **Demo video** | https://youtu.be/3Hfrktyd2w4 |
| **Source code** | https://github.com/FlemingJohn/papertrail |
| **Download the film** | https://github.com/FlemingJohn/papertrail/raw/master/docs/papertrail-demo.mp4 |

---

## The problem

A researcher citing a paper is trusting a chain they cannot see.

Checking one citation properly means finding the source, reading it, and comparing what it actually says against what the citing paper claims it says. That takes about **twenty minutes**. A paper with forty references is therefore more than a day of work, which is why it is almost never done — not through carelessness, but because the arithmetic never works out.

Four things follow from that, and all of them are checkable:

**Citations drift.** A finding passes through three papers before you cite it, and somewhere along the way a qualifier falls off. The number survives. The conditions do not.

**Sources get retracted after you cite them.** There is no mechanism that tells you. Two of the most famous retractions in medicine are still accumulating citations today.

**Numbers get transcribed wrong.** Systematic reviews solve this by having two people extract every value independently and adjudicate the differences. That costs weeks of two people's time, so almost nobody outside a formal review does it.

**Methods omit what you would need to repeat the work.** Randomisation, blinding, reagent concentrations, compute environment. Not maliciously — they are simply assumed.

Reviewers cannot close the gap either, for exactly the same reason. There is no time.

---

## The solution

PaperTrail does two jobs, on one team of agents.

### Job one — check a paper you already have

Upload a PDF. It comes back with every claim marked, every citation followed to its source and read, every number extracted twice, and an explicit account of what could not be checked.

![A checked report](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/report-summary.jpg)

That is a real run on *Attention Is All You Need*: 23 citations checked, 13 with problems, reader agreement 0.80 across 5 numbers, 2 disagreements against 5 comparison papers, $0.56, 109 lookups of which 10 were served from cache.

Findings are split into sections so nothing important is buried — citations, numbers, method, conflicts, review, cost.

![Missing method details](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/report-methods.jpg)

Every verdict traces back to a page and a quotation. Click a failing citation and the paper opens at the exact page the sentence came from.

**Roughly half of cited sources sit behind a paywall.** Those come back marked `Could not check` — never `wrong`. A tool that hides its own blind spots earns more trust than it deserves.

### Job two — start from a question you have not answered

Give it a research question and the field it sits in. It gathers papers, drops retracted ones before anything is read, maps what the set has already settled, and finds the openings.

Then it stops, three times, and hands the decision back to you.

![The openings it found](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/project-gaps.jpg)

**Stop one — which openings are real.** Each is marked by how well the papers actually back it: *the papers say this*, *read across the papers*, or *not backed by the papers*.

**Stop two — which proposal is worth the year.** One agent writes proposals. A second is told to assume the idea already exists and to go and find it. It is trying to kill the idea, not defend it.

![The prior art search](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/prior-art.jpg)

Notice what that screen reports: the exact search phrases used, that **40 results came back across multiple databases**, and the honest conclusion that while no study does precisely this, related work exists. `Nothing found` means *nothing found in those forty* — it never means *this is new*.

**Stop three — would the plan actually test the idea**, including the single result that would prove it wrong. A plan that cannot fail is not a test.

Only after all three approvals does it write anything.

![The draft](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/draft.jpg)

The draft can **only cite sources that survived checking**. The bibliography is assembled in code from sources whose citation check passed; the writer is handed that list and no other. Any key it invents anyway is stripped and replaced with a visible marker. Every source left out is listed with the reason. Exports as PDF, or as LaTeX plus a `verified.bib` for Overleaf.

---

## How it flows

![Architecture](https://raw.githubusercontent.com/FlemingJohn/papertrail/master/docs/images/architecture.jpg)

### Checking a paper

**1 — The PDF becomes structured text with coordinates.** Azure Document Intelligence returns a bounding polygon for every paragraph and table cell. Nothing enters the record without one, so provenance is a database constraint rather than a nice-to-have. No model call happens at this stage.

**2 — One agent finds the checkable statements.** Every sentence that reports a result, states a fact, or draws a conclusion. References and acknowledgements are skipped; they carry nothing to check.

**3 — Four lanes run at once**, each scoped to only the sections it needs:

| Lane | What happens | Agents |
| --- | --- | --- |
| Citations | Resolve the reference, check it for retraction, then two agents argue — one that the citation fails, one that it holds, neither seeing the other. A third reads both and rules. A fourth traces the finding back through the papers that repeated it. | 5 |
| Numbers | Two agents extract every value independently, blind to each other. A judge resolves disagreements from the source text. The disagreement rate is reported, not hidden. | 3 |
| Methods | One agent rewrites the method as a runnable protocol. A second hunts for what is missing and writes the question to put to the authors. | 2 |
| Related work | Finds 2–10 comparable papers, deliberately including ones likely to disagree. | 2 |

**4 — Everything converges on one typed ledger.** Agents never pass prose to each other. Each appends structured records, and merge reducers let all four lanes write concurrently without clobbering. After this point the PDF stops being the source of truth; later stages read the ledger, which keeps token cost flat as stages accumulate.

**5 — Conflicts, review, and the report.** Conflicting findings are grouped and the differing factor identified. Four reviewers examine statistics, originality, method and evidence separately; a fifth arbitrates. A confidence rater weights every claim, and a writer produces the summary, including an explicit list of what could not be checked.

### Taking a question to a draft

This path does not run on the same graph. It is four separate stage runners, each started by its own request and each ending where a human has to decide something.

```
POST /api/projects                  gather, map, find gaps   -> stop one
POST /api/projects/{id}/gaps        propose, hunt prior art  -> stop two
POST /api/projects/{id}/proposals   design the test          -> stop three
POST /api/projects/{id}/method      write the draft          -> finished
```

A graph interrupt would have held each decision inside a checkpointed run — a browser tab left open overnight, or a serverless function held past its timeout. Making every stop a request boundary instead means the state between them lives in Postgres, where it survives the tab closing, the deploy going out, and the researcher thinking about it for a week.

---

## Why more than one agent

Three of these cannot be done honestly by a single reader.

**Citations** are judged by three agents because one agent asked *"is this citation sound?"* tends to agree with whatever it just read. Splitting prosecution from defence, with a judge who sees both arguments and neither of whom sees the other, removes that.

**Numbers** are extracted twice because that is how systematic reviews have always done it. The agreement rate between two blind readers is a quality measure you can publish; a single extraction gives you no way to know whether it is wrong.

**Reviews** come from four specialists looking at one thing each, so a single reviewer's loudest concern cannot crowd out the others.

**Novelty** is checked adversarially. The proposing agent is forbidden from claiming anything is new. A separate agent assumes the idea exists and goes hunting, then reports the real count of works it searched.

---

## By the numbers

| | Count |
| --- | --- |
| **AI agents** | **32**, one file each |
| **Tools** | **24** — 7 external and document, 17 database |
| Agent-callable tools | 6, the rest are node-invoked only |
| **MCP servers** | **1**, exposing the 6 agent-callable tools over stdio |
| Open data sources | 3 — OpenAlex, Crossref, Europe PMC |
| Verdict states | 8 |
| Pipeline stages | 9 for a check, four of them concurrent |
| Human decision points | 3, on the question-to-draft path |

**Twenty-six of the thirty-two agents have no tools at all.** They transform evidence handed to them. Giving a judge the ability to fetch more evidence turns it into a fourth investigator, which is not what the stage needs.

### The agents

| Stage | Agents |
| --- | --- |
| find-claims | claim-finder |
| gather-papers | search-planner, paper-picker |
| check-citations | source-finder, source-challenger, source-supporter, source-judge, source-tracer |
| check-numbers | number-reader-one, number-reader-two, number-judge |
| check-methods | method-writer, method-checker |
| find-conflicts | conflict-finder, conflict-explainer |
| review-paper | review-statistics, review-originality, review-method, review-evidence, review-summary |
| write-report | confidence-rater, report-writer |
| watch | change-finder, change-rater |
| map-evidence | evidence-mapper |
| find-gaps | gap-finder |
| propose | novelty-maker |
| check-prior-art | prior-art-checker |
| design-method | method-designer |
| draft | table-writer, diagram-writer, paper-writer |

---

## Does it actually work

A test was built from twelve papers where the right answer was already known.

| Case type | Result |
| --- | --- |
| Real retractions | 3 of 3 |
| Fabricated identifiers | 2 of 2 |
| Genuine citations | 3 of 4 |
| Mismatched claims | 3 of 3 |
| **Total** | **11 of 12, for $0.14** |

The one it missed returned `could not check` rather than guessing, which is the failure mode worth having.

Building that test also found a real defect. The retraction check was missing two of the most famous retractions in medicine, because querying Crossref alone was not enough. Adding OpenAlex as a second source fixed it.

---

## Cost

Measured on live Azure, not estimated, and displayed in the interface for every run.

| | Cost |
| --- | --- |
| Checking one paper, standard depth | **$0.26 – $0.56** depending on citation count |
| A question taken all the way to a draft | **$0.13** |
| The twelve case evaluation | **$0.14** |

The question-to-draft figure is the sum of four real runs: gathering and mapping six papers ($0.0149), two proposals with 79 works searched between them ($0.0599), the plan ($0.0059), and the draft with its figures, tables and bibliography ($0.0261).

Cost came down **37%** during development — prompt caching, then scoping each agent to the sections it needs, then reusing stored extractions so Document Intelligence never re-reads a paper. An early estimate of $0.09 turned out to be $0.61 on the first real run; measuring it was the only way to find that out, and the documentation was corrected rather than quietly left.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Orchestration | **LangGraph 1.4** (TypeScript) | Typed state with merge reducers, so four lanes write concurrently without clobbering |
| Model | **GPT-4o** via Azure OpenAI | One model throughout, with real token accounting including cache reads |
| Document reading | **Azure Document Intelligence**, prebuilt-layout | Returns a bounding polygon per block, which is what makes provenance enforceable |
| Interface | **Next.js 16**, React 19 | Server components, plus NDJSON streaming for live agent reasoning |
| Database | **Supabase Postgres** with Drizzle ORM | Pooled connection on 6543, typed schema, migrations in the repo |
| Authentication | **Supabase Auth** via `@supabase/ssr` | Session verified with `getClaims()`, enforced in a Next 16 proxy |
| Integration | **Model Context Protocol** | Six lookup tools exposed over stdio to any MCP client |
| Deployment | **Vercel** | Verified: a full 162.7 second check completes cleanly in production |
| Evidence | **OpenAlex · Crossref · Europe PMC** | All open, no proprietary corpus |

**No embedding model and no vector database.** Citation checking is a resolution problem, not a similarity problem: a reference either resolves to a real source or it does not. Introducing embeddings would add a component that can be confidently wrong.

### Two design rules that shaped the code

**Every external call goes through a typed tool.** No agent touches HTTP directly. A tool never throws into agent context — it returns a typed failure — which is why `Could not check` is a real verdict rather than a crash.

**Structure comes from the model, markup comes from code.** Agents describe figures as boxes and arrows, and tables as cells. The TikZ, the SVG and the LaTeX are generated in code from that description. An arrow pointing at a box that does not exist is dropped before either renderer sees it, and a citation key the writer invented is stripped before it reaches the bibliography. Hallucinated coordinates and invented citations are made structurally impossible rather than merely discouraged.

---

## Business impact

**For a researcher.** Checking forty citations by hand is more than a day. This does it for the price of a coffee and produces an auditable record — every verdict tied to a page and a quotation, so the work can be defended rather than merely asserted.

**For a reviewer.** A reviewer given a paper and a report knows within a minute which claims to interrogate. The 43% figure on the report above is the kind of signal that changes how a review is spent.

**For a lab.** Meta-analysis data extraction conventionally requires two people working independently for weeks. Two blind agents plus an adjudicator, with the disagreement rate reported, is the same protocol at a fraction of the cost.

**For anyone about to spend a year on an idea.** The prior-art check is the highest-leverage part. Learning that close work already exists costs an afternoon here. Learning it in peer review costs a year.

**The honest limit.** This does not replace judgement, and it is not designed to. Half of cited sources are paywalled and come back unverified. Ten papers cannot tell you what an entire field has not done. Every screen is built to say what it does not know, because a checking tool that overstates its coverage is worse than no tool at all.

---

## Watch it run

**https://youtu.be/3Hfrktyd2w4**

Eight minutes: the problem, the thirty-two agents, both halves of the product running live, and the measured results. Everything on screen is the real application reading the real database.

The narration was written and voiced first so that every word carries a timestamp; the screen recording was then driven against those timings, which is why the cursor arrives as each sentence lands. Nothing is sped up and no frame is staged.

**Download the file directly:** https://github.com/FlemingJohn/papertrail/raw/master/docs/papertrail-demo.mp4

---

## Try it

**https://papertrail-five-ruby.vercel.app** — sign in with `judge@papertrail.app` and `PaperTrail2026`.

There is a finished report waiting and a completed research project with its openings, proposals, prior-art verdicts and an exported draft. Eight open access test papers are in the repository under `papers/` if you want to run one yourself; `raynaud-botulinum-trial.pdf` at 127 KB is the cheapest way to watch the whole pipeline work.

Signing in gates the application but does not partition the data — every account shares one workspace. That is deliberate for this submission, so a reviewer finds a populated application rather than an empty one, and it is recorded as a known limitation in the reproducibility notes.

---

## Documentation

| | |
| --- | --- |
| Architecture | https://github.com/FlemingJohn/papertrail/blob/master/docs/architecture.md |
| Reproducibility, costs and known limits | https://github.com/FlemingJohn/papertrail/blob/master/docs/reproducibility.md |
| Setup | https://github.com/FlemingJohn/papertrail/blob/master/docs/setup.md |
| Deploying | https://github.com/FlemingJohn/papertrail/blob/master/docs/deploying.md |
