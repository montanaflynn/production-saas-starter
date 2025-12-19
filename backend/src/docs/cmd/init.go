package cmd

import (
	"log"

	"go.uber.org/dig"

	"github.com/moasq/backend/docs/api"
	server "github.com/moasq/backend/server/domain"
)

func Init(container *dig.Container) {
	err := container.Invoke(func(srv server.Server) {
		handler := api.NewHandler()
		srv.RegisterRoutes(handler.Routes, "")
	})

	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
