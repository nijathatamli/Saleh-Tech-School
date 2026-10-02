// Manual corrections for things the DOCX files do not state cleanly. Keyed by category,
// then "<SUBJECT>:<part>#<number>". Every entry is a deliberate human decision — keep the
// `note` so the next person knows why it exists. Re-run parse-questions.mjs after editing.

const sup = (s) => `<sup>${s}</sup>`;

export const OVERRIDES = {
  "1-2": {
    // Open-answer question: the DOCX answer key says "4" and the figure has no options.
    "LOGIC:1#10": { options: [], answerText: "4", note: "Answer key gives a number (4), not a letter; the picture has no answer choices, so it is a typed answer." },
  },

  "3-4": {
    // The DOCX has no answer key for the English section at all. These five are simple
    // enough to be unambiguous, but they were derived, not copied — please confirm.
    "ENGLISH:1#1": { answer: "A", note: "DERIVED: no key in DOCX. 6-letter classroom word you write with = Pencil." },
    "ENGLISH:1#2": { answer: "C", note: "DERIVED: no key in DOCX. 4 books, gives 2, keeps 2." },
    "ENGLISH:1#3": { answer: "A", note: "DERIVED: no key in DOCX. Birthday cake / card / party." },
    "ENGLISH:1#4": { answer: "D", note: "DERIVED: no key in DOCX. A fish does not swim because it is flying." },
    "ENGLISH:1#5": { answer: "C", note: "DERIVED: no key in DOCX. Only C breaks 'Emma is older than Noah' (7 < 8)." },
  },

  "7-8": {
    "MATH:1#5": {
      note: "Source typo: denominator reads 6a4b⁹ (shape overlay). Only 6a⁵b⁵ reproduces the key's answer A (12a²b⁷); fixed accordingly.",
      stem: `<math><mfrac><mrow><msup><mrow><mo>(</mo><mo>−</mo><mn>3</mn><msup><mi>a</mi><mn>2</mn></msup><msup><mi>b</mi><mn>3</mn></msup><mo>)</mo></mrow><mn>2</mn></msup><mo>·</mo><msup><mrow><mo>(</mo><mn>2</mn><mi>a</mi><msup><mi>b</mi><mn>2</mn></msup><mo>)</mo></mrow><mn>3</mn></msup></mrow><mrow><mn>6</mn><msup><mi>a</mi><mn>5</mn></msup><msup><mi>b</mi><mn>5</mn></msup></mrow></mfrac></math> ifadəsini sadələşdirin.`,
      options: [
        { label: "A", html: `12a${sup(2)}b${sup(7)}` },
        { label: "B", html: `−12a${sup(3)}b${sup(7)}` },
        { label: "C", html: `36a${sup(5)}b${sup(6)}` },
        { label: "D", html: `16a${sup(4)}b${sup(7)}` },
      ],
    },
    "MATH:1#7": {
      note: "Source typo: second equation shows 3/2 where x/2 is meant (only x/2 gives x+y=12, the key's answer C).",
      stem: `<math><mrow><mo>{</mo><mtable><mtr><mtd><mfrac><mrow><mn>2</mn><mi>x</mi></mrow><mn>3</mn></mfrac><mo>+</mo><mfrac><mi>y</mi><mn>2</mn></mfrac><mo>=</mo><mn>7</mn></mtd></mtr><mtr><mtd><mfrac><mi>x</mi><mn>2</mn></mfrac><mo>−</mo><mfrac><mi>y</mi><mn>3</mn></mfrac><mo>=</mo><mn>1</mn></mtd></mtr></mtable></mrow></math> tənliklər sistemini həll edin. x+y ifadəsinin qiymətini tapın.`,
    },
  },

  "9-10": {
    "MATH:1#8": {
      note: "Figure was drawn with Word line shapes (not extractable); redrawn schematically from the problem text (not to scale).",
      figures: ["9-10-math1-8.svg"],
    },
    "MATH:1#9": {
      note: "Figure was drawn with Word line shapes (not extractable); redrawn from the problem text. AD=14 follows from BE=5 and ∠A=60° (perimeter 64 = key B). Option D had a stray '60°' label from the shape.",
      figures: ["9-10-math1-9.svg"],
      options: [
        { label: "A", html: "54" },
        { label: "B", html: "64" },
        { label: "C", html: "72" },
        { label: "D", html: "90" },
      ],
    },
    "MATH:2#6": {
      note: "The DOCX had a stray 'E) 06.' (typo for the question number) glued in front of the stem; removed.",
      stem: `<math><mn>36</mn><mi>x</mi><mo>²</mo><mo>-</mo><mi>y</mi><mo>²</mo><mo>+</mo><mn>12</mn><mi>x</mi><mo>+</mo><mn>1</mn></math> çoxhədlisini vuruqlara ayırın.`,
    },
    "LOGIC:1#6": { optionCount: 5, note: "Answer choices A–E are part of the picture." },
    "LOGIC:1#7": { optionCount: 5, stem: "Qanunauyğunluğa görə ? işarəsinin yerinə uyğun ədədi tapın.", note: "Question text and choices A–E are part of the picture." },
  },
};
