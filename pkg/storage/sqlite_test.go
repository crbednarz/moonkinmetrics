package storage

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
)

func createMockResponses(count int) []Response {
	responses := make([]Response, count)
	for i := 0; i < count; i++ {
		responses[i] = Response{
			Request: api.BnetRequest{
				Region:    api.RegionUS,
				Namespace: api.NamespaceProfile,
				Path:      fmt.Sprintf("/data/wow/character/tichondrius/char%d", i),
			},
			Body: []byte(fmt.Sprintf("{\"value\": %d}}", i)),
		}
	}
	return responses
}

func TestCanRetrieve(t *testing.T) {
	db, err := NewSqlite(":memory:", SqliteOptions{})
	if err != nil {
		t.Fatal(err)
	}

	request := api.BnetRequest{
		Region:    api.RegionUS,
		Namespace: api.NamespaceProfile,
		Path:      "/data/wow/character/tichondrius/charactername",
	}
	response := []byte("{\"hello\": \"world\"}}")

	err = db.Store(&request, response, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	storedResponse, err := db.Get(&request)
	if err != nil {
		t.Fatal(err)
	}

	if string(storedResponse.Body) != string(response) {
		t.Fatalf("expected %s, got %s", response, storedResponse.Body)
	}
}

func TestCanExpire(t *testing.T) {
	db, err := NewSqlite(":memory:", SqliteOptions{})
	if err != nil {
		t.Fatal(err)
	}

	request := api.BnetRequest{
		Region:    api.RegionUS,
		Namespace: api.NamespaceProfile,
		Path:      "/data/wow/character/tichondrius/charactername",
	}
	response := []byte("{\"hello\": \"world\"}}")

	err = db.Store(&request, response, -1*time.Second)
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.Get(&request)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected %s, got %s", ErrNotFound, err)
	}
}

func TestCanRetrieveFromMany(t *testing.T) {
	db, err := NewSqlite(":memory:", SqliteOptions{})
	if err != nil {
		t.Fatal(err)
	}

	mockResponses := createMockResponses(100)

	for i := 0; i < 100; i++ {
		err = db.Store(&mockResponses[i].Request, mockResponses[i].Body, time.Hour)
		if err != nil {
			t.Fatal(err)
		}
	}

	for i := 0; i < 100; i++ {
		request := mockResponses[i].Request
		response := mockResponses[i].Body

		storedResponse, err := db.Get(&request)
		if err != nil {
			t.Fatal(err)
		}
		if string(storedResponse.Body) != string(response) {
			t.Fatalf("expected %s, got %s", response, storedResponse.Body)
		}
	}
}

func TestCanReplace(t *testing.T) {
	db, err := NewSqlite(":memory:", SqliteOptions{})
	if err != nil {
		t.Fatal(err)
	}

	request := api.BnetRequest{
		Region:    api.RegionUS,
		Namespace: api.NamespaceProfile,
		Path:      "/data/wow/character/tichondrius/charactername",
	}
	response := []byte("{\"value\": \"1\"}}")

	err = db.Store(&request, response, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	storedResponse, err := db.Get(&request)
	if err != nil {
		t.Fatal(err)
	}

	originalTimestamp := storedResponse.Timestamp
	time.Sleep(2 * time.Second)

	response = []byte("{\"value\": \"2\"}}")

	err = db.Store(&request, response, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	storedResponse, err = db.Get(&request)
	if err != nil {
		t.Fatal(err)
	}

	if string(storedResponse.Body) != string(response) {
		t.Fatalf("expected %s, got %s", response, storedResponse.Body)
	}

	if storedResponse.Timestamp.Equal(originalTimestamp) {
		t.Fatalf("expected timestamps to be different, got %s", storedResponse.Timestamp)
	}
}

func TestMissing(t *testing.T) {
	db, err := NewSqlite(":memory:", SqliteOptions{})
	if err != nil {
		t.Fatal(err)
	}

	request := api.BnetRequest{
		Region:    api.RegionUS,
		Namespace: api.NamespaceProfile,
		Path:      "/data/wow/character/tichondrius/charactername",
	}

	_, err = db.Get(&request)
	if err == nil {
		t.Fatal("expected error, got nil")
	} else if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
