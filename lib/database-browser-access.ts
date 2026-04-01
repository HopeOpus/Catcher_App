import { Pool } from "pg";
import {
  getAuthenticatedAppUser,
  type AuthenticatedAppUser,
} from "@/lib/authenticated-user";

type DatabaseBrowserDenied = {
  ok: false;
  status: number;
  error: string;
};

type DatabaseBrowserAllowed = {
  ok: true;
  user: AuthenticatedAppUser;
};

function parseAllowlist(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isBrowserEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DATABASE_BROWSER === "true"
  );
}

export async function getDatabaseBrowserAccess(): Promise<
  DatabaseBrowserDenied | DatabaseBrowserAllowed
> {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
    };
  }

  if (!isBrowserEnabled()) {
    return {
      ok: false,
      status: 404,
      error: "Database browser is disabled.",
    };
  }

  const allowlist = parseAllowlist(
    process.env.DATABASE_BROWSER_ALLOWED_EMAILS,
  );

  if (process.env.NODE_ENV === "production" && allowlist.length === 0) {
    return {
      ok: false,
      status: 404,
      error:
        "Database browser allowlist is not configured for production access.",
    };
  }

  if (
    allowlist.length > 0 &&
    !allowlist.includes(authenticatedUser.email.toLowerCase())
  ) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  return {
    ok: true,
    user: authenticatedUser,
  };
}

export function createDatabaseBrowserPool() {
  const connectionString = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return new Pool({
    connectionString,
    max: 1,
  });
}
