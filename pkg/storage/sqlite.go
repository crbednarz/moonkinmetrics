package storage

import (
	"database/sql"
	_ "embed"
	"errors"
	"sync"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed sqlite-init.sql
var sqliteInitSql string

type Sqlite struct {
	db      *sql.DB
	options SqliteOptions
	lock    sync.RWMutex
}

type SqliteOptions struct {
	NoExpire bool
}

func NewSqlite(path string, options SqliteOptions) (*Sqlite, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(sqliteInitSql)
	if err != nil {
		return nil, err
	}
	return &Sqlite{db: db, options: options}, nil
}

func (s *Sqlite) Store(request api.Request, response []byte, lifespan time.Duration) error {
	s.lock.Lock()
	defer s.lock.Unlock()
	now := time.Now()
	_, err := s.db.Exec(
		"INSERT OR REPLACE INTO ApiResponses (id, data, timestamp, expires) VALUES (?, ?, ?, ?)",
		request.Id(),
		response,
		now.Unix(),
		now.Add(lifespan).Unix(),
	)
	return err
}

func (s *Sqlite) Get(request api.Request) (StoredResponse, error) {
	s.lock.RLock()
	defer s.lock.RUnlock()

	currentTime := time.Now().Unix()
	if s.options.NoExpire {
		currentTime = 0
	}

	row := s.db.QueryRow(
		"SELECT data, timestamp FROM ApiResponses WHERE id = ? AND expires >= ?",
		request.Id(),
		currentTime,
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

func (s *Sqlite) Clean() (CleanResult, error) {
	if s.options.NoExpire {
		return CleanResult{}, nil
	}
	s.lock.Lock()
	defer s.lock.Unlock()
	result, err := s.db.Exec("DELETE FROM ApiResponses WHERE expires < ?", time.Now().Unix())
	if err != nil {
		return CleanResult{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return CleanResult{}, err
	}
	return CleanResult{Deleted: rowsAffected}, nil
}
