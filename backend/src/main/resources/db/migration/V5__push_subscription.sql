CREATE TABLE push_subscription (
    id         BIGSERIAL   PRIMARY KEY,
    crew_id    UUID        NOT NULL REFERENCES crew_member (id) ON DELETE CASCADE,
    endpoint   TEXT        NOT NULL UNIQUE,
    p256dh     TEXT        NOT NULL,
    auth       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_push_subscription_crew ON push_subscription (crew_id);
