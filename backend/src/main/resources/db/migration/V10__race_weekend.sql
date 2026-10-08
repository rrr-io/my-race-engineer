-- Race Weekend: the dates fans add to their calendar (voting windows, MAMA shows, deadlines).
-- Edited from /admin, served as an ICS feed per team.
CREATE TABLE race_event (
    id         BIGSERIAL     PRIMARY KEY,
    title      VARCHAR(120)  NOT NULL,
    note       VARCHAR(500)  NOT NULL DEFAULT '',
    starts_at  TIMESTAMPTZ   NOT NULL,
    ends_at    TIMESTAMPTZ   NOT NULL,
    sequence   INTEGER       NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_race_event_order CHECK (ends_at > starts_at)
);

CREATE INDEX ix_race_event_starts ON race_event (starts_at);
