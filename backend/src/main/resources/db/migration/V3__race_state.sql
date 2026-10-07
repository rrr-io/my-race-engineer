CREATE TABLE race_state (
    id         INTEGER     PRIMARY KEY,
    phase      VARCHAR(16) NOT NULL,
    pit_stop   BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_race_state_single_row CHECK (id = 1),
    CONSTRAINT ck_race_state_phase CHECK (phase IN (
        'GRID', 'FREE_PRACTICE', 'SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP', 'FINISH_LINE'))
);

INSERT INTO race_state (id, phase) VALUES (1, 'GRID');
