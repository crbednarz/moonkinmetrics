package validate

import (
	"testing"
)

type testStruct struct {
	Foo string `json:"foo"`
}

func TestSchemaCanValidateJson(t *testing.T) {
	v, err := NewSchemaValidator[testStruct](`{"type": "object","properties": {"foo": {"type": "string"}}}`)
	if err != nil {
		t.Fatal(err)
	}
	object := testStruct{}
	if v.IsValid(&object) != nil {
		t.Fatal("expected validation to pass")
	}
}

func TestSchemaCanFailValidation(t *testing.T) {
	v, err := NewSchemaValidator[testStruct](`{"type": "object","properties": {"foo": {"type": "string", "minLength": 3}}}`)
	if err != nil {
		t.Fatal(err)
	}
	object := testStruct{}
	object.Foo = ""
	if v.IsValid(&object) == nil {
		t.Fatal("expected validation to fail")
	}
}
