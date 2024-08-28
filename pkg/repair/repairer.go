package repair

type Repairer[T any] interface {
	Repair(*T) error
}

type FuncRepairer[T any] struct {
	RepairFunc func(*T) error
}

func NewRepair[T any](f func(*T) error) Repairer[T] {
	return FuncRepairer[T]{
		RepairFunc: f,
	}
}

func (r FuncRepairer[T]) Repair(t *T) error {
	return r.RepairFunc(t)
}
