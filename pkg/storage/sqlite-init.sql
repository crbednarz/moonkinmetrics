CREATE TABLE IF NOT EXISTS ApiResponses(
    path TEXT NOT NULL,
    region TEXT NOT NULL,
    namespace TEXT NOT NULL,
    locale TEXT NOT NULL,
    data BLOB NOT NULL,
    timestamp INTEGER NOT NULL,
    PRIMARY KEY(path, region, namespace)
);

