package validate

import (
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/xeipuuv/gojsonreference"
	"github.com/xeipuuv/gojsonschema"
)

type JsonSchemaValidator[T any] struct {
	schema *gojsonschema.Schema
}

type jsonGoLoader struct {
	source interface{}
}

func (l *jsonGoLoader) JsonSource() interface{} {
	return l.source
}

func (l *jsonGoLoader) JsonReference() (gojsonreference.JsonReference, error) {
	return gojsonreference.NewJsonReference("#")
}

func (l *jsonGoLoader) LoaderFactory() gojsonschema.JSONLoaderFactory {
	return &gojsonschema.DefaultJSONLoaderFactory{}
}

func NewGoLoader(source interface{}) gojsonschema.JSONLoader {
	return &jsonGoLoader{source: source}
}

func (l *jsonGoLoader) LoadJSON() (interface{}, error) {
	jsonBytes, err := sonic.Marshal(l.JsonSource())
	if err != nil {
		return nil, err
	}

	var t interface{}
	err = sonic.Unmarshal(jsonBytes, &t)
	if err != nil {
		return nil, err
	}
	return t, nil
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
	documentLoader := NewGoLoader(object)
	result, err := v.schema.Validate(documentLoader)
	if err != nil {
		return err
	}

	if !result.Valid() {
		return fmt.Errorf("failed schema validation: %v", result.Errors())
	}

	return nil
}
