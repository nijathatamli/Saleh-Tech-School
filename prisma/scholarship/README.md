# Scholarship question bank ("Reqamsal Gələcək")

`questions.json` + `media/` are generated from the DOCX files in `/questions`:

```
questions/*.docx ──parse──▶ prisma/scholarship/{questions.json, media/} ──sync──▶ database ──▶ exam API
 npm run scholarship:parse                      npm run scholarship:sync  (also runs in `npm run build`)
```

* The class category comes from the **file name** (`3-4 SİNİFLƏR (1).docx` → key `3-4`, label `3–4-cü sinif`).
  Add a file named `<from>-<to> SİNİFLƏR*.docx` (or `<n> SİNİFLƏR*.docx`), re-parse, re-sync — the
  registration form picks the new class up automatically.
* `scripts/scholarship/overrides.mjs` holds the manual corrections (each with a `note`). Everything
  else is taken from the DOCX as-is, including the answer keys at the end of each file.
* Word equations become MathML, images are stored in the DB (`ScholarshipMedia`) and served only to a
  signed-in candidate who started the exam, for their own class.
* Re-syncing is safe while candidates are taking the exam: questions are updated in place; stale ones are
  only deleted when no attempt exists.

## Things to confirm with the teachers

* **3–4 English** has no answer key in the DOCX. The 5 answers (A, C, A, D, C) were derived — please confirm.
* **7–8 Math 1 #5 and #7** had typos caused by Word shapes (`6a4b⁹`, `3/2`); fixed to `6a⁵b⁵` and `x/2`, the only
  readings that reproduce the key's answers.
* **9–10 Math 1 #8 and #9** figures were Word line-drawings (not extractable); redrawn schematically from the text.
* **1–2 Logic #10** has a numeric key (`4`) and no choices → typed answer.
* **7–8 Math 2** is numbered 1–4, 14–17, 19–20 in the source (10 questions); **9–10 Math 2 #5** has only four
  choices (a stray "E)" swallowed the next question's number); **9–10 Math 2 #10** lists "6 sm" twice.
* **11-ci sinif** has no English section; **Math has two parts** (Riyaziyyat 1 + 2) and both are used.
* Answer keys were **not** independently solved, apart from spot checks.

## How the exam is built per candidate

* Registration needs an unused 32-character **course code** (generated in `/admin/scholarship`); there is no login.
* Logic and English: every question of the class. **Math: 10 questions drawn at random from the class's math pool**
  (both "Riyaziyyat" parts together; classes with only 10 get all 10). The draw is frozen when the exam starts.
* Marks are stored (`ScholarshipAttempt`) and shown only in the admin panel; the scholarship % comes from
  `scholarshipFor()` in `src/lib/scholarship/config.ts`: minimum 60% for everyone who finishes; 70%+ → 70, 80%+ → 80, 90%+ → 90 (the steps above 60 are an assumption).

## Languages (Azerbaijani / English / Russian)

* The candidate picks the exam language on the registration form (stored in `ScholarshipStudent.language`).
* Azerbaijani is the base text. English and Russian versions of every **Logic and Math** question live in
  `scripts/scholarship/translations/<class>.mjs`; `parse-questions.mjs` merges them into `questions.json`
  (`translations.en / .ru`), checking that every formula placeholder and every number survived.
* The **English** subject is an English test, so it is the same in all three languages.
* Word puzzles that only work in Azerbaijani (e.g. 11-ci sinif Logic #9, 3–4 Logic #10) keep the Azerbaijani
  words with a note; scrambled-word puzzles were rebuilt with English / Russian words (same odd-one-out position).
* Pictures that contain Azerbaijani text (a few Logic/Math figures) cannot be translated; the question text
  above them is translated.
* Translations were written by me (an AI) — have an English/Russian-speaking teacher proof-read them.
