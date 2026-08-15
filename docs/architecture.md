# Architecture

## The shape of a run

```
                          PDF upload
                              |
                    +---------v---------+
                    |    read-paper     |  Azure Document Intelligence
                    |  no model call    |  keeps page and position on
                    +---------+---------+  every paragraph and table
                              |
                    +---------v---------+
                    |   find-claims     |  1 agent
                    +---------+---------+
                              |
        +---------------+-----+-----+---------------+
        |               |           |               |
+-------v------+ +------v------+ +--v-----------+ +-v-------------+
|gather-papers | |check-       | |check-numbers | |check-methods  |
|              | |citations    | |              | |               |
| 2 agents     | | 5 agents    | | 3 agents     | | 2 agents      |
+-------+------+ +------+------+ +--+-----------+ +-+-------------+
        |               |           |               |
        +-------+-------+           |               |
                |                   |               |
        +-------v-------------------v----+          |
        |        find-conflicts          |          |
        |          2 agents              |          |
        +---------------+----------------+          |
                        |                           |
        +---------------v---------------------------v---+
        |                review-paper                    |
        |                  5 agents                      |
        +------------------------+-----------------------+
                                 |
                    +------------v------------+
                    |      write-report       |  2 agents
                    +------------+------------+
                                 |
                              Report
```

Four lanes run at once after claims are found. `find-conflicts` waits for both the comparison papers and the extracted numbers. `review-paper` waits for all three checking lanes, because a reviewer with only part of the evidence produces a review that has to be redone.

## The twenty-four agents

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

Each lives in its own file under `lib/agents/definitions/`. An agent is a name, a stage, a prompt, an output schema, a tool list and a temperature. Nothing else.

Sixteen of the twenty-four have no tools at all. They transform evidence they were handed. Giving a judge the ability to go and fetch more evidence turns it into a fourth investigator, which is not what the stage needs.

## How agents exchange state

Agents never pass prose to each other. Each writes a typed record into the graph state, and later stages read the state.

`lib/graph/state.ts` defines merge reducers so that the three checking lanes can write concurrently without overwriting one another. That reducer is the reason the lanes can run in parallel at all.

After `check-methods` finishes, the original PDF stops being the source of truth. `find-conflicts`, `review-paper` and `write-report` read the accumulated findings, not the paper. This keeps the token cost flat as stages accumulate.

## Where the evidence comes from

| Source | Used for | Cost |
| --- | --- | --- |
| Azure Document Intelligence | PDF to structured text with page positions | per page |
| OpenAlex | resolving references, searching related work | free, no key |
| Crossref | retraction and correction status | free, no key |
| Europe PMC | full text of open access sources | free, no key |

There is no vector database. At the scale this runs at, the uploaded paper is about twelve thousand tokens and five comparison papers are about fifty thousand, so both fit inside GPT-4o's context window whole. Retrieval sits behind one function in `lib/graph/context.ts`, so adding a vector store later does not touch any agent.

## Every external call is a tool

Nothing calls `fetch` outside `lib/tools/`. Every external effect goes through `defineTool`, which adds caching, retry with backoff, a timeout, a call log and typed failures in one place.

A tool never throws into agent context. It returns a typed failure the agent can reason about, which is why `Could not check` exists as a real verdict instead of a crashed run.

Because every tool carries a name, a description and a schema, the MCP server in `mcp/server.ts` is a loop over the registry.

## Live reasoning

Each agent's output schema is wrapped as `{ thinking, result }`. Because JSON keys arrive in schema order, the reasoning streams first.

`lib/agents/thinking-extractor.ts` reads the partial JSON as it arrives and emits the reasoning text incrementally. `lib/graph/writer.ts` pushes those through LangGraph's custom stream mode, the route handler writes them as newline delimited JSON, and `lib/client/use-run-stream.ts` turns them back into typed events.

The result is that you watch each specialist think, in its own words, while it works.

## Watching a paper over time

A finished report is stored whole, as a single immutable jsonb row. That matters: when a comparison runs three months later, the earlier side must be what the earlier check actually concluded, not a live join across rows that have since moved.

Papers are keyed by a SHA-256 of the file itself, so uploading the same PDF again adds a second report to the same paper rather than creating a duplicate.

```
  stored report N-1        stored report N
          |                       |
          +----------+------------+
                     |
          compare-reports.ts          plain code, no model
          verdict shifts, retractions,
          value moves, confidence moves,
          conflicts opened and closed
                     |
              any difference?
                no |      | yes
                   |      v
                   |  change-finder     turns the structural diff into
                   |                    changes with a stated cause
                   |      |
                   |      v
                   |  change-rater      decides whether a human should
                   |                    be interrupted
                   |      |
                   +------+
                          v
                  watch_checks + detected_changes
```

The split between the two agents is the same separation used everywhere else in the system: one finds what is true, the other decides what it means. Keeping them apart is what stops every small update from becoming a notification.

The diff itself is deliberately not an agent. Comparing two verdicts for equality is exact, cheap and cannot hallucinate. The model is only asked for the two things code cannot do: explaining what caused a change, and judging whether it matters.

A check needs two stored reports. With one, the watch reports honestly that there is nothing yet to compare against.

## When things fail

| Situation | What happens |
| --- | --- |
| A DOI does not resolve | Fall back to title search; below 0.6 match confidence, report not found |
| A source is behind a paywall | Fall back to the abstract; if that fails, verdict is `Could not check` |
| A cited source is retracted | Skip the argument stage entirely and mark it immediately |
| The two number readers disagree | A judge resolves it; if the text is ambiguous, status is `still-disputed` |
| Fewer than two comparison papers | Skip conflict detection and record it as a limitation |
| An agent returns malformed output | Retry with the validation error, up to its retry limit |
| A review lens fails | The other three still produce a review, and the gap is recorded |
| The database is unreachable | The check completes and the report is shown; a warning says it was not saved and cannot be watched |
| A watched paper has only one report | The check reports that there is nothing to compare against yet |
| The importance rating fails | The changes are surfaced as medium rather than swallowed |

Every degradation appears in the report's limitations list. Nothing fails silently.
