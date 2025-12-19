module github.com/moasq/backend/app/example_documents

go 1.25

require (
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.7.2
	github.com/moasq/backend/pkg/db v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/pkg/eventbus v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/pkg/file_manager v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/pkg/logger v0.0.0
	github.com/moasq/backend/pkg/ocr v0.0.0-00010101000000-000000000000
	go.uber.org/dig v1.19.0
)

require (
	github.com/gabriel-vasile/mimetype v1.4.10 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/pgvector/pgvector-go v0.3.0 // indirect
	github.com/rs/zerolog v1.33.0 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	golang.org/x/crypto v0.36.0 // indirect
	golang.org/x/sync v0.12.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	gopkg.in/natefinch/lumberjack.v2 v2.2.1 // indirect
)

replace github.com/moasq/backend/pkg/db => ../../pkg/db

replace github.com/moasq/backend/pkg/eventbus => ../../pkg/eventbus

replace github.com/moasq/backend/pkg/file_manager => ../../pkg/file_manager

replace github.com/moasq/backend/pkg/logger => ../../pkg/logger

replace github.com/moasq/backend/pkg/ocr => ../../pkg/ocr
