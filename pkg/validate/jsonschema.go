package validate

import (
	"fmt"
	"log"

	"github.com/xeipuuv/gojsonschema"
)

type LegacySchemaValidator struct {
	schema *gojsonschema.Schema
}

type SchemaValidator[T any] struct {
	schema *gojsonschema.Schema
}

func NewSchemaValidator[T any](jsonSchema string) (*SchemaValidator[T], error) {
	if len(jsonSchema) == 0 {
		return nil, fmt.Errorf("json schema cannot be empty")
	}

	schemaLoader := gojsonschema.NewStringLoader(jsonSchema)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, err
	}
	return &SchemaValidator[T]{
		schema: schema,
	}, nil
}

func (v *SchemaValidator[T]) IsValid(object *T) bool {
	documentLoader := gojsonschema.NewGoLoader(object)
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		log.Printf("Error running schema validation: %v", err)
		return false
	}

	if !result.Valid() {
		log.Printf("Failed schema validation: %v", result.Errors())
	}

	return result.Valid()
}

func NewLegacySchemaValidator(jsonSchema string) (*LegacySchemaValidator, error) {
	if len(jsonSchema) == 0 {
		return nil, fmt.Errorf("json schema cannot be empty")
	}

	schemaLoader := gojsonschema.NewStringLoader(jsonSchema)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, err
	}
	return &LegacySchemaValidator{
		schema: schema,
	}, nil
}

func (v *LegacySchemaValidator) IsValid(json []byte) bool {
	if len(json) == 0 {
		return false
	}

	documentLoader := gojsonschema.NewStringLoader(string(json))
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		log.Printf("Error running schema validation: %v", err)
		return false
	}
	if !result.Valid() {
		log.Printf("Failed schema validation: %v", result.Errors())
	}

	return result.Valid()
}
