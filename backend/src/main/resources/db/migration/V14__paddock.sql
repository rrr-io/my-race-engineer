-- Paddock Announcers: Race Control talks to one team at a time, with its fanchant or a written message.
CREATE TABLE team_chant (
    team       VARCHAR(16)  PRIMARY KEY,
    body       VARCHAR(300) NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_chant_team CHECK (team IN ('jay', 'jake', 'sunghoon', 'sunoo', 'jungwon', 'niki'))
);

INSERT INTO team_chant (team) VALUES ('jay'), ('jake'), ('sunghoon'), ('sunoo'), ('jungwon'), ('niki');

CREATE TABLE paddock_message (
    id         BIGSERIAL    PRIMARY KEY,
    team       VARCHAR(16)  NOT NULL,
    kind       VARCHAR(8)   NOT NULL,
    body       VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_paddock_team CHECK (team IN ('jay', 'jake', 'sunghoon', 'sunoo', 'jungwon', 'niki')),
    CONSTRAINT ck_paddock_kind CHECK (kind IN ('CHANT', 'MESSAGE'))
);

CREATE INDEX ix_paddock_team_created ON paddock_message (team, created_at DESC);
