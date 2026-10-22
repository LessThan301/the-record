# Translation review (October 2026)

## How it was checked
- Automated: every one of the 50 cards exists in all 9 languages, and no field was left in English. A script compared each field against the English text, checked that Chinese, Japanese and Korean fields really use those scripts, and checked European languages for leftover English sentences. Everything was translated. The only hits were quotes and figures that are meant to stay as they are ("My heart goes out to you", "EV ~87–91% vs ICE ~16–25% (EPA)").
- Spot checks by reading: the interface, verdict names, topic names and a sample of cards in every language.

## Fixed
| Language | Card | Problem | Fix |
|---|---|---|---|
| nl | tesla-fire | Typo "voertuiggembiddelde" | "voertuiggemiddelde" |
| ko | tesla-fire | "그리고 나면 더 흉하다" ("and then it's uglier") reads broken | "다만 일단 나면 더 격렬하다" |
| de | ev-nowhere-charge | Kilometers "gewonnen" (literal from English "won") | "geladen" (2 places) |

## Doubtful (needs a native speaker before launch)
1. **Literal tone everywhere.** The English cards are punchy and full of idioms ("Norway already voted", "arguing with a ghost"). The translations follow them word for word, for example in German "Norwegen hat schon abgestimmt" and "diskutiert man mit einem Geist". It's understandable, but it doesn't sound natural. Worst in de, nl, ja, ko.
2. **US units in European and Asian versions.** Many cards use miles and US-only statistics ("per 135 million miles", "98% of trips ≤75 miles", zh/ja/ko keep "miles"). That's fine as a citation, but readers in Europe and Asia expect km. Adding km in brackets would help.
3. **Chinese, Japanese and Korean** were machine-quality translations with no native review. The checked samples are correct but stiff. The "I believe this" button reads oddly in ko ("이게 맞다고 본다") and ja ("これは本当だと思う"). Both are acceptable, though a native speaker might choose something shorter.
4. **Local sources are uneven.** German cards have local sources on 30 cards. es has 7, fr 3, it/nl/ko 1 each, zh/ja none, so those fall back to English sources.
5. **Legal pages** (Disclaimer, Terms, Trademarks) are translated in all languages, but no lawyer has checked them. The Impressum and privacy policy are German (binding) plus English only.
6. **Sensitive cards** (elon-salute, elon-apartheid, cap-*): wording that's acceptable in English can read as harsher or softer in translation. A native speaker should read these first.
