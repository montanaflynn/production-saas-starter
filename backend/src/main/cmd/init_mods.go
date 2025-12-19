package cmd

import (
	"context"

	"go.uber.org/dig"

	api "github.com/moasq/backend/api/cmd"
	cognitive "github.com/moasq/backend/app/example_cognitive/cmd"
	documents "github.com/moasq/backend/app/example_documents/cmd"
	organizations "github.com/moasq/backend/app/organizations/cmd"
	orgDomain "github.com/moasq/backend/app/organizations/domain"
	billing "github.com/moasq/backend/app/billing/cmd"
	docs "github.com/moasq/backend/docs/cmd"
	"github.com/moasq/backend/pkg/auth"
	authPkg "github.com/moasq/backend/pkg/auth/cmd"
	db "github.com/moasq/backend/pkg/db/cmd"
	eventbus "github.com/moasq/backend/pkg/eventbus/cmd"
	file_manager "github.com/moasq/backend/pkg/file_manager/cmd"
	llm "github.com/moasq/backend/pkg/llm/cmd"
	logger "github.com/moasq/backend/pkg/logger/cmd"
	ocr "github.com/moasq/backend/pkg/ocr/cmd"
	polar "github.com/moasq/backend/pkg/polar/cmd"
	redisCmd "github.com/moasq/backend/pkg/redis/cmd"
	stytchCmd "github.com/moasq/backend/pkg/stytch/cmd"
	paywall "github.com/moasq/backend/pkg/paywall"
	server "github.com/moasq/backend/server/cmd"
)

// orgLookupAdapter adapts orgDomain.OrganizationRepository to auth.OrganizationLookup
type orgLookupAdapter struct {
	repo orgDomain.OrganizationRepository
}

func (a *orgLookupAdapter) GetByStytchID(ctx context.Context, stytchOrgID string) (auth.OrganizationEntity, error) {
	return a.repo.GetByStytchID(ctx, stytchOrgID)
}

// accLookupAdapter adapts orgDomain.AccountRepository to auth.AccountLookup
type accLookupAdapter struct {
	repo orgDomain.AccountRepository
}

func (a *accLookupAdapter) GetByEmail(ctx context.Context, orgID int32, email string) (auth.AccountEntity, error) {
	return a.repo.GetByEmail(ctx, orgID, email)
}

func InitMods(container *dig.Container) {

	// pkg
	server.Init(container)
	logger.Init(container)
	db.Init(container)
	file_manager.Init(container)
	if err := eventbus.Init(container); err != nil {
		panic(err)
	}
	if err := llm.Init(container); err != nil {
		panic(err)
	}

	// Polar package must be initialized before payment module (payment depends on Polar client)
	if err := polar.Init(container); err != nil {
		panic(err)
	}

	// Redis must be initialized before auth (Stytch repositories rely on Redis-backed clients upstream)
	if err := redisCmd.Init(container); err != nil {
		panic(err)
	}

	// Stytch client package must be initialized before app/auth (for organization/member management)
	// This provides: stytch.Config, stytch.Client, stytch.RBACPolicyService
	if err := stytchCmd.ProvideStytchDependencies(container); err != nil {
		panic(err)
	}

	// Auth package (pkg/auth) must be initialized before app/auth
	// This provides: auth.AuthProvider (authentication/authorization)
	if err := authPkg.Init(container); err != nil {
		panic(err)
	}

	// docs
	docs.Init(container)

	// app
	if err := organizations.Init(container); err != nil {
		panic(err)
	}

	// Register auth resolvers (bridges organizations domain to auth package)
	if err := auth.ProvideResolvers(container,
		func(repo orgDomain.OrganizationRepository) auth.OrganizationResolver {
			return auth.NewOrganizationResolver(&orgLookupAdapter{repo: repo})
		},
		func(repo orgDomain.AccountRepository) auth.AccountResolver {
			return auth.NewAccountResolver(&accLookupAdapter{repo: repo})
		},
	); err != nil {
		panic(err)
	}

	// Initialize auth middleware (requires resolvers to be registered)
	if err := authPkg.InitMiddleware(container); err != nil {
		panic(err)
	}

	// Register auth middleware as named middlewares for use in routes
	if err := auth.RegisterNamedMiddlewares(container); err != nil {
		panic(err)
	}

	// Billing module (subscription lifecycle, quotas, webhooks)
	if err := billing.Init(container); err != nil {
		panic(err)
	}

	// Paywall middleware (access gating based on subscription status)
	if err := paywall.SetupMiddleware(container); err != nil {
		panic(err)
	}
	if err := paywall.RegisterNamedMiddlewares(container); err != nil {
		panic(err)
	}

	// OCR service (Mistral API for document text extraction)
	// Must be initialized before documents module (documents depends on OCR)
	if err := ocr.Init(container); err != nil {
		panic(err)
	}

	// Documents module (PDF upload and text extraction)
	if err := documents.Init(container); err != nil {
		panic(err)
	}

	// Cognitive module (AI/RAG with embeddings and vector search)
	// Note: This also wires the event listener for DocumentUploaded events
	if err := cognitive.Init(container); err != nil {
		panic(err)
	}

	// api
	api.Init(container)
}
