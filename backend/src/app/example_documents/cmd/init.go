package cmd

import (
	"go.uber.org/dig"

	"github.com/moasq/backend/app/example_documents"
)

func Init(container *dig.Container) error {
	module := documents.NewModule(container)
	return module.RegisterDependencies()
}
