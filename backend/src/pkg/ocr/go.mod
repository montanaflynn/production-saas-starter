module github.com/moasq/backend/pkg/ocr

go 1.25


require (
	github.com/moasq/backend/pkg/logger v0.0.0
	go.uber.org/dig v1.19.0
)

replace github.com/moasq/backend/pkg/logger => ../logger
