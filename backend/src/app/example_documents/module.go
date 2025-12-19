package documents

import (
	"go.uber.org/dig"

	"github.com/moasq/backend/app/example_documents/app/services"
	"github.com/moasq/backend/app/example_documents/domain"
	"github.com/moasq/backend/app/example_documents/infra/repositories"
	"github.com/moasq/backend/pkg/db/adapters"
	"github.com/moasq/backend/pkg/eventbus"
	filedomain "github.com/moasq/backend/pkg/file_manager/domain"
	"github.com/moasq/backend/pkg/logger"
	ocrdomain "github.com/moasq/backend/pkg/ocr/domain"
)

// Module provides documents module dependencies
type Module struct {
	container *dig.Container
}

func NewModule(container *dig.Container) *Module {
	return &Module{
		container: container,
	}
}

// RegisterDependencies registers all documents module dependencies
func (m *Module) RegisterDependencies() error {
	// Register document repository
	if err := m.container.Provide(func(
		docStore adapters.DocumentStore,
	) domain.DocumentRepository {
		return repositories.NewDocumentRepository(docStore)
	}); err != nil {
		return err
	}

	// Register document service
	if err := m.container.Provide(func(
		docRepo domain.DocumentRepository,
		fileService filedomain.FileService,
		ocrService ocrdomain.OCRService,
		eventBus eventbus.EventBus,
		logger logger.Logger,
	) services.DocumentService {
		return services.NewDocumentService(docRepo, fileService, ocrService, eventBus, logger)
	}); err != nil {
		return err
	}

	return nil
}
