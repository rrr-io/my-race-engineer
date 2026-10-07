-- Where fans vote: the link behind the "Open MNET+" button. One row, edited from /admin.
CREATE TABLE vote_settings (
    id  INTEGER       NOT NULL PRIMARY KEY,
    url VARCHAR(300)  NOT NULL DEFAULT 'https://mnetplus.world/',
    CONSTRAINT ck_vote_single_row CHECK (id = 1),
    CONSTRAINT ck_vote_https CHECK (url LIKE 'https://%')
);

INSERT INTO vote_settings (id) VALUES (1);
