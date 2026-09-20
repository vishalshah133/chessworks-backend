import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { RowDataPacket } from "mysql2";
import { pool } from "../db/pool";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";
import { signAccessToken } from "../utils/jwt";
import { parseDurationMs } from "../utils/duration";
import { randomToken, sha256Hex } from "../utils/hash";

const BCRYPT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
}

function toAuthUser(row: UserRow): AuthUser {
  return { id: row.id, username: row.username, email: row.email, displayName: row.display_name };
}

async function issueTokenPair(user: AuthUser) {
  const accessToken = signAccessToken({ sub: user.id, username: user.username });

  const refreshToken = randomToken();
  const refreshTokenHash = sha256Hex(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshTtl));

  await pool.execute(
    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [uuid(), user.id, refreshTokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function register(username: string, email: string, password: string, displayName: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const [existing] = await pool.execute<UserRow[]>(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    [normalizedUsername, normalizedEmail]
  );
  if (existing.length > 0) {
    throw new HttpError(409, "Username or email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const id = uuid();

  await pool.execute(
    "INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)",
    [id, normalizedUsername, normalizedEmail, passwordHash, displayName.trim() || normalizedUsername]
  );

  const user: AuthUser = { id, username: normalizedUsername, email: normalizedEmail, displayName };
  const tokens = await issueTokenPair(user);
  return { user, tokens };
}

export async function login(usernameOrEmail: string, password: string) {
  const normalized = usernameOrEmail.trim().toLowerCase();

  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1",
    [normalized, normalized]
  );
  const row = rows[0];
  if (!row) throw new HttpError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new HttpError(401, "Invalid credentials");

  const user = toAuthUser(row);
  const tokens = await issueTokenPair(user);
  return { user, tokens };
}

export async function refresh(refreshToken: string) {
  const tokenHash = sha256Hex(refreshToken);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at
     FROM refresh_tokens rt WHERE rt.token_hash = ? LIMIT 1`,
    [tokenHash]
  );
  const tokenRow = rows[0];
  if (!tokenRow || tokenRow.revoked_at || new Date(tokenRow.expires_at) < new Date()) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const [userRows] = await pool.execute<UserRow[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [
    tokenRow.user_id,
  ]);
  const userRow = userRows[0];
  if (!userRow) throw new HttpError(401, "Invalid or expired refresh token");

  // Rotate: revoke the presented refresh token and issue a fresh pair. This limits the blast
  // radius of a stolen refresh token to a single use before it stops working.
  await pool.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?", [tokenRow.id]);

  const user = toAuthUser(userRow);
  const tokens = await issueTokenPair(user);
  return { user, tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = sha256Hex(refreshToken);
  await pool.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL", [
    tokenHash,
  ]);
}
