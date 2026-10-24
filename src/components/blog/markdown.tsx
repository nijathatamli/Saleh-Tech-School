import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { uniqueId } from "@/lib/blog/text";

/** Only same-site paths, anchors, mailto and https links/images get through; raw HTML in the text is never rendered. */
const safeUrl = (url: string) => (/^(\/(?!\/)|#|mailto:|https:\/\/)/i.test(url.trim()) ? url : "");

const textOf = (node: React.ReactNode): string =>
  typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(textOf).join("") : node && typeof node === "object" && "props" in node ? textOf((node as { props: { children?: React.ReactNode } }).props.children) : "";

/** Article body. Used on the public post page (server) and in the editor preview (client): the same output both places. */
export function BlogMarkdown({ source }: { source: string }) {
  const used = new Map<string, number>(); // heading ids in document order = the ids extractHeadings() lists for the contents box
  const components: Components = {
    h1: ({ children }) => <h2 id={uniqueId(textOf(children), used)}>{children}</h2>, // the post title is the page's only h1
    h2: ({ children }) => <h2 id={uniqueId(textOf(children), used)}>{children}</h2>,
    h3: ({ children }) => <h3 id={uniqueId(textOf(children), used)}>{children}</h3>,
    a: ({ href, children }: ComponentPropsWithoutRef<"a">) => {
      const external = !!href && /^https:\/\//i.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" />
    ),
    table: ({ children }) => (
      <div className="blog-table-wrap">
        <table>{children}</table>
      </div>
    ),
  };
  return (
    <div className="blog-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrl} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
