import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: path.join(__dirname, "..", "..", process.env.NODE_ENV === "production" ? ".env.production" : ".env"),
});

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    console.log("Applying schema...");
    await connection.query(schema);

    const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
    console.log("Applying seed data...");
    await connection.query(seed);

    console.log("Migration complete.");
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
