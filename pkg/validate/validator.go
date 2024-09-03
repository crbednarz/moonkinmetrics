package validate

// Validator is an interface for validating API responses.
// As Blizzard's API is not always consistent, this is necessary.
type Validator[T any] interface {
	IsValid(*T) error
}
