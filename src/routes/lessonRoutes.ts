import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();
router.use(requireAuth);

interface LessonRow extends RowDataPacket {
  id: string;
  title: string;
  category: string;
  glyph: string;
  sort_order: number;
  has_content: number;
}

interface TagRow extends RowDataPacket {
  lesson_id: string;
  tag: string;
}

interface ProgressRow extends RowDataPacket {
  lesson_id: string;
  completed: number;
  last_step: number;
  completed_at: string | null;
}

// The catalog (what lessons exist, their metadata, and whether real step content backs them yet)
// and each user's progress through them. Lesson *content* is served separately by GET /:id/content
// below, so the grid can render without pulling every lesson's full step payload up front.
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const [lessons] = await pool.execute<LessonRow[]>(
      `SELECT lc.id, lc.title, lc.category, lc.glyph, lc.sort_order,
              EXISTS(SELECT 1 FROM lesson_steps ls WHERE ls.lesson_id = lc.id) AS has_content
       FROM lessons_catalog lc
       WHERE lc.active = 1
       ORDER BY lc.sort_order ASC`
    );
    const [tagRows] = await pool.execute<TagRow[]>("SELECT lesson_id, tag FROM lesson_tags");
    const [progress] = await pool.execute<ProgressRow[]>(
      "SELECT lesson_id, completed, last_step, completed_at FROM lesson_progress WHERE user_id = ?",
      [userId]
    );

    const tagsByLesson = new Map<string, string[]>();
    for (const row of tagRows) {
      const list = tagsByLesson.get(row.lesson_id) ?? [];
      list.push(row.tag);
      tagsByLesson.set(row.lesson_id, list);
    }
    const progressByLesson = new Map(progress.map((p) => [p.lesson_id, p]));

    const items = lessons.map((lesson) => {
      const p = progressByLesson.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        category: lesson.category,
        glyph: lesson.glyph,
        tags: tagsByLesson.get(lesson.id) ?? [],
        hasContent: !!lesson.has_content,
        completed: !!p?.completed,
        lastStep: p?.last_step ?? 0,
        completedAt: p?.completed_at ?? null,
      };
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

interface StepRow extends RowDataPacket {
  step_index: number;
  instructor_line: string | null;
  mood: string;
  board_pieces: string | null;
  highlight_squares: string;
  quiz_mode: string;
  question_text: string | null;
  correct_squares: string;
  choices: string;
  correct_choice_index: number;
  success_line: string | null;
  fail_line: string | null;
}

// MariaDB's JSON "type" is really LONGTEXT with a validity check constraint, so mysql2 returns
// these columns as raw strings rather than auto-parsed values (unlike MySQL's native JSON type) -
// every JSON column read here has to be parsed explicitly.
function parseJson<T>(value: string | null, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

router.get("/:id/content", async (req, res, next) => {
  try {
    const lessonId = req.params.id;

    const [lessonRows] = await pool.execute<LessonRow[]>(
      "SELECT id, title FROM lessons_catalog WHERE id = ? AND active = 1 LIMIT 1",
      [lessonId]
    );
    if (lessonRows.length === 0) {
      return res.status(404).json({ error: "Unknown lesson id" });
    }

    const [steps] = await pool.execute<StepRow[]>(
      `SELECT step_index, instructor_line, mood, board_pieces, highlight_squares, quiz_mode,
              question_text, correct_squares, choices, correct_choice_index, success_line, fail_line
       FROM lesson_steps WHERE lesson_id = ? ORDER BY step_index ASC`,
      [lessonId]
    );

    if (steps.length === 0) {
      return res.status(404).json({ error: "This lesson has no content yet" });
    }

    const items = steps.map((s) => ({
      instructorLine: s.instructor_line,
      mood: s.mood,
      boardPieces: parseJson<{ square: string; pieceType: string; color: string }[] | null>(s.board_pieces, null), // null = leave board unchanged; array = set explicitly
      highlightSquares: parseJson<string[]>(s.highlight_squares, []),
      quiz: s.quiz_mode,
      questionText: s.question_text,
      correctSquares: parseJson<string[]>(s.correct_squares, []),
      choices: parseJson<string[]>(s.choices, []),
      correctChoiceIndex: s.correct_choice_index,
      successLine: s.success_line,
      failLine: s.fail_line,
    }));

    res.json({ id: lessonRows[0].id, title: lessonRows[0].title, steps: items });
  } catch (err) {
    next(err);
  }
});

const progressSchema = z.object({
  lessonId: z.string().min(1).max(64),
  lastStep: z.number().int().min(0).max(10000),
  completed: z.boolean(),
});

router.put("/progress", validateBody(progressSchema), async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { lessonId, lastStep, completed } = req.body;

    const [lessonRows] = await pool.execute<LessonRow[]>(
      "SELECT id FROM lessons_catalog WHERE id = ? AND active = 1 LIMIT 1",
      [lessonId]
    );
    if (lessonRows.length === 0) {
      return res.status(404).json({ error: "Unknown lesson id" });
    }

    await pool.execute(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, last_step, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         completed = VALUES(completed),
         last_step = VALUES(last_step),
         completed_at = VALUES(completed_at)`,
      [userId, lessonId, completed ? 1 : 0, lastStep, completed ? new Date() : null]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
