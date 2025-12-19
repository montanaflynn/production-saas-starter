package example_resource

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/moasq/backend/app/example_resource/app/services"
	"github.com/moasq/backend/app/example_resource/domain"
	"github.com/moasq/backend/pkg/auth"
	"github.com/moasq/backend/pkg/common/errors"
)

type Handler struct {
	service services.ResourceService
}

func NewHandler(service services.ResourceService) *Handler {
	return &Handler{service: service}
}

// UploadAndProcessResource uploads a file and processes it with OCR/LLM
// @Summary Upload and process resource file
// @Description Uploads a file, performs OCR, LLM processing, and stores the resource
// @Tags Resources
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to upload"
// @Param metadata formData string false "JSON metadata object"
// @Success 201 {object} domain.Resource
// @Failure 400 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources/upload-and-process [post]
func (h *Handler) UploadAndProcessResource(c *gin.Context) {
	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_file",
			"Failed to read file: "+err.Error(),
		))
		return
	}
	defer file.Close()

	// Optional metadata (could parse JSON from form field if needed)
	var metadata map[string]any

	// Call service with individual parameters (no DTO)
	resource, err := h.service.UploadAndProcessResource(
		c.Request.Context(),
		reqCtx.OrganizationID,
		reqCtx.AccountID,
		header.Filename,
		header.Size,
		header.Header.Get("Content-Type"),
		file,
		metadata,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"upload_failed",
			"Failed to upload and process resource: "+err.Error(),
		))
		return
	}

	// Return domain entity directly
	c.JSON(http.StatusCreated, resource)
}

// CreateResource creates a new resource (without file processing)
// @Summary Create a new resource
// @Description Creates a new resource without file upload
// @Tags Resources
// @Accept json
// @Produce json
// @Param resource body domain.Resource true "Resource to create"
// @Success 201 {object} domain.Resource
// @Failure 400 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources [post]
func (h *Handler) CreateResource(c *gin.Context) {
	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	// Bind JSON directly to domain entity (no DTO)
	var resource domain.Resource
	if err := c.ShouldBindJSON(&resource); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_request",
			"Invalid JSON format: "+err.Error(),
		))
		return
	}

	// Set organization and account from context
	resource.OrganizationID = &reqCtx.OrganizationID
	resource.CreatedByAccountID = &reqCtx.AccountID

	// Validate domain entity
	if err := resource.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"validation_failed",
			err.Error(),
		))
		return
	}

	created, err := h.service.CreateResource(c.Request.Context(), &resource)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"create_failed",
			"Failed to create resource: "+err.Error(),
		))
		return
	}

	c.JSON(http.StatusCreated, created)
}

// GetResourceByID retrieves a resource by ID
// @Summary Get resource by ID
// @Description Retrieves a resource by its ID
// @Tags Resources
// @Produce json
// @Param id path int true "Resource ID"
// @Success 200 {object} domain.Resource
// @Failure 400 {object} errors.HTTPError
// @Failure 404 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources/{id} [get]
func (h *Handler) GetResourceByID(c *gin.Context) {
	idParam := c.Param("id")
	var resourceID int32
	if _, err := fmt.Sscanf(idParam, "%d", &resourceID); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_id",
			"Resource ID must be a valid number",
		))
		return
	}

	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	resource, err := h.service.GetResourceByID(c.Request.Context(), resourceID, reqCtx.OrganizationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"fetch_failed",
			"Failed to fetch resource: "+err.Error(),
		))
		return
	}

	c.JSON(http.StatusOK, resource)
}

// ListResources lists resources with pagination and filtering
// @Summary List resources
// @Description Lists resources with optional filtering and pagination
// @Tags Resources
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Param status_id query int false "Filter by status ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} errors.HTTPError
// @Router /resources [get]
func (h *Handler) ListResources(c *gin.Context) {
	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var statusID *int16
	if statusStr := c.Query("status_id"); statusStr != "" {
		status, _ := strconv.Atoi(statusStr)
		statusVal := int16(status)
		statusID = &statusVal
	}

	resources, total, err := h.service.ListResources(
		c.Request.Context(),
		reqCtx.OrganizationID,
		int32(limit),
		int32(offset),
		statusID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"list_failed",
			"Failed to list resources: "+err.Error(),
		))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"resources": resources,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// UpdateResource updates an existing resource
// @Summary Update resource
// @Description Updates an existing resource
// @Tags Resources
// @Accept json
// @Produce json
// @Param id path int true "Resource ID"
// @Param resource body domain.Resource true "Resource updates"
// @Success 200 {object} domain.Resource
// @Failure 400 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources/{id} [put]
func (h *Handler) UpdateResource(c *gin.Context) {
	idParam := c.Param("id")
	var resourceID int32
	if _, err := fmt.Sscanf(idParam, "%d", &resourceID); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_id",
			"Resource ID must be a valid number",
		))
		return
	}

	var resource domain.Resource
	if err := c.ShouldBindJSON(&resource); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_request",
			"Invalid JSON format: "+err.Error(),
		))
		return
	}

	// Set ID from path
	resource.ID = &resourceID

	// Validate
	if err := resource.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"validation_failed",
			err.Error(),
		))
		return
	}

	updated, err := h.service.UpdateResource(c.Request.Context(), &resource)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"update_failed",
			"Failed to update resource: "+err.Error(),
		))
		return
	}

	c.JSON(http.StatusOK, updated)
}

// DeleteResource soft-deletes a resource
// @Summary Delete resource
// @Description Soft-deletes a resource
// @Tags Resources
// @Param id path int true "Resource ID"
// @Success 204
// @Failure 400 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources/{id} [delete]
func (h *Handler) DeleteResource(c *gin.Context) {
	idParam := c.Param("id")
	var resourceID int32
	if _, err := fmt.Sscanf(idParam, "%d", &resourceID); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_id",
			"Resource ID must be a valid number",
		))
		return
	}

	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	if err := h.service.DeleteResource(c.Request.Context(), resourceID, reqCtx.OrganizationID); err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"delete_failed",
			"Failed to delete resource: "+err.Error(),
		))
		return
	}

	c.Status(http.StatusNoContent)
}

// GetResourceDuplicates retrieves duplicate candidates for a resource
// @Summary Get duplicate candidates
// @Description Retrieves duplicate candidates detected for a resource
// @Tags Resources
// @Produce json
// @Param id path int true "Resource ID"
// @Success 200 {array} domain.DuplicateCandidate
// @Failure 400 {object} errors.HTTPError
// @Failure 500 {object} errors.HTTPError
// @Router /resources/{id}/duplicates [get]
func (h *Handler) GetResourceDuplicates(c *gin.Context) {
	idParam := c.Param("id")
	var resourceID int32
	if _, err := fmt.Sscanf(idParam, "%d", &resourceID); err != nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"invalid_id",
			"Resource ID must be a valid number",
		))
		return
	}

	reqCtx := auth.GetRequestContext(c)
	if reqCtx == nil {
		c.JSON(http.StatusBadRequest, errors.NewHTTPError(
			http.StatusBadRequest,
			"missing_context",
			"Organization context is required",
		))
		return
	}

	duplicates, err := h.service.GetResourceDuplicates(c.Request.Context(), resourceID, reqCtx.OrganizationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.NewHTTPError(
			http.StatusInternalServerError,
			"fetch_failed",
			"Failed to fetch duplicates: "+err.Error(),
		))
		return
	}

	c.JSON(http.StatusOK, duplicates)
}
