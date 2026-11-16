import { FastifyReply, FastifyRequest } from "fastify";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const isSafeMethod = (method: string): boolean =>
  safeMethods.has(method);
const csrfProtectionValue = process.env.CSRF_PROTECTION_ENABLED ?? "false";

if (csrfProtectionValue !== "true" && csrfProtectionValue !== "false") {
  throw new Error("CSRF_PROTECTION_ENABLED deve ser 'true' ou 'false'");
}

export const csrfProtectionEnabled = csrfProtectionValue === "true";

const parseSameSite = (
  value: string | undefined,
): "lax" | "strict" | "none" => {
  const sameSite = value ?? "lax";
  switch (sameSite) {
    case "lax":
    case "strict":
    case "none":
      return sameSite;
    default:
      throw new Error(
        "CSRF_COOKIE_SAME_SITE deve ser 'lax', 'strict' ou 'none'",
      );
  }
};

export const csrfCookieSameSite = parseSameSite(
  process.env.CSRF_COOKIE_SAME_SITE,
);

const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localApiOrigins = [
  `http://localhost:${process.env.PORT ?? "3000"}`,
  `http://127.0.0.1:${process.env.PORT ?? "3000"}`,
];

export const trustedOrigins = [
  ...new Set([...localApiOrigins, ...configuredOrigins]),
];

const trustedOriginSet = new Set(trustedOrigins);

const getRequestOrigin = (request: FastifyRequest): string | undefined => {
  if (request.headers.origin !== undefined) {
    return request.headers.origin;
  }

  const referer = request.headers.referer;
  if (!referer) return undefined;

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

export const isTrustedOrigin = (origin: string): boolean =>
  trustedOriginSet.has(origin);

export const getCsrfUserInfo = (request: FastifyRequest): string => {
  const authCookie = request.cookies?.access_token;
  if (authCookie) return `cookie:${authCookie}`;

  const authorization = request.headers.authorization;
  if (typeof authorization === "string") {
    return `authorization:${authorization}`;
  }

  return "anonymous";
};

export const csrfOriginProtection = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (isSafeMethod(request.method)) return;

  const origin = getRequestOrigin(request);
  if (origin === undefined || isTrustedOrigin(origin)) return;

  await reply.code(403).send({ message: "Origem não autorizada" });
};
