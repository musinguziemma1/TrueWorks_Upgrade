export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS;
  const fromEnv = env
    ? env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return Array.from(new Set(fromEnv));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
