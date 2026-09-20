import crypto from "crypto";

// Refresh tokens are opaque random strings handed to the client; only a SHA-256 digest is
// stored server-side so a leaked/backed-up database row can't be replayed as a live token.
export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("hex");
}
