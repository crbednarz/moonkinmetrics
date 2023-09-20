package storage

import (
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	_ "github.com/mattn/go-sqlite3"
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

func (s *Sqlite) StoreLinked(responses []Response) error {
    s.lock.Lock()
    defer s.lock.Unlock()
    tx, err := s.db.Begin()
    if err != nil {
        return err
    }
    stmt, err := tx.Prepare(
        "INSERT OR REPLACE INTO ApiResponses (region, namespace, path, locale, data, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    )
    if err != nil {
        if txErr := tx.Rollback(); txErr != nil {
            return fmt.Errorf("failed to prepare statement: %w, failed to rollback transaction: %v", err, txErr)
        } else {
            return fmt.Errorf("failed to prepare statement: %w", err)
        }
    }
    for _, response := range responses {
        _, err = stmt.Exec(
            response.Request.Region,
            response.Request.Namespace,
            response.Request.Path,
            response.Request.Locale,
            response.Body,
            time.Now().Unix(),
        )
        if err != nil {
            if txErr := tx.Rollback(); txErr != nil {
                return fmt.Errorf("failed to execute statement: %w, failed to rollback transaction: %v", err, txErr)
            } else {
                return fmt.Errorf("failed to execute statement: %w", err)
            }
        }
    }
    return tx.Commit()
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
    var timestamp int64
    err := row.Scan(&response.Body, &timestamp)
    if err == nil {
        response.Timestamp = time.Unix(timestamp, 0)
    }
    if errors.Is(err, sql.ErrNoRows) {
        return response, ErrNotFound
    }
    return response, err
}
