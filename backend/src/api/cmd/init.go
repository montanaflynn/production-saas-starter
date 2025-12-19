package cmd

import (
	"go.uber.org/dig"

	api "github.com/moasq/backend/api"
)

func Init(container *dig.Container) {
	if err := api.Init(container); err != nil {
		panic(err)
	}
}