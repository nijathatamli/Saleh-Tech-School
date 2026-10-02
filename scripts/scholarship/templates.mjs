// Shared by the translation tooling: turns question HTML into a "template" where every
// MathML block is a numbered placeholder ⟦1⟧, ⟦2⟧… so translators only touch the words and
// the formulas are copied back verbatim (and may be re-ordered for the target language).
export function toTemplate(html) {
  const blocks = [];
  const text = html.replace(/<math>[\s\S]*?<\/math>/g, (m) => {
    blocks.push(m);
    return `⟦${blocks.length}⟧`;
  });
  return { text, blocks };
}

export function fromTemplate(text, blocks) {
  return text.replace(/⟦(\d+)⟧/g, (_, n) => blocks[Number(n) - 1] ?? `⟦${n}⟧`);
}

export const placeholders = (t) => (t.match(/⟦\d+⟧/g) ?? []).sort().join(",");
export const numbersIn = (t) => (t.replace(/<[^>]*>/g, "").match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join(",");
// a text needs translating if, outside formulas, it contains a run of 2+ letters
export const hasWords = (t) => /[A-Za-zƏəİıÖöÜüÇçŞşĞğ]{2,}/.test(t.replace(/<[^>]*>/g, "").replace(/⟦\d+⟧/g, ""));
