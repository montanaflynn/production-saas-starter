module github.com/moasq/backend/api/example_resource

go 1.25

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/moasq/backend/app/example_resource v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/pkg/auth v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/pkg/common v0.0.0-00010101000000-000000000000
	github.com/moasq/backend/server v0.0.0-00010101000000-000000000000
	go.uber.org/dig v1.18.0
)

replace github.com/moasq/backend/app/example_resource => ../../app/example_resource

replace github.com/moasq/backend/pkg/auth => ../../pkg/auth

replace github.com/moasq/backend/pkg/common => ../../pkg/common

replace github.com/moasq/backend/server => ../../server
