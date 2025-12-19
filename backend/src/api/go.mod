module github.com/moasq/backend/api

go 1.25

require (
	github.com/gin-gonic/gin v1.10.1
	github.com/moasq/backend/app/billing v0.0.0
	github.com/moasq/backend/app/example_cognitive v0.0.0
	github.com/moasq/backend/app/example_documents v0.0.0
	github.com/moasq/backend/app/organizations v0.0.0
	github.com/moasq/backend/pkg/api v0.0.0
	github.com/moasq/backend/pkg/auth v0.0.0
	github.com/moasq/backend/pkg/common v0.0.0
	github.com/moasq/backend/pkg/logger v0.0.0
	github.com/moasq/backend/server v0.0.0-00010101000000-000000000000
	go.uber.org/dig v1.19.0
)

require (
	github.com/bytedance/sonic v1.12.5 // indirect
	github.com/bytedance/sonic/loader v0.2.1 // indirect
	github.com/cloudwego/base64x v0.1.4 // indirect
	github.com/cloudwego/iasm v0.2.0 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/gabriel-vasile/mimetype v1.4.10 // indirect
	github.com/gin-contrib/cors v1.7.2 // indirect
	github.com/gin-contrib/sse v0.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.23.0 // indirect
	github.com/goccy/go-json v0.10.5 // indirect
	github.com/golang-migrate/migrate/v4 v4.17.1 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.7.2 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/cpuid/v2 v2.2.9 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/moasq/backend/pkg/db v0.0.0 // indirect
	github.com/moasq/backend/pkg/eventbus v0.0.0-00010101000000-000000000000 // indirect
	github.com/moasq/backend/pkg/file_manager v0.0.0-00010101000000-000000000000 // indirect
	github.com/moasq/backend/pkg/polar v0.0.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.2.3 // indirect
	github.com/pgvector/pgvector-go v0.3.0 // indirect
	github.com/rs/zerolog v1.33.0 // indirect
	github.com/sagikazarmark/locafero v0.4.0 // indirect
	github.com/sagikazarmark/slog-shim v0.1.0 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/sourcegraph/conc v0.3.0 // indirect
	github.com/spf13/afero v1.11.0 // indirect
	github.com/spf13/cast v1.6.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/spf13/viper v1.19.0 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/twpayne/go-geom v1.6.1 // indirect
	github.com/ugorji/go/codec v1.2.12 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	go.uber.org/zap v1.27.0 // indirect
	golang.org/x/arch v0.12.0 // indirect
	golang.org/x/crypto v0.36.0 // indirect
	golang.org/x/exp v0.0.0-20240325151524-a685a6edb6d8 // indirect
	golang.org/x/net v0.37.0 // indirect
	golang.org/x/sync v0.12.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	golang.org/x/time v0.8.0 // indirect
	google.golang.org/protobuf v1.35.2 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/natefinch/lumberjack.v2 v2.2.1 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/moasq/backend/app/example_cognitive => ../app/example_cognitive

replace github.com/moasq/backend/app/example_documents => ../app/example_documents

replace github.com/moasq/backend/app/organizations => ../app/organizations

replace github.com/moasq/backend/pkg/api => ../pkg/api

replace github.com/moasq/backend/pkg/common => ../pkg/common

replace github.com/moasq/backend/pkg/db => ../pkg/db

replace github.com/moasq/backend/pkg/eventbus => ../pkg/eventbus

replace github.com/moasq/backend/pkg/file_manager => ../pkg/file_manager

replace github.com/moasq/backend/pkg/llm => ../pkg/llm

replace github.com/moasq/backend/pkg/logger => ../pkg/logger

replace github.com/moasq/backend/pkg/stytch => ../pkg/stytch

replace github.com/moasq/backend/server => ../pkg/server

replace github.com/moasq/backend/app/billing => ../app/billing

replace github.com/moasq/backend/pkg/auth => ../pkg/auth

replace github.com/moasq/backend/pkg/paywall => ../pkg/paywall

replace github.com/moasq/backend/pkg/polar => ../pkg/polar

replace github.com/moasq/backend/pkg/redis => ../pkg/redis
