# PaperTrail

Checks whether a research paper's citations, numbers and methods hold up, and tells you when that changes.

Upload a PDF. Twenty-four specialists read it, follow every citation back to its source, read the reported numbers twice over independently, list what is missing from the method, compare the findings against related papers, and produce a report where every conclusion traces back to a page and a quotation.

## What it checks

| Check | Question it answers |
| --- | --- |
| Citations | Does the cited paper actually say what this sentence claims it says? |
| Source tracing | Is the cited paper the original source, or is it repeating someone else? |
| Retractions | Has any cited source been retracted? |
| Numbers | Do two independent readers extract the same values from the tables? |
| Methods | What is missing that would stop someone repeating this work? |
| Conflicts | Do related papers disagree, and can that disagreement be explained? |
| Review | What would a careful referee say about the statistics, originality, method and evidence? |
| Watch | Has any of this stopped being true since the last check? |

Every finding carries a verdict in plain words: `Supported`, `Partly supported`, `Not supported`, `Wrong source`, `Indirect source`, `Source not found`, `Retracted`, or `Could not check`.

That last one matters. A source that could not be read is reported as unverified, never as wrong.

## Why more than one agent

Three of the checks cannot be done honestly by a single reader.

**Citations** are judged by three separate agents. One argues the citation does not hold, one argues it does, and neither sees the other's argument. A third reads both and decides. A single agent asked "is this citation sound?" tends to agree with whatever it just read.

**Numbers** are extracted twice, independently, by two agents that never see each other's work. Where they disagree, a third resolves it from the source text. This is how systematic reviews have always been done, and the disagreement rate between the two readers is reported as a quality measure rather than hidden.

**Reviews** come from four specialists looking at one thing each, combined by a fifth. Splitting them stops a single reviewer's strongest concern from crowding out the others.

## Watching a paper

Evidence moves. Sources get retracted, new trials contradict old ones, and a conclusion that held last year quietly stops holding.

Ask PaperTrail to watch a paper and it re-checks on a schedule, compares the new result against the stored one, and tells you only what actually moved and why:

> The combined result fell from +0.44 to +0.19 and now crosses zero. Three new studies finding no effect entered the comparison, all dosed below 50 mg/kg.

One agent finds what changed. A second decides whether it is worth interrupting you for. That second one exists because a watcher that reports everything is a watcher nobody reads.

## Running it

See [docs/setup.md](docs/setup.md). In short:

```bash
npm install
cp .env.example .env.local     # fill in the Azure and Supabase values
npm run dev
```

Then open `http://localhost:3000/check`.

## Using it from an editor

The same lookup tools are exposed over the Model Context Protocol, so a researcher can check a citation from inside any MCP client without opening the web app:

```bash
npm run mcp
```

## Documentation

- [Architecture](docs/architecture.md) — how the twenty-four agents fit together
- [Setup](docs/setup.md) — Azure deployments, environment values, first run
- [Reproducibility](docs/reproducibility.md) — models, data sources, costs, and known limits

## Built with

Next.js 16, React 19, LangGraph 1.4, Azure OpenAI (GPT-4o), Azure Document Intelligence, TypeScript, Tailwind 4.

Evidence comes from OpenAlex, Crossref and Europe PMC, all of which are free and need no key.
