package zerolog

import (
	"github.com/moasq/backend/pkg/logger/domain"
)

func NewLogger(opts *domain.Options) domain.Logger {
	return newZerologLogger(opts)
}
