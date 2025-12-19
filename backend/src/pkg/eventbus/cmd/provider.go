package cmd

import (
	"go.uber.org/dig"
	
	"github.com/moasq/backend/pkg/eventbus"
	"github.com/moasq/backend/pkg/logger/domain"
)

// ProvideEventBus creates and configures the event bus with middleware
func ProvideEventBus(container *dig.Container) error {
	return container.Provide(func(logger domain.Logger) eventbus.EventBus {
		middleware := []eventbus.EventMiddleware{
			eventbus.RecoveryMiddleware(logger),
			eventbus.LoggingMiddleware(logger),
			eventbus.MetricsMiddleware(),
		}
		
		return eventbus.NewInMemoryEventBus(middleware...)
	})
}