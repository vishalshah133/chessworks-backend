import fs from "fs";
import os from "os";
import mysql from "mysql2/promise";
import { env } from "../config/env";

function loadSsl() {
  if (!env.db.ssl) return undefined;
  if (!env.db.sslCaPath) return { rejectUnauthorized: true };
  const caPath = env.db.sslCaPath.replace(/^~/, os.homedir());
  return { ca: fs.readFileSync(caPath, "utf8") };
}

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: loadSsl(),
});
