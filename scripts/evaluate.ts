import { config } from "dotenv";
import { caseKindLabels } from "../lib/evaluation/cases";
import { runEvaluation } from "../lib/evaluation/run-evaluation";
import { calculateModelDollars } from "../lib/config/pricing";

config({ path: ".env.local" });

async function main(): Promise<void> {
  process.stdout.write("Checking citations with known answers\n\n");

  const summary = await runEvaluation((message) => {
    process.stdout.write(`  ${message}\n`);
  });

  process.stdout.write("\n");
  process.stdout.write("RESULTS\n");
  process.stdout.write(
    "-------------------------------------------------------------\n"
  );

  for (const outcome of summary.outcomes) {
    const mark = outcome.isCorrect ? "pass" : "FAIL";
    process.stdout.write(
      `${mark}  ${outcome.identifier.padEnd(30)} expected ${outcome.expected.join("|").padEnd(34)} got ${outcome.actual}\n`
    );

    if (!outcome.isCorrect) {
      process.stdout.write(`      ground truth: ${outcome.groundTruth}\n`);
      process.stdout.write(`      it said     : ${outcome.reasoning}\n`);
    }
  }

  process.stdout.write("\nBY CASE TYPE\n");
  for (const group of summary.byKind) {
    process.stdout.write(
      `  ${caseKindLabels[group.kind].padEnd(28)} ${group.correct} of ${group.total}\n`
    );
  }

  const dollars = calculateModelDollars(summary.tokensIn, summary.tokensOut);

  process.stdout.write(
    `\nTOTAL  ${summary.correctCount} of ${summary.totalCount} correct  |  ${summary.tokensIn} in, ${summary.tokensOut} out  |  $${dollars.toFixed(4)}\n`
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Evaluation failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
