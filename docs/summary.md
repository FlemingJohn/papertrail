# Project summary

Researchers cite papers they have not verified. Checking one citation properly —
find the source, read it, compare what it says against what it was cited for —
takes about twenty minutes. Forty citations is more than a day, so it is never
done. Qualifiers fall away while numbers survive, and sources get retracted
years after people cite them.

PaperTrail puts thirty-two agents on that work, each in its own file. A citation is
judged by three: one argues it fails, one argues it holds, neither sees the other,
and a third rules. Numbers are extracted twice by blind readers and
adjudicated. Four lanes run at once and append typed records to one evidence
ledger; twenty-six have no tools at all.

Evidence comes from OpenAlex, Crossref and Europe PMC. Azure Document Intelligence
keeps the page and position of every block, so every verdict traces back to a page
and a quotation.

On twelve ground-truth cases it scored eleven correct for fourteen cents; the one
it missed reported "could not check" rather than guessing. It then turns a research
question into a draft that can only cite sources which survived checking, stopping
three times for the researcher to decide.
