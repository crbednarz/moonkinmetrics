CREATE TABLE IF NOT EXISTS ApiResponses(
    id TEXT NOT NULL,
    data BLOB NOT NULL,
    timestamp INTEGER NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY(id)
);

