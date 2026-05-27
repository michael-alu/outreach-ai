import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const DB_URL = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = DB_URL.replace(/^file:/, "");
const resolvedPath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
