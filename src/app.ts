// Require the framework and instantiate it

// ESM
import Fastify, { FastifyError } from "fastify";
import "dotenv/config";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import csrf from "@fastify/csrf-protection";
import helmet from "@fastify/helmet";
import { productRoutes } from "./routes/products.routes.js";
import swagger from "@fastify/swagger";
import scalar from "@scalar/fastify-api-reference";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.routes.js";
import { categoryRoutes } from "./routes/categories.routes.js";
import { orderRoutes } from "./routes/orders.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import {
  csrfCookieSameSite,
  csrfOriginProtection,
  csrfProtectionEnabled,
  getCsrfUserInfo,
  isSafeMethod,
  isTrustedOrigin,
} from "./middlewares/csrf.middleware.js";

const PORT = parseInt(process.env.PORT ?? "3000");

const getCsrfSecrets = () => {
  const cookieSecret = process.env.CSRF_COOKIE_SECRET;
  const userInfoHmacKey = process.env.CSRF_USER_INFO_HMAC_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  if (!cookieSecret || !userInfoHmacKey || !jwtSecret) {
    throw new Error(
      "CSRF_COOKIE_SECRET, CSRF_USER_INFO_HMAC_KEY e JWT_SECRET são obrigatórios quando a proteção CSRF está ativada",
    );
  }

  const secrets = [cookieSecret, userInfoHmacKey, jwtSecret];
  if (
    secrets.some((secret) => Buffer.byteLength(secret) < 32) ||
    new Set(secrets).size !== secrets.length
  ) {
    throw new Error(
      "CSRF_COOKIE_SECRET, CSRF_USER_INFO_HMAC_KEY e JWT_SECRET devem ser segredos distintos de pelo menos 32 bytes",
    );
  }

  return { cookieSecret, userInfoHmacKey };
};

const csrfSecrets = csrfProtectionEnabled
  ? getCsrfSecrets()
  : undefined;

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      }
    }
}});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

fastify.register(cors, {
  origin: (origin, callback) => {
    callback(null, !origin || isTrustedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
});

fastify.register(
  cookie,
  csrfSecrets ? { secret: csrfSecrets.cookieSecret } : {},
);
fastify.register(csrf, {
  sessionPlugin: "@fastify/cookie",
  cookieOpts: {
    signed: csrfProtectionEnabled,
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      csrfCookieSameSite === "none",
    sameSite: csrfCookieSameSite,
    path: "/",
  },
  getToken: (request) => {
    const token = request.headers["x-csrf-token"];
    return typeof token === "string" ? token : undefined;
  },
  ...(csrfSecrets
    ? {
        getUserInfo: getCsrfUserInfo,
        csrfOpts: {
          userInfo: true,
          hmacKey: csrfSecrets.userInfoHmacKey,
        },
      }
    : {}),
});

fastify.addHook("onRequest", csrfOriginProtection);
if (csrfProtectionEnabled) {
  fastify.addHook("onRequest", (request, reply, done) => {
    if (isSafeMethod(request.method)) {
      done();
      return;
    }

    fastify.csrfProtection(request, reply, done);
  });
}

fastify.register(helmet, {
  contentSecurityPolicy: false,
});

fastify.register(swagger, {
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "Syntax Wear API",
      description: "API para o e-commerce Syntax Wear",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Servidor de desenvolvimento",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Autenticação via token JWT",
        },
      },
    },
  },
});

fastify.register(scalar, {
  routePrefix: "/api-docs",
  configuration: {
    theme: "bluePlanet",
  },
});

fastify.register(productRoutes, { prefix: "/products" });
fastify.register(categoryRoutes, { prefix: "/categories" });
fastify.register(orderRoutes, { prefix: "/orders" });
fastify.register(authRoutes, { prefix: "/auth" });

// Declare a route
fastify.get("/", async (request, reply) => {
  return {
    message: "E-commerce SyntaxWear API",
    version: "1.0.0",
    status: "running",
  };
});

fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
});

fastify.setErrorHandler(errorHandler);

// Run the server!
fastify.listen({ port: PORT }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});

export default fastify;
