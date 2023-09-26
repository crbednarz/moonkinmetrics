package validate

import (
	"fmt"

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
		return false
	}
	return result.Valid()
}
