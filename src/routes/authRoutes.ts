import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import * as authService from "../services/authService";

const router = Router();

// Auth endpoints are brute-force targets, so they get a much tighter rate limit than the rest
// of the API (applied in server.ts).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(authLimiter);

const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric/underscore only"),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(64).optional().default(""),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    const { user, tokens } = await authService.register(username, email, password, displayName || username);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const { user, tokens } = await authService.login(usernameOrEmail, password);
    res.json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
  try {
    const { user, tokens } = await authService.refresh(req.body.refreshToken);
    res.json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", validateBody(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
