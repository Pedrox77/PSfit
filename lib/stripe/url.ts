import "server-only";

export function getAppUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configured) {
    return "http://localhost:3000";
  }

  const withProtocol = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;
  const url = new URL(withProtocol);

  if (process.env.NODE_ENV === "production") {
    url.protocol = "https:";
  }

  return url.origin;
}
