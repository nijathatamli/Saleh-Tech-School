// Local development database: real Postgres (compiled to WASM via PGlite),
// exposed over the actual Postgres wire protocol so Prisma / any pg client
// connects to it exactly like a normal `postgresql://` server.
// No admin rights, no Windows service, no native binaries required.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".pgdata");
const port = Number(process.env.PGLITE_PORT || 5433);
const host = process.env.PGLITE_HOST || "127.0.0.1";

const db = await PGlite.create({ dataDir });
const server = new PGLiteSocketServer({ db, port, host });

await server.start();
console.log(`[pglite] listening on postgresql://postgres:postgres@${host}:${port}/postgres`);
console.log(`[pglite] data dir: ${dataDir}`);

process.on("SIGINT", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
