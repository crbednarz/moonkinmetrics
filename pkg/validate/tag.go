package validate

import (
	"gopkg.in/validator.v2"
)

type TagValidator[T any] struct {
	validator validator.Validator
}

func (v *TagValidator[T]) IsValid(object *T) error {
	return v.validator.Validate(object)
}

func NewTagValidator[T any]() *TagValidator[T] {
	v := &TagValidator[T]{
		validator: *validator.NewValidator(),
	}
	return v
}

func (v *TagValidator[T]) SetValidationFunc(name string, callback validator.ValidationFunc) error {
	return v.validator.SetValidationFunc(name, callback)
}
