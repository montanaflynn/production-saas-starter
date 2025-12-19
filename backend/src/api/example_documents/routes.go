package documents

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
	docsGroup := router.Group("/example_documents")
	docsGroup.Use(
		resolver.Get("auth"),
		resolver.Get("org_context"),
		resolver.Get("subscription"),
	)
	{
		// Upload document
		docsGroup.POST("/upload",
			auth.RequirePermissionFunc("resource", "create"),
			r.handler.UploadDocument)

		// List documents
		docsGroup.GET("",
			auth.RequirePermissionFunc("resource", "view"),
			r.handler.ListDocuments)

		// Delete document
		docsGroup.DELETE("/:id",
			auth.RequirePermissionFunc("resource", "delete"),
			r.handler.DeleteDocument)
	}
}

// Routes returns a RouteRegistrar function compatible with the server interface
func (r *Routes) Routes(router *gin.RouterGroup, resolver serverDomain.MiddlewareResolver) {
	r.RegisterRoutes(router, resolver)
}
