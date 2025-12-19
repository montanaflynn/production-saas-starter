package cmd

import (
	"go.uber.org/dig"

	"github.com/moasq/backend/pkg/llm/domain"
	"github.com/moasq/backend/pkg/llm/infra"
	loggerDomain "github.com/moasq/backend/pkg/logger/domain"
)

func Init(container *dig.Container) error {
	// Register LLMClient (which includes LLMService)
	if err := container.Provide(func(logger loggerDomain.Logger) (domain.LLMClient, error) {
		config := infra.NewLLMConfig()
		return infra.NewOpenAIClient(config, logger)
	}); err != nil {
		return err
	}

	// Also register LLMService for backward compatibility
	return container.Provide(func(client domain.LLMClient) domain.LLMService {
		return client
	})
}