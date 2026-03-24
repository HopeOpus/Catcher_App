import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
