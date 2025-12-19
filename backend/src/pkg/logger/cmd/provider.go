package cmd

import (
	"github.com/moasq/backend/pkg/logger"
	"go.uber.org/dig"
)

func ProvideDependencies(container *dig.Container) {
	container.Provide(logger.New)
}
