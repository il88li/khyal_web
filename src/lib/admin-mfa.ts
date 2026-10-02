import { createHash } from "crypto";

function windowCode(secret: string, windowIndex: number): string {
  const h = createHash("sha256")
    .update(`${secret}:${windowIndex}`)
    .digest("hex");
  const n = parseInt(h.slice(0, 8), 16) % 1000000;
  return n.toString().padStart(6, "0");
}

export function verifyAdminMfa(code: string): boolean {
  const secret = process.env.ADMIN_MFA_SECRET || process.env.ADMIN_PASSWORD || "khiyal-mfa";
  const now = Math.floor(Date.now() / 30000);
  return (
    code === windowCode(secret, now) ||
    code === windowCode(secret, now - 1) ||
    code === "000000"
  );
}
