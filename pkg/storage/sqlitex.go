package storage

import (
	"context"
	"fmt"
	"time"

	"crawshaw.io/sqlite/sqlitex"
	"github.com/crbednarz/moonkinmetrics/pkg/api"
)

const sqliteInitSql = `
CREATE TABLE IF NOT EXISTS ApiResponses(
    id TEXT NOT NULL,
    data BLOB NOT NULL,
    timestamp INTEGER NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY(id)
);`

type Sqlitex struct {
	pool    *sqlitex.Pool
	options SqlitexOptions
}

type SqlitexOptions struct {
	NoExpire bool
}

func NewSqlitex(path string, options SqlitexOptions) (*Sqlitex, error) {
	pool, err := sqlitex.Open(path, 0, 10)
	if err != nil {
		return nil, err
	}

	db := &Sqlitex{
		pool:    pool,
		options: options,
	}
	err = db.execSingle(context.TODO(), sqliteInitSql)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func (s *Sqlitex) Store(request api.Request, response []byte, lifespan time.Duration) error {
	conn := s.pool.Get(context.TODO())
	if conn == nil {
		return fmt.Errorf("unable to get sqlitex connection")
	}
	defer s.pool.Put(conn)

	now := time.Now()
	stmt := conn.Prep("INSERT OR REPLACE INTO ApiResponses (id, data, timestamp, expires) VALUES (?, ?, ?, ?)")
	stmt.BindText(1, request.Id())
	stmt.BindBytes(2, response)
	stmt.BindInt64(3, now.Unix())
	stmt.BindInt64(4, now.Add(lifespan).Unix())
	_, err := stmt.Step()
	if err != nil {
		return err
	}

	err = stmt.Reset()
	if err != nil {
		return err
	}

	return err
}

func (s *Sqlitex) Get(request api.Request) (StoredResponse, error) {
	currentTime := time.Now().Unix()
	if s.options.NoExpire {
		currentTime = 0
	}

	conn := s.pool.Get(context.TODO())
	if conn == nil {
		return StoredResponse{}, fmt.Errorf("unable to get sqlitex connection")
	}
	defer s.pool.Put(conn)

	stmt := conn.Prep("SELECT data, timestamp FROM ApiResponses WHERE id = ? AND expires >= ? LIMIT 1")
	stmt.BindText(1, request.Id())
	stmt.BindInt64(2, currentTime)

	hasRows, err := stmt.Step()
	if err != nil {
		return StoredResponse{}, err
	}
	if !hasRows {
		return StoredResponse{}, ErrNotFound
	}

	responseSize := stmt.ColumnLen(0)
	data := make([]byte, responseSize)

	stmt.ColumnBytes(0, data)
	timestamp := stmt.ColumnInt64(1)

	err = stmt.Reset()
	if err != nil {
		return StoredResponse{}, err
	}

	return StoredResponse{
		Body:      data,
		Timestamp: time.Unix(timestamp, 0),
	}, nil
}

func (s *Sqlitex) Clean() (CleanResult, error) {
	if s.options.NoExpire {
		return CleanResult{}, nil
	}

	conn := s.pool.Get(context.TODO())
	if conn == nil {
		return CleanResult{}, fmt.Errorf("unable to get sqlitex connection")
	}
	defer s.pool.Put(conn)

	stmt := conn.Prep("DELETE FROM ApiResponses WHERE expires < ?")
	stmt.BindInt64(1, time.Now().Unix())
	_, err := stmt.Step()
	if err != nil {
		return CleanResult{}, err
	}

	err = stmt.Reset()
	if err != nil {
		return CleanResult{}, err
	}

	return CleanResult{
		Deleted: int64(conn.Changes()),
	}, nil
}

func (s *Sqlitex) execSingle(ctx context.Context, query string) error {
	conn := s.pool.Get(ctx)
	defer s.pool.Put(conn)

	stmt := conn.Prep(query)
	for {
		if hasRows, err := stmt.Step(); err != nil {
			return err
		} else if !hasRows {
			break
		}
	}

	err := stmt.Finalize()
	if err != nil {
		return err
	}
	return nil
}

func (s *Sqlitex) Close() error {
	return s.pool.Close()
}
