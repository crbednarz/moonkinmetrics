package main

import (
	"context"
	"log"

	"github.com/crbednarz/moonkinmetrics/pkg/cli"
)

func main() {
	ctx := context.Background()
	err := cli.Run(ctx)
	if err != nil {
		log.Fatalf("unhandled error: %v", err)
	}
}
