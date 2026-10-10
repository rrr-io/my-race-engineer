-- When the current phase and the current pit stop started, so radio messages can say "JUST NOW" or "2H AGO".
ALTER TABLE race_state ADD COLUMN phase_started_at    TIMESTAMPTZ;
ALTER TABLE race_state ADD COLUMN pit_stop_started_at TIMESTAMPTZ;

UPDATE race_state SET phase_started_at = updated_at;
UPDATE race_state SET pit_stop_started_at = updated_at WHERE pit_stop;
