import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

interface DailyPostRow extends RowDataPacket {
  id: string;
  avatar_glyph: string;
  avatar_style: string;
  title: string;
  meta: string;
  caption: string;
}

router.get("/feed", async (req, res, next) => {
  try {
    const [rows] = await pool.execute<DailyPostRow[]>(
      "SELECT id, avatar_glyph, avatar_style, title, meta, caption FROM daily_posts WHERE active = 1 ORDER BY sort_order ASC"
    );

    const items = rows.map((row) => ({
      id: row.id,
      avatarGlyph: row.avatar_glyph,
      avatarStyle: row.avatar_style,
      title: row.title,
      meta: row.meta,
      caption: row.caption,
    }));

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
