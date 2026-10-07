ALTER TABLE race_state ADD COLUMN practice BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE race_state SET phase = 'GRID', practice = TRUE WHERE phase = 'FREE_PRACTICE';

ALTER TABLE race_state DROP CONSTRAINT ck_race_state_phase;
ALTER TABLE race_state ADD CONSTRAINT ck_race_state_phase CHECK (phase IN (
    'GRID', 'SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP', 'FINISH_LINE'));
