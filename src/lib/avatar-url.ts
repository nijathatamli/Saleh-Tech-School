// Profile pictures are only ever the files this application stored itself (POST /api/uploads → /uploads/<uuid>.<ext>).
// Accepting any URL would let one user make every other user's browser fetch an address of their choosing
// (tracking pixel, mixed content) and would store unbounded strings.
const OWN_UPLOAD = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

export const isOwnUploadUrl = (url: unknown): url is string => typeof url === "string" && url.length <= 80 && OWN_UPLOAD.test(url);
