package storage

import (
    "github.com/crbednarz/moonkinmetrics/pkg/bnet"
    "database/sql"
    "sync"
    "time"
    _ "github.com/mattn/go-sqlite3"
    _ "embed"
)

//go:embed sqlite-init.sql
var sqliteInitSql string

type Sqlite struct {
    db *sql.DB
    lock sync.RWMutex
}

func NewSqlite(path string) (*Sqlite, error) {
    db, err := sql.Open("sqlite3", path)
    if err != nil {
        return nil, err
    }

    _, err = db.Exec(sqliteInitSql)
    if err != nil {
        return nil, err
    }
    return &Sqlite{db: db}, nil
}

func (s *Sqlite) Store(request bnet.Request, response []byte) error {
    s.lock.Lock()
    defer s.lock.Unlock()
    _, err := s.db.Exec(
        "INSERT OR REPLACE INTO ApiResponses (region, namespace, path, locale, data, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        request.Region,
        request.Namespace,
        request.Path,
        request.Locale,
        response,
        time.Now().Unix(),
    )
    return err
}

func (s *Sqlite) Get(request bnet.Request) (StoredResponse, error) {
    s.lock.RLock()
    defer s.lock.RUnlock()
    row := s.db.QueryRow(
        "SELECT data, timestamp FROM ApiResponses WHERE region = ? AND namespace = ? AND path = ?",
        request.Region,
        request.Namespace,
        request.Path,
    )
    var response StoredResponse
    err := row.Scan(&response.Body, &response.Timestamp)
    return response, err
}
