// Runs during the Vercel build. If a database is connected, sync the schema and
// seed the inventory using a DIRECT (non-pooled) connection — which works with
// both Vercel Postgres (Neon) and Railway. If no DB is set, skip cleanly so the
// build still succeeds and the app falls back to static inventory.
import { execSync } from "node:child_process";

const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!directUrl) {
  console.log("[db-setup] No database URL — skipping schema push + seed.");
  process.exit(0);
}

const env = { ...process.env, DATABASE_URL: directUrl };

try {
  console.log("[db-setup] Database found — pushing schema…");
  execSync("prisma db push --skip-generate", { stdio: "inherit", env });
  console.log("[db-setup] Seeding inventory…");
  execSync("prisma db seed", { stdio: "inherit", env });
  console.log("[db-setup] Done.");
} catch (err) {
  console.error("[db-setup] Skipped due to error:", err?.message || err);
  process.exit(0);
}
