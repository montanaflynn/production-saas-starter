package cognitive

import (
	"github.com/gin-gonic/gin"

	"github.com/moasq/backend/pkg/auth"
	serverDomain "github.com/moasq/backend/server/domain"
)

type Routes struct {
	handler *Handler
}

func NewRoutes(handler *Handler) *Routes {
	return &Routes{
		handler: handler,
	}
}

func (r *Routes) RegisterRoutes(router *gin.RouterGroup, resolver serverDomain.MiddlewareResolver) {
	cognitiveGroup := router.Group("/example_cognitive")
	cognitiveGroup.Use(
		resolver.Get("auth"),
		resolver.Get("org_context"),
		resolver.Get("subscription"),
	)
	{
		// Chat endpoint
		cognitiveGroup.POST("/chat",
			auth.RequirePermissionFunc("resource", "create"),
			r.handler.Chat)

		// Chat sessions
		sessionsGroup := cognitiveGroup.Group("/sessions")
		{
			sessionsGroup.GET("",
				auth.RequirePermissionFunc("resource", "view"),
				r.handler.ListSessions)

			sessionsGroup.GET("/:id/messages",
				auth.RequirePermissionFunc("resource", "view"),
				r.handler.GetSessionHistory)
		}
	}
}

// Routes returns a RouteRegistrar function compatible with the server interface
func (r *Routes) Routes(router *gin.RouterGroup, resolver serverDomain.MiddlewareResolver) {
	r.RegisterRoutes(router, resolver)
}
