package scan

type ResultProcessor[T any] interface {
	Process(*T) error
}

type FuncResultProcessor[T any] struct {
	Func func(*T) error
}

func NewResultProcessor[T any](f func(*T) error) ResultProcessor[T] {
	return FuncResultProcessor[T]{
		Func: f,
	}
}

func (r FuncResultProcessor[T]) Process(t *T) error {
	return r.Func(t)
}
