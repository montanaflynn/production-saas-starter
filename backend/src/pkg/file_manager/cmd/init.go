package cmd

import (
	"log"

	"go.uber.org/dig"
	"github.com/moasq/backend/pkg/file_manager/config"
)

func Init(container *dig.Container) {

	if err := container.Provide(config.LoadConfig); err != nil {
		log.Fatalf("Failed to provide file_manager config: %v", err)
	}

	SetupDependencies(container)
}
