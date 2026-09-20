-- Seed content mirroring the Unity client's previous local content sources:
-- Resources/Daily/feed.json (daily_posts) and LessonBook.cs's MeetThePieces() lesson
-- (lessons_catalog, lesson_tags, lesson_steps). Only "meet-the-pieces" has real content for now -
-- LessonData.cs's other placeholder catalog entries were never backed by real lesson content and
-- are intentionally not carried over. LessonData.cs and LessonBook.cs have been removed from the
-- Unity project; lesson content now lives entirely here.

INSERT INTO daily_posts (id, avatar_glyph, avatar_style, title, meta, caption, sort_order) VALUES
  ('puzzle-of-the-day', '', 'feed-avatar--puzzle', 'Puzzle of the Day', 'Daily challenge', 'Mate in 3 — find the forcing line before white''s king escapes.', 1),
  ('last-game-analysis', '', 'feed-avatar--analysis', 'Your Last Game', '+12 rating', 'Engine review found 2 inaccuracies in the middlegame. Tap to review the critical moments.', 2),
  ('chess-news-round-8', '', 'feed-avatar--news', 'Chess News', 'World Championship', 'Round 8 highlights: catch up on today''s top games from the top players in the world.', 3),
  ('coach-tip-rook-lifts', '', 'feed-avatar--tip', 'Coach Tip', 'Middlegame ideas', 'Rook lifts: a short idea to keep your rooks active before the endgame arrives.', 4)
ON DUPLICATE KEY UPDATE
  avatar_glyph = VALUES(avatar_glyph),
  avatar_style = VALUES(avatar_style),
  title = VALUES(title),
  meta = VALUES(meta),
  caption = VALUES(caption),
  sort_order = VALUES(sort_order);

INSERT INTO lessons_catalog (id, title, category, glyph, sort_order) VALUES
  ('meet-the-pieces', 'Meet the Pieces', 'Basics', '', 1)
ON DUPLICATE KEY UPDATE title = VALUES(title), category = VALUES(category), glyph = VALUES(glyph), sort_order = VALUES(sort_order);

INSERT INTO lesson_tags (lesson_id, tag) VALUES
  ('meet-the-pieces', 'Piece Movement')
ON DUPLICATE KEY UPDATE tag = VALUES(tag);

INSERT INTO lesson_steps (lesson_id, step_index, instructor_line, mood, board_pieces, highlight_squares, quiz_mode, question_text, correct_squares, choices, correct_choice_index, success_line, fail_line) VALUES
  ('meet-the-pieces', 0, 'Hi! I''m Rook, your chess coach. Let''s learn how each piece moves - one at a time.', 'Happy', '[]', '[]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 1, 'This is a Pawn. From its starting square it can step forward one or two squares.', 'Idle', '[{"square":"e2","pieceType":"Pawn","color":"White"}]', '["e3","e4"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 2, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this Pawn can move to.', '["e3","e4"]', '[]', 0, 'Exactly - forward, never sideways or backward.', 'Not quite - pawns only move straight ahead.'),
  ('meet-the-pieces', 3, 'This is a Knight. It jumps in an L-shape, and it''s the only piece that can hop over others.', 'Idle', '[{"square":"d4","pieceType":"Knight","color":"White"}]', '["b3","b5","c2","c6","e2","e6","f3","f5"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 4, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this Knight can jump to.', '["b3","b5","c2","c6","e2","e6","f3","f5"]', '[]', 0, 'That''s the L-shape - two squares one way, one square the other.', 'Close, but a Knight only lands on L-shaped squares.'),
  ('meet-the-pieces', 5, 'This is a Bishop. It glides diagonally, as far as the board allows, and always stays on the same color square.', 'Idle', '[{"square":"d4","pieceType":"Bishop","color":"White"}]', '["a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 6, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this Bishop can slide to.', '["a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"]', '[]', 0, 'Right - straight down a diagonal.', 'Remember, a Bishop only moves diagonally.'),
  ('meet-the-pieces', 7, 'This is a Rook. It moves in straight lines - any distance up, down, left, or right.', 'Idle', '[{"square":"d4","pieceType":"Rook","color":"White"}]', '["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 8, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this Rook can slide to.', '["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4"]', '[]', 0, 'Straight lines - that''s a Rook.', 'A Rook only travels along ranks and files, never diagonally.'),
  ('meet-the-pieces', 9, 'This is the Queen - the most powerful piece. She combines the Rook and Bishop: any straight line or diagonal.', 'Idle', '[{"square":"d4","pieceType":"Queen","color":"White"}]', '["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4","a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 10, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this Queen can move to.', '["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4","a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"]', '[]', 0, 'That''s the Queen - Rook power plus Bishop power.', 'The Queen moves like a Rook and Bishop combined - try a straight line or diagonal.'),
  ('meet-the-pieces', 11, 'And this is the King. He only moves one square in any direction - but lose him and the game is over.', 'Idle', '[{"square":"d4","pieceType":"King","color":"White"}]', '["c3","c4","c5","d3","d5","e3","e4","e5"]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 12, NULL, 'Idle', NULL, '[]', 'TapSquare', 'Tap a square this King can step to.', '["c3","c4","c5","d3","d5","e3","e4","e5"]', '[]', 0, 'One square at a time, in any direction - that''s the King.', 'The King only steps one square at a time.'),
  ('meet-the-pieces', 13, 'One last check - let''s see what stuck.', 'Thinking', '[]', '[]', 'None', NULL, '[]', '[]', 0, NULL, NULL),
  ('meet-the-pieces', 14, NULL, 'Idle', NULL, '[]', 'MultipleChoice', 'Which piece moves in an L-shape?', '[]', '["Bishop","Knight","Rook","King"]', 1, 'Right - the Knight and its L-shaped jump.', 'It''s the Knight - the only piece that jumps in an L-shape.'),
  ('meet-the-pieces', 15, NULL, 'Idle', NULL, '[]', 'MultipleChoice', 'Which piece can move any distance, but only diagonally?', '[]', '["Rook","Bishop","Queen","Pawn"]', 1, 'Correct - the Bishop stays on diagonals.', 'It''s the Bishop - diagonals only, any distance.'),
  ('meet-the-pieces', 16, 'Great work! You now know how every piece moves. Next lesson we''ll put them together on the board.', 'Happy', '[]', '[]', 'None', NULL, '[]', '[]', 0, NULL, NULL)
ON DUPLICATE KEY UPDATE
  instructor_line = VALUES(instructor_line),
  mood = VALUES(mood),
  board_pieces = VALUES(board_pieces),
  highlight_squares = VALUES(highlight_squares),
  quiz_mode = VALUES(quiz_mode),
  question_text = VALUES(question_text),
  correct_squares = VALUES(correct_squares),
  choices = VALUES(choices),
  correct_choice_index = VALUES(correct_choice_index),
  success_line = VALUES(success_line),
  fail_line = VALUES(fail_line);
