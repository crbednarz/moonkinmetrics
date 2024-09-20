package validate

import (
	"fmt"

	"github.com/xeipuuv/gojsonschema"
)

type JsonSchemaValidator[T any] struct {
	schema *gojsonschema.Schema
}

func NewSchemaValidator[T any](jsonSchema string) (Validator[T], error) {
	if len(jsonSchema) == 0 {
		return nil, fmt.Errorf("json schema cannot be empty")
	}

	schemaLoader := gojsonschema.NewStringLoader(jsonSchema)
	schema, err := gojsonschema.NewSchema(schemaLoader)
	if err != nil {
		return nil, err
	}
	return &JsonSchemaValidator[T]{
		schema: schema,
	}, nil
}

func (v *JsonSchemaValidator[T]) IsValid(object *T) error {
	documentLoader := gojsonschema.NewGoLoader(object)
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		return err
	}

	if !result.Valid() {
		return fmt.Errorf("failed schema validation: %v", result.Errors())
	}

	return nil
}
