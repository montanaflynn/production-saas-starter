# API & Authentication
 
 ## Framework
 
 We use **Gin** for the HTTP layer. It is fast, familiar, and middleware-friendly.
 
 ## Authentication Middleware
 
 All protected routes use the `auth.Middleware`.
 
 ### How it Works
 
 1. **Extracts Token**: Checks `Authorization: Bearer <token>` header or cookies.
 2. **Verifies Token**: Calls Stytch API (cached via JWKS) to validate the JWT.
 3. **Injects Context**: Adds `OrganizationID` and `MemberID` to the Gin context.
 
 ### Usage in Code
 
 In your `api/handler.go`:
 
 ```go
 func (h *Handler) CreateProject(c *gin.Context) {
     // 1. Get User Context
     ctx := auth.GetRequestContext(c)
     
     // ctx.OrganizationID is now available and verified
     
     // 2. Bind JSON
     var req CreateProjectReq
     if err := c.ShouldBindJSON(&req); err != nil {
         c.JSON(400, gin.H{"error": err.Error()})
         return
     }
     
     // 3. Call Service
     err := h.service.Create(c.Request.Context(), ctx.OrganizationID, req)
 }
 ```
 
 ## Request Validation
 
 We use **native Gin binding** with struct tags.
 
 ```go
 type CreateProjectReq struct {
     Name        string `json:"name" binding:"required"`
     Description string `json:"description"`
 }
 ```
 
 If validation fails, `ShouldBindJSON` returns an error automatically.
