CREATE TABLE crew_member (
    id          UUID        PRIMARY KEY,
    team        VARCHAR(16) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_crew_team CHECK (team IN (
        'jay', 'jake', 'sunghoon', 'sunoo', 'jungwon', 'niki'))
);

CREATE INDEX ix_crew_member_team ON crew_member (team);
