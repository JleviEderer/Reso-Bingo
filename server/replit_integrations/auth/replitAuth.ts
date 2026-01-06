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
  
  // Wrap session middleware to catch database errors gracefully
  return (req, res, next) => {
    sessionMiddleware(req, res, (err) => {
      if (err) {
        console.error("[session] Session middleware error:", err.message);
        
        // For database connection errors, return 503 since this middleware only runs on /api routes
        // Use originalUrl to get the full path including the /api prefix
        if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || err.code === "ECONNREFUSED") {
          const fullPath = req.originalUrl || req.baseUrl + req.path || "";
          console.log(`[session] Database connection error for path: ${fullPath}`);
          
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
  // Get the host from various sources - prioritize X-Forwarded-Host for reverse proxy scenarios
  const forwardedHost = req.headers?.["x-forwarded-host"];
  const hostHeader = req.headers?.host?.split(":")[0];
  const hostname = req.hostname;
  
  // In production behind a reverse proxy, X-Forwarded-Host is most reliable
  // Otherwise fall back to hostname (set by trust proxy) or host header
  let domain: string;
  
  if (forwardedHost) {
    // Use forwarded host (handles reverse proxy correctly)
    domain = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  } else if (hostname && hostname !== "localhost") {
    // Use Express hostname (requires trust proxy to be set)
    domain = hostname;
  } else if (hostHeader) {
    // Fallback to host header
    domain = hostHeader;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // Development fallback
    domain = process.env.REPLIT_DEV_DOMAIN;
  } else if (process.env.REPLIT_DOMAINS) {
    domain = process.env.REPLIT_DOMAINS.split(",")[0];
  } else {
    domain = "localhost";
  }
  
  const normalized = normalizeDomain(domain);
  
  console.log(`[auth] Domain resolution - forwarded: ${forwardedHost}, hostname: ${hostname}, host: ${hostHeader}, using: ${normalized}`);
  
  return normalized;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Only apply session middleware to /api/ routes - not static files
  // This prevents database connection errors from blocking the entire app
  app.use("/api", getSession());
  app.use("/api", passport.initialize());
  app.use("/api", passport.session());

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
    
    // Store the domain in session to ensure callback uses the same domain
    (req.session as any).authDomain = domain;
    req.session.save((err) => {
      if (err) {
        console.error(`[auth] Failed to save session with domain ${domain}:`, err);
        // Don't proceed with OAuth if we can't persist the session - it will fail anyway
        return res.redirect(`/?auth_error=${encodeURIComponent("Unable to start sign in. Please try again.")}`);
      }
      
      console.log(`[auth] Login initiated for domain ${domain}, session saved`);
      
      passport.authenticate(`replitauth:${domain}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });
  });

  app.get("/api/callback", (req, res, next) => {
    // Use the domain stored during login to ensure consistency
    const storedDomain = (req.session as any)?.authDomain;
    const resolvedDomain = getAuthDomain(req);
    
    // Prefer the stored domain from login, fall back to resolved domain
    const domain = storedDomain || resolvedDomain;
    
    console.log(`[auth] Callback - stored: ${storedDomain}, resolved: ${resolvedDomain}, using: ${domain}`);
    
    ensureStrategy(domain);
    
    passport.authenticate(`replitauth:${domain}`, (err: any, user: any, info: any) => {
      // Clear the stored auth domain after callback
      delete (req.session as any).authDomain;
      
      if (err) {
        console.error(`[auth] Callback error for domain ${domain}:`, err);
        return res.redirect(`/?auth_error=${encodeURIComponent("Authentication failed. Please try again.")}`);
      }
      
      if (!user) {
        console.error(`[auth] No user returned for domain ${domain}. Info:`, info);
        return res.redirect(`/?auth_error=${encodeURIComponent("Could not complete sign in. Please try again.")}`);
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error(`[auth] Login error for domain ${domain}:`, loginErr);
          return res.redirect(`/?auth_error=${encodeURIComponent("Sign in failed. Please try again.")}`);
        }
        
        console.log(`[auth] Successfully authenticated user for domain ${domain}`);
        return res.redirect("/");
      });
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
