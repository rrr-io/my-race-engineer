-- Voting categories, set by Race Control for each stage.
CREATE TABLE category (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Proofs already stored before categories existed are kept under an archived category.
INSERT INTO category (name, sort_order, active)
SELECT 'Before categories', 0, FALSE WHERE EXISTS (SELECT 1 FROM proof_image);

-- One row per screenshot: it carries its own category and its own review.
CREATE TABLE proof_flat (
    id           BIGSERIAL    PRIMARY KEY,
    crew_id      UUID         NOT NULL REFERENCES crew_member (id) ON DELETE CASCADE,
    category_id  BIGINT       NOT NULL REFERENCES category (id),
    day          DATE         NOT NULL,
    status       VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    reason       TEXT,
    practice     BOOLEAN      NOT NULL DEFAULT FALSE,
    phase        VARCHAR(16)  NOT NULL,
    file_name    VARCHAR(64)  NOT NULL UNIQUE,
    content_type VARCHAR(32)  NOT NULL,
    size_bytes   INTEGER      NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    reviewed_at  TIMESTAMPTZ,
    CONSTRAINT ck_proof_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_proof_phase CHECK (phase IN (
        'GRID', 'SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP', 'FINISH_LINE'))
);

INSERT INTO proof_flat (crew_id, category_id, day, status, reason, practice, phase,
                        file_name, content_type, size_bytes, created_at, reviewed_at)
SELECT p.crew_id, (SELECT min(id) FROM category), p.day, p.status, p.reason, p.practice, p.phase,
       i.file_name, i.content_type, i.size_bytes, p.created_at, p.reviewed_at
FROM proof_image i JOIN proof p ON p.id = i.proof_id
ORDER BY i.id;

DROP TABLE proof_image;
DROP TABLE proof;
ALTER TABLE proof_flat RENAME TO proof;
ALTER SEQUENCE proof_flat_id_seq RENAME TO proof_id_seq;
ALTER INDEX proof_flat_pkey RENAME TO proof_pkey;
ALTER INDEX proof_flat_file_name_key RENAME TO proof_file_name_key;
ALTER TABLE proof RENAME CONSTRAINT proof_flat_crew_id_fkey TO proof_crew_id_fkey;
ALTER TABLE proof RENAME CONSTRAINT proof_flat_category_id_fkey TO proof_category_id_fkey;

CREATE INDEX ix_proof_crew_day ON proof (crew_id, day);
CREATE INDEX ix_proof_status ON proof (status, id);

-- The engineer's voting briefing, in each team's voice. {categories} is the list still to do.
ALTER TABLE message_template DROP CONSTRAINT ck_event;
ALTER TABLE message_template ADD CONSTRAINT ck_event CHECK (event_type IN (
    'DAILY_REMINDER', 'PROOF_RECEIVED', 'PROOF_APPROVED',
    'PROOF_REJECTED', 'LIGHTS_OUT', 'PIT_STOP', 'VOTE_BRIEFING'));

INSERT INTO message_template (event_type, team, variant, body) VALUES
('VOTE_BRIEFING', 'default',  1, $$Time to vote. Open MNET+ and vote in {categories}. Then send a screenshot for each category.$$),
('VOTE_BRIEFING', 'default',  2, $$Today on MNET+: {categories}. Vote in each category, then upload your proofs.$$),
('VOTE_BRIEFING', 'jay',      1, $$Race plan: open MNET+ and run these categories: {categories}. One screenshot of each as your telemetry, then send them all.$$),
('VOTE_BRIEFING', 'jay',      2, $$Strategy for today: MNET+, categories {categories}. Cover every one, capture each result, box the proofs. Clean execution.$$),
('VOTE_BRIEFING', 'sunoo',    1, $$Let's go vote on MNET+! Today's categories: {categories}. Send me a screenshot for each one and you'll make my whole day!$$),
('VOTE_BRIEFING', 'sunoo',    2, $$Hiii! Open MNET+ and vote in {categories}. I can't wait to see your screenshots, one for every category!$$),
('VOTE_BRIEFING', 'jungwon',  1, $$Here's the plan: open MNET+, vote in {categories}, screenshot each one and send them in. You've survived harder things. Like waiting for the comeback.$$),
('VOTE_BRIEFING', 'jungwon',  2, $$MNET+ time. Categories: {categories}. One screenshot per category, no category left behind. Leader's orders.$$),
('VOTE_BRIEFING', 'jake',     1, $$Hey, whenever you're ready: pop open MNET+ and vote in {categories}. Grab a screenshot of each and send them over. Easy as.$$),
('VOTE_BRIEFING', 'jake',     2, $$No stress, mate. MNET+, these categories: {categories}. Screenshot each one and we're sorted.$$),
('VOTE_BRIEFING', 'sunghoon', 1, $$Open MNET+. Vote in {categories}. One screenshot per category. You've got this.$$),
('VOTE_BRIEFING', 'sunghoon', 2, $$Today's categories: {categories}. Vote on MNET+, screenshot each, send them. I'll be right here.$$),
('VOTE_BRIEFING', 'niki',     1, $$MNET+. {categories}. One screenshot each. I'll wait.$$),
('VOTE_BRIEFING', 'niki',     2, $$Vote on MNET+ in {categories}. Show me when you're done.$$);
