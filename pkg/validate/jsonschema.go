package validate

import (
	"fmt"
	"log"

	"github.com/xeipuuv/gojsonschema"
)

type SchemaValidator struct {
	schema *gojsonschema.Schema
}

func NewSchemaValidator(jsonSchema string) (*SchemaValidator, error) {
	if len(jsonSchema) == 0 {
		return nil, fmt.Errorf("json schema cannot be empty")
	}

	schemaLoader := gojsonschema.NewStringLoader(jsonSchema)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, err
	}
	return &SchemaValidator{
		schema: schema,
	}, nil
}

func (v *SchemaValidator) IsValid(json []byte) bool {
	if len(json) == 0 {
		return false
	}

	documentLoader := gojsonschema.NewStringLoader(string(json))
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		log.Printf("Error validating schema: %v", err)
		return false
	}
	if !result.Valid() {
		log.Printf("Failed schema validation: %v", result.Errors())
	}

	return result.Valid()
}
