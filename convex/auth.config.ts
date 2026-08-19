import { AuthConfig } from "convex/server";

const ISSUER = process.env.CONVEX_AUTH_ISSUER ?? "https://trueworksgroup.com";
const SITE_URL = (process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(/\/$/, "");

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "trueworks",
      issuer: ISSUER,
      jwks: SITE_URL ? `${SITE_URL}/.well-known/jwks.json` : "https://trueworksgroup.com/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
