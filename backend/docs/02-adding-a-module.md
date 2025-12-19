# Adding a New Module
 
 Use the built-in generator to create a new module following Clean Architecture.
 
 ## The Fast Way
 
 ```bash
 make create-module type=app name=projects
 ```
 
 This command:
 1. Creates `src/app/projects/` folder structure.
 2. Generates boilerplate files (Service, Handler, Repository).
 3. Wires it up to the dependency injection container.
 
 ## The Manual Way (Understanding the Files)
 
 If you were to do it manually, here is what you would build:
 
 ### 1. Define the Entity (`domain/projects.go`)
 
 ```go
 package domain
 
 type Project struct {
     ID int32
     Name string
     OrganizationID int32
 }
 ```
 
 ### 2. Define the Interface (`domain/repository.go`)
 
 ```go
 type ProjectRepository interface {
     Create(ctx context.Context, p *Project) error
 }
 ```
 
 ### 3. Implement Repository (`infra/repository.go`)
 
 ```go
 type Repository struct {
     db *gorm.DB
 }
 
 func (r *Repository) Create(ctx context.Context, p *domain.Project) error {
     return r.db.Create(p).Error
 }
 ```
 
 ### 4. Wire it all up (`cmd/init.go`)
 
 This is the dependency injection step.
 
 ```go
 func InitModule(container *dig.Container) {
     container.Provide(NewRepository)
     container.Provide(NewService)
     container.Provide(NewHandler)
 }
 ```
