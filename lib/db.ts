import { PrismaClient } from "@prisma/client";

// Prefer a direct (non-pooled) connection — works cleanly with both Vercel
// Postgres (Neon) and Railway, and avoids pooler quirks at pilot scale.
const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(directUrl ? { datasourceUrl: directUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
