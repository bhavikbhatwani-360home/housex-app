// Runs during the Vercel build. If DATABASE_URL is set, sync the schema and seed
// the inventory. If not (e.g. before the DB is connected), skip cleanly so the
// build still succeeds and the app falls back to static inventory.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[db-setup] No DATABASE_URL — skipping schema push + seed.");
  process.exit(0);
}

try {
  console.log("[db-setup] DATABASE_URL found — pushing schema…");
  execSync("prisma db push --skip-generate", { stdio: "inherit" });
  console.log("[db-setup] Seeding inventory…");
  execSync("prisma db seed", { stdio: "inherit" });
  console.log("[db-setup] Done.");
} catch (err) {
  // Don't fail the whole deploy on a DB hiccup — log and continue.
  console.error("[db-setup] Skipped due to error:", err?.message || err);
  process.exit(0);
}
