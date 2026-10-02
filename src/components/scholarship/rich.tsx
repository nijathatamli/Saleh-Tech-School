// Renders question text that the API already ran through sanitizeRich() (plain text,
// <sup>/<sub>, <br> and MathML only).
export function Rich({ html, className }: { html: string; className?: string }) {
  return <span className={`rich-text ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
