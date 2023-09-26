package validate

import (
	"testing"
)

func TestSchemaExpectsValidJson(t *testing.T) {
	v, err := NewSchemaValidator(`{"type": "object"}`)
	if err != nil {
		t.Fatal(err)
	}
	if v.IsValid([]byte(`"foo": "bar"`)) {
		t.Fatal("expected invalid json")
	}
}

func TestSchemaCanValidateJson(t *testing.T) {
	v, err := NewSchemaValidator(`{"type": "object"}`)
	if err != nil {
		t.Fatal(err)
	}
	if !v.IsValid([]byte(`{"foo": "bar"}`)) {
		t.Fatal("expected valid json")
	}
}

func TestSchemaFailsOnNil(t *testing.T) {
	v, err := NewSchemaValidator(`{"type": "object"}`)
	if err != nil {
		t.Fatal(err)
	}
	if v.IsValid(nil) {
		t.Fatal("expected invalid json")
	}
}
