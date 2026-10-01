import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // lib/prisma.ts refuses to load without a URL. The adapter connects
      // lazily, so unit tests never open a connection with this value.
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/catcher_test",
      PAYSTACK_ENV: "test",
      PAYSTACK_TEST_SECRET_KEY: "sk_test_unit",
    },
  },
});
