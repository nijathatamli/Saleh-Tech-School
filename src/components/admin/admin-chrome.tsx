"use client";

import { useEffect } from "react";

/**
 * Marks the document as "admin" while the admin panel is open: the stylesheet scopes its glass dialogs, menus and
 * buttons on `html.ad-portal` (Radix renders them in a portal outside the page). The site's themed cursor is not part
 * of this design, so it is stripped like in the other dashboards.
 */
export function AdminChrome() {
  useEffect(() => {
    const html = document.documentElement;
    const hadCursor = html.classList.contains("custom-cursor-active");
    html.classList.add("ad-portal");
    const strip = () => html.classList.remove("custom-cursor-active");
    strip();
    const observer = new MutationObserver(() => html.classList.contains("custom-cursor-active") && strip());
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      html.classList.remove("ad-portal");
      if (hadCursor) html.classList.add("custom-cursor-active");
    };
  }, []);
  return null;
}
