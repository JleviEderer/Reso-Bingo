import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
    errorLog: (error: Error) => {
      console.error("[session-store] Database connection error:", error.message);
    },
  });
  
  sessionStore.on("error", (error: Error) => {
    console.error("[session-store] Session store error:", error.message);
  });
  
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: "auto",
      sameSite: "none",
      maxAge: sessionTtl,
    },
  });
  
  // Wrap session middleware to catch database errors
  return (req, res, next) => {
    sessionMiddleware(req, res, (err) => {
      if (err) {
        console.error("[session] Session middleware error:", err.message);
        // For DNS/connection errors, return a friendly message
        if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || err.code === "ECONNREFUSED") {
          return res.status(503).json({ 
            message: "Service temporarily unavailable. Please try again in a moment." 
          });
        }
        return next(err);
      }
      next();
    });
  };
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

function normalizeDomain(domain: string): string {
  // Strip protocol and trailing slashes
  let normalized = domain.trim();
  normalized = normalized.replace(/^https?:\/\//, "");
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

function getAuthDomain(req: any): string {
  // In production, use the request hostname to ensure OAuth callback matches the actual domain
  // In development, REPLIT_DEV_DOMAIN is the correct domain
  let domain: string;
  
  const isProduction = process.env.NODE_ENV === "production";
  const requestHost = req.hostname || req.headers?.host?.split(":")[0];
  
  if (isProduction && requestHost) {
    // In production, trust the request hostname
    domain = requestHost;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // In development, use the dev domain
    domain = process.env.REPLIT_DEV_DOMAIN;
  } else if (process.env.REPLIT_DOMAINS) {
    domain = process.env.REPLIT_DOMAINS.split(",")[0];
  } else {
    domain = requestHost || "localhost";
  }
  
  const normalized = normalizeDomain(domain);
  
  console.log(`[auth] Using domain: ${normalized} (production: ${isProduction}, requestHost: ${requestHost})`);
  
  return normalized;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const domain = getAuthDomain(req);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const domain = getAuthDomain(req);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const domain = getAuthDomain(req);
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `https://${domain}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
