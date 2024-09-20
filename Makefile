.PHONY: testdata

testdata:
	rm -r pkg/testutils/testdata/data
	go run cmd/testgen/gen.go
