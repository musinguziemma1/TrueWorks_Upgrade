import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const proxy = readFileSync(join(root, "src", "app", "api", "auth", "[...all]", "route.ts"), "utf8");
const http = readFileSync(join(root, "convex", "http.ts"), "utf8");
const nextProxy = readFileSync(join(root, "src", "proxy.ts"), "utf8");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(proxy.includes("function proxyIamResponse"), "Auth proxy response helper is missing");
assert(proxy.includes("NEXT_PUBLIC_CONVEX_SITE_URL"), "Auth proxy is not using the Convex site URL");
assert(proxy.includes('response.headers.set("set-cookie", setCookie)'), "Auth proxy does not preserve Set-Cookie");
assert(proxy.includes("headers.origin = origin"), "Auth proxy does not forward Origin");
assert(http.includes("function withIamOriginProtection"), "IAM Origin protection wrapper is missing");
assert(http.includes('return json({ error: "Invalid request origin." }, 403)'), "Invalid IAM origins are not rejected");
assert(http.includes('path: "/iam/change-password"'), "Change-password route is missing");
assert(http.includes("withIamOriginProtection(changePasswordHandler)"), "Change-password route is not Origin protected");
assert(nextProxy.includes('"/api/auth"'), "Global proxy is still intercepting authentication API requests");

console.log("IAM security preservation checks passed.");
