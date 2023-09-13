package storage

import (
	"fmt"
	"testing"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
)

func TestCanRetrieve(t *testing.T) {
    db, err := NewSqlite(":memory:")
    if err != nil {
        t.Fatal(err)
    }

    request := bnet.Request{
        Region:    "us",
        Namespace: "profile-us",
        Path:      "/data/wow/character/tichondrius/charactername",
    }
    response := []byte("{\"hello\": \"world\"}}")

    err = db.Store(request, response)
    if err != nil {
        t.Fatal(err)
    }

    storedResponse, err := db.Get(request)
    if err != nil {
        t.Fatal(err)
    }

    if string(storedResponse.Body) != string(response) {
        t.Fatalf("expected %s, got %s", response, storedResponse.Body)
    }
}


func TestCanRetrieveFromMany(t *testing.T) {
    db, err := NewSqlite(":memory:")
    if err != nil {
        t.Fatal(err)
    }

    for i := 0; i < 100; i++ {
        request := bnet.Request{
            Region:    "us",
            Namespace: "profile-us",
            Path:      fmt.Sprintf("/data/wow/character/tichondrius/charact%d", i),
        }
        response := []byte(fmt.Sprintf("{\"value\": %d}}", i))

        err = db.Store(request, response)
        if err != nil {
            t.Fatal(err)
        }
    }

    for i := 0; i < 100; i++ {
        request := bnet.Request{
            Region:    "us",
            Namespace: "profile-us",
            Path:      fmt.Sprintf("/data/wow/character/tichondrius/charact%d", i),
        }
        response := []byte(fmt.Sprintf("{\"value\": %d}}", i))

        storedResponse, err := db.Get(request)
        if err != nil {
            t.Fatal(err)
        }
        if string(storedResponse.Body) != string(response) {
            t.Fatalf("expected %s, got %s", response, storedResponse.Body)
        }
    }
}

func TestCanReplace(t *testing.T) {
    db, err := NewSqlite(":memory:")
    if err != nil {
        t.Fatal(err)
    }

    request := bnet.Request{
        Region:    "us",
        Namespace: "profile-us",
        Path:      "/data/wow/character/tichondrius/charactername",
    }
    response := []byte("{\"value\": \"1\"}}")

    err = db.Store(request, response)
    if err != nil {
        t.Fatal(err)
    }
    
    storedResponse, err := db.Get(request)
    if err != nil {
        t.Fatal(err)
    }

    originalTimestamp := storedResponse.Timestamp
    time.Sleep(2 * time.Second)

    response = []byte("{\"value\": \"2\"}}")

    err = db.Store(request, response)
    if err != nil {
        t.Fatal(err)
    }

    storedResponse, err = db.Get(request)
    if err != nil {
        t.Fatal(err)
    }

    if string(storedResponse.Body) != string(response) {
        t.Fatalf("expected %s, got %s", response, storedResponse.Body)
    }

    if storedResponse.Timestamp == originalTimestamp {
        t.Fatalf("expected timestamp to change, got %d", storedResponse.Timestamp)
    }
}
