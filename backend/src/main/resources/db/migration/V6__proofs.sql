CREATE TABLE proof (
    id          BIGSERIAL   PRIMARY KEY,
    crew_id     UUID        NOT NULL REFERENCES crew_member (id) ON DELETE CASCADE,
    day         DATE        NOT NULL,
    status      VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    reason      TEXT,
    practice    BOOLEAN     NOT NULL DEFAULT FALSE,
    phase       VARCHAR(16) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT ck_proof_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_proof_phase CHECK (phase IN (
        'GRID', 'SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP', 'FINISH_LINE'))
);

-- day is the Korean (KST) day; a fan has at most one live proof per day (a rejected one can be replaced)
CREATE UNIQUE INDEX ux_proof_live_per_day ON proof (crew_id, day) WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX ix_proof_crew_day ON proof (crew_id, day);
CREATE INDEX ix_proof_status ON proof (status, id);

CREATE TABLE proof_image (
    id           BIGSERIAL   PRIMARY KEY,
    proof_id     BIGINT      NOT NULL REFERENCES proof (id) ON DELETE CASCADE,
    file_name    VARCHAR(64) NOT NULL UNIQUE,
    content_type VARCHAR(32) NOT NULL,
    size_bytes   INTEGER     NOT NULL,
    sort_order   SMALLINT    NOT NULL
);

CREATE INDEX ix_proof_image_proof ON proof_image (proof_id);
