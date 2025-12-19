package cmd

import (
	"go.uber.org/dig"

	"github.com/moasq/backend/app/organizations"
)

func Init(container *dig.Container) error {
	module := organizations.NewModule(container)
	return module.RegisterDependencies()
}