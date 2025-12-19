package cmd

import (
	"go.uber.org/dig"

	"github.com/moasq/backend/pkg/ocr/domain"
	"github.com/moasq/backend/pkg/ocr/infra"
	loggerDomain "github.com/moasq/backend/pkg/logger/domain"
)

func Init(container *dig.Container) error {
	return container.Provide(func(logger loggerDomain.Logger) (domain.OCRService, error) {
		config := infra.NewOCRConfig()
		return infra.NewMistralOCRClient(config, logger)
	})
}