import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";

async function main() {
  await pool.query("SELECT 1");
  console.log("Connected to MySQL.");

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`ChessWorks backend listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
