-- LOCAL TESTING ONLY. Fake crews and approved proofs so the Podium has something to show.
-- Expected podium: P1 Team Sunoo (42), P2 Team Sunghoon (35), P3 Team Ni-ki (28).
-- Run:    psql -h localhost -U e1 e1 -f backend/dev/podium-demo.sql
-- Undo:   DELETE FROM crew_member WHERE id::text LIKE '00000000-0000-0000-0000-%';
--         DELETE FROM category WHERE name = 'Demo · Podium';
-- The rows are fake: no image files exist behind them, so don't open them from the review queue.

BEGIN;

DELETE FROM crew_member WHERE id::text LIKE '00000000-0000-0000-0000-%';
DELETE FROM category WHERE name = 'Demo · Podium';

INSERT INTO category (name, sort_order, active) VALUES ('Demo · Podium', 999, FALSE);

INSERT INTO crew_member (id, team) VALUES
    ('00000000-0000-0000-0000-000000000001', 'sunoo'),
    ('00000000-0000-0000-0000-000000000002', 'sunghoon'),
    ('00000000-0000-0000-0000-000000000003', 'niki'),
    ('00000000-0000-0000-0000-000000000004', 'jay'),
    ('00000000-0000-0000-0000-000000000005', 'jake'),
    ('00000000-0000-0000-0000-000000000006', 'jungwon');

-- approved proofs per team, spread over the three race phases
INSERT INTO proof (crew_id, category_id, day, status, practice, phase, file_name, content_type, size_bytes,
                   created_at, reviewed_at)
SELECT t.crew::uuid, (SELECT id FROM category WHERE name = 'Demo · Podium'),
       CURRENT_DATE - (n % 10), 'APPROVED', FALSE,
       (ARRAY['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP'])[1 + n % 3],
       'demo-' || t.slug || '-' || n || '.jpg', 'image/jpeg', 1000, now() - interval '1 day', now()
FROM (VALUES ('00000000-0000-0000-0000-000000000001', 'sunoo', 42),
             ('00000000-0000-0000-0000-000000000002', 'sunghoon', 35),
             ('00000000-0000-0000-0000-000000000003', 'niki', 28),
             ('00000000-0000-0000-0000-000000000004', 'jay', 12),
             ('00000000-0000-0000-0000-000000000005', 'jake', 9),
             ('00000000-0000-0000-0000-000000000006', 'jungwon', 5)) AS t(crew, slug, total),
     generate_series(1, t.total) AS n;

-- these must NOT count: rejected proofs and practice proofs (they would put Jay first)
INSERT INTO proof (crew_id, category_id, day, status, practice, phase, file_name, content_type, size_bytes, reason)
SELECT '00000000-0000-0000-0000-000000000004', (SELECT id FROM category WHERE name = 'Demo · Podium'),
       CURRENT_DATE, CASE WHEN n % 2 = 0 THEN 'REJECTED' ELSE 'APPROVED' END, n % 2 = 1, 'SPRINT_RACE',
       'demo-jay-extra-' || n || '.jpg', 'image/jpeg', 1000, CASE WHEN n % 2 = 0 THEN 'Not readable' END
FROM generate_series(1, 80) AS n;

COMMIT;
