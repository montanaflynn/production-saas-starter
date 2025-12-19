package example_resource

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
	resourceGroup := router.Group("/resources")
	resourceGroup.Use(
		resolver.Get("auth"),
		resolver.Get("org_context"),
	)
	{
		// Upload and process with file
		resourceGroup.POST("/upload-and-process",
			auth.RequirePermissionFunc("resource", "create"),
			r.handler.UploadAndProcessResource)

		// CRUD operations
		resourceGroup.POST("",
			auth.RequirePermissionFunc("resource", "create"),
			r.handler.CreateResource)

		resourceGroup.GET("/:id",
			auth.RequirePermissionFunc("resource", "view"),
			r.handler.GetResourceByID)

		resourceGroup.GET("",
			auth.RequirePermissionFunc("resource", "view"),
			r.handler.ListResources)

		resourceGroup.PUT("/:id",
			auth.RequirePermissionFunc("resource", "edit"),
			r.handler.UpdateResource)

		resourceGroup.DELETE("/:id",
			auth.RequirePermissionFunc("resource", "delete"),
			r.handler.DeleteResource)

		// Duplicate detection
		resourceGroup.GET("/:id/duplicates",
			auth.RequirePermissionFunc("resource", "view"),
			r.handler.GetResourceDuplicates)
	}
}

// Routes returns a RouteRegistrar function compatible with the server interface
func (r *Routes) Routes(router *gin.RouterGroup, resolver serverDomain.MiddlewareResolver) {
	r.RegisterRoutes(router, resolver)
}
