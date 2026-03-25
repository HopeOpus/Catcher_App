import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.join(__dirname, ".env.local") });
loadEnv({ path: path.join(__dirname, ".env") });

/**
 * Prisma v7 configuration file.
 *
 * - `schema`  : points to the existing schema.prisma
 * - `migrate` : uses the direct (non-pooled) URL for migrations,
 *               falling back to the pooled URL if DIRECT_URL isn't set.
 */
export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
