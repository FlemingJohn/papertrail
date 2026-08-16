# Test papers

Eight open access papers for exercising PaperTrail. All are freely redistributable, which is why they can sit in the repository at all.

They are here so anyone reviewing this project can upload a real paper and watch the tool work, without first going to find one. Add any of them at `/knowledge`, then check it at `/check`.

## Machine learning, from arXiv

Numeric citation markers, dense results tables, and reference lists that often carry no DOI. Good for exercising the title-fallback path in the source finder, and for seeing `Source not found` reported honestly.

| File | Paper | Why it is here |
| --- | --- | --- |
| `attention-is-all-you-need.pdf` | Vaswani et al. 2017 | The baseline. 15 pages, BLEU tables, `[13]` style markers. Every measured cost figure in the docs comes from this one. |
| `adam-optimizer.pdf` | Kingma & Ba 2014 | Heavy on stated hyperparameters. Stresses the method checker. |
| `resnet-deep-residual-learning.pdf` | He et al. 2015 | Many results tables. Stresses the two number readers and their agreement score. |
| `bert.pdf` | Devlin et al. 2018 | Long reference list. Stresses citation matching at volume. |

## Clinical trials, from Europe PMC

These are where the tool is strongest. Randomised controlled trials cite journal articles with real DOIs, so source resolution, retraction checking and full text reading all actually fire — unlike arXiv preprints, where half the references resolve to nothing.

| File | Why it is here |
| --- | --- |
| `raynaud-botulinum-trial.pdf` | Smallest file here at 127 KB. Use it for a cheap end to end smoke test. |
| `alzheimers-electroacupuncture-trial.pdf` | Reports effect sizes with confidence intervals. Good for the number readers. |
| `lumbar-microdiscectomy-trial.pdf` | Explicit randomisation and blinding, so the method checker should come back fairly clean. |
| `parkinsons-acupuncture-trial.pdf` | Multicentre, so the conflict finder has something to compare against. |

## Suggested order

1. `raynaud-botulinum-trial.pdf` on **quick** — cheapest way to confirm the pipeline runs.
2. `attention-is-all-you-need.pdf` on **quick** — compare against the figures in `docs/reproducibility.md`.
3. Upload the same file twice — the second run should say *"Reusing the stored reading"* and bill zero pages.
4. Any clinical trial on **standard** — the only way to exercise conflicts and the five reviewer agents.

## A note on what to expect

The arXiv papers will produce more `Source not found` verdicts than the clinical trials. That is the reference style, not a fault: preprint bibliographies frequently omit DOIs, and a title search below 0.6 confidence is reported as not found rather than guessed at.
