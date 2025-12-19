module github.com/moasq/backend/pkg/eventbus

go 1.25


require (
	github.com/moasq/backend/pkg/logger v0.0.0
	github.com/google/uuid v1.6.0
	github.com/shopspring/decimal v1.4.0
	go.uber.org/dig v1.19.0
)

replace github.com/moasq/backend/pkg/logger => ../logger
