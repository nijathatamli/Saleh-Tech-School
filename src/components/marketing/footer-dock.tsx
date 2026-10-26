"use client";

import { Facebook, Github, Instagram, Linkedin, Mail, Newspaper, Twitter } from "lucide-react";
import { GlassDock, type DockItem } from "@/components/ui/glass-dock";

/** Quick links of the footer. Built here (not in the server footer) because icon components cannot cross from a server
 *  component into a client one; only plain strings come in. An icon whose address is not set is simply not shown. */
/** TikTok has no icon in lucide: the note glyph as an inline SVG, drawn in the same size and colour logic as the others */
function TikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function FooterDock({ email, instagram, linkedin, tiktok, facebook, x, github }: { email?: string; instagram?: string; linkedin?: string; tiktok?: string; facebook?: string; x?: string; github?: string }) {
  // profiles first (Instagram leads), then the blog, and the e-mail at the end
  const items: DockItem[] = [];
  if (instagram) items.push({ title: "Instagram", icon: Instagram, href: instagram });
  if (linkedin) items.push({ title: "LinkedIn", icon: Linkedin, type: "linkedin", href: linkedin });
  if (tiktok) items.push({ title: "TikTok", icon: TikTok, href: tiktok });
  if (facebook) items.push({ title: "Facebook", icon: Facebook, href: facebook });
  if (x) items.push({ title: "X", icon: Twitter, type: "x", href: x });
  if (github) items.push({ title: "GitHub", icon: Github, type: "github", href: github });
  items.push({ title: "Bloq", icon: Newspaper, type: "blog", href: "/bloq" });
  items.push({ title: "E-poçt", icon: Mail, type: "email", href: email ? `mailto:${email}` : "/elaqe" });
  return <GlassDock items={items} />;
}
