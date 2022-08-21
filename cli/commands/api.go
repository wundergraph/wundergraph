package commands

type API interface {
	Execute(commandType CommandType, opt ...Option) error
}
