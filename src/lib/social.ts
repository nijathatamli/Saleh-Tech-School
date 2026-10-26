// The school's public profiles. Instagram, LinkedIn and TikTok default to the real accounts; every address can be overridden
// (or, for Facebook / X / GitHub, supplied) with a NEXT_PUBLIC_SOCIAL_* variable. Only https:// addresses are accepted.
const https = (u: string | undefined) => (u && /^https:\/\//.test(u) ? u : undefined);

export const SOCIAL = {
  instagram: https(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM) ?? "https://www.instagram.com/saleh.tech.school/",
  linkedin: https(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN) ?? "https://www.linkedin.com/company/salehtechschool/",
  tiktok: https(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) ?? "https://www.tiktok.com/@saleh.tech.school",
  facebook: https(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK),
  x: https(process.env.NEXT_PUBLIC_SOCIAL_X),
  github: https(process.env.NEXT_PUBLIC_SOCIAL_GITHUB),
};

/** every profile that has an address (for structured data: schema.org `sameAs`) */
export const socialLinks = () => Object.values(SOCIAL).filter((u): u is string => !!u);
