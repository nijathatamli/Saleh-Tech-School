// The secret path admins sign in at (e.g. "k7Qm2xP9vR4tLw8z" → /k7Qm2xP9vR4tLw8z), set only in the host's env so it never
// lands in the public repo. Unset (local dev, tests): no secret door, /admin behaves like the other panels.
export function adminPath(): string | null {
  const raw = process.env.ADMIN_PATH?.trim().replace(/^\/+|\/+$/g, "");
  return raw && /^[A-Za-z0-9_-]{12,}$/.test(raw) ? raw : null;
}
