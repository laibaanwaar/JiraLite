
# 1. Project Summary

Jira Lite is a Jira-inspired Task Management System developed as a React frontend and Django REST Framework backend architecture with PostgreSQL as the primary database and JWT Authentication for secure authentication.

The application enables organizations to:

- Manage Projects
- Manage Tasks
- Assign Engineers
- Track Project Progress
- Maintain Activity Logs
- Support Team Collaboration
- Enforce Role-Based Access Control (RBAC)

The primary objective is to build a clean, scalable, secure, modular, and production-ready application.

---

# 2. Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Axios

## Backend

- Django
- Django REST Framework

## Authentication

- JWT Authentication

## Database

- PostgreSQL

## Version Control

- Git

---

# 3. Backend Folder Structure

```
Backend/
│
├── config/          # Django configuration
├── controllers/     # API request handling
├── Models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── validators/      # Custom validation
```

## Folder Responsibilities

| Folder | Responsibility |
|----------|---------------|
| config | Django project configuration and settings |
| controllers | Handle HTTP requests and responses only |
| Models | Database models and relationships |
| routes | Register API endpoints only |
| services | Business logic and reusable operations |
| validators | Custom validation rules |



# 5. User Roles (RBAC)

## Admin

Permissions

- Manage Users
- Manage Roles
- Create Projects
- Update Projects
- Delete Projects
- View Dashboard
- View Activity Logs
- Full System Access

---

## Task Manager

Permissions

- Create Tasks
- Update Tasks
- Delete Tasks
- Assign Engineers
- Manage Project Members
- Update Task Priority
- Update Task Status

---

## Engineer

Permissions

- View Assigned Tasks
- Update Assigned Task Status
- Add Comments
- View Project Details

---

# 6. Coding Practices

Always follow these coding standards.

## General Rules

- Follow the clean and readable code.
- Use meaningful variable names.
- Use meaningful function names.
- Keep functions small.
- Keep classes focused.
- Avoid duplicate code.
- Use reusable components.
- Use type hints whenever possible.
- Add docstrings for public functions.
- Comment only complex business logic.
- Never hardcode values.
- Use constants instead.

## Controllers

Controllers should

- Handle requests
- Handle responses
- Validate request input
- Call services

Controllers should NOT contain business logic.

## Services

Services should

- Contain all business logic
- Reuse existing logic
- Handle transactions
- Coordinate models

## Routes

Routes should

- Register endpoints only
- Never contain business logic

## Models

Models should

- Define database schema
- Define relationships
- Define constraints

---

# 7. Security Practices

Security is mandatory.

## Authentication

- Use JWT Authentication.
- Use Access Tokens.
- Use Refresh Tokens.
- Protect all private APIs.

## Authorization

- Enforce Role-Based Access Control (RBAC).
- Restrict APIs according to user roles.
- Use object-level permissions whenever required.

## Password Security

- Hash passwords.
- Never store plain-text passwords.
- Never expose password hashes.

## API Security

- Validate every request.
- Validate all user input.
- Return secure error messages.
- Never expose internal exceptions.
- Prevent SQL Injection using Django ORM.
- Sanitize all input.

## Environment

- Store secrets inside environment variables.
- Never commit secrets.
- Never hardcode credentials.

## Database

- Use transactions when required.
- Validate foreign keys.
- Maintain referential integrity.

## Logging

- Log important actions.
- Never log passwords.
- Never log tokens.

---

# 8. Development Guidelines

Before generating any code, always:

- Read the related files first.
- Understand the current implementation.
- Follow the existing architecture.
- Reuse existing services.
- Reuse existing validators.
- Keep the project modular.
- Keep code production-ready.
- Do not rename folders.
- Do not modify database relationships unless requested.
- Explain generated code after implementation.

---

# 9. API Standards

Always follow REST API standards.

- Use RESTful endpoints.
- Return JSON responses.
- Use proper HTTP status codes.
- Validate all input.
- Keep response format consistent.
- Support pagination where required.
- Support filtering.
- Support searching.
- Support ordering.

Example

```
GET     /api/projects/
POST    /api/projects/
GET     /api/tasks/
POST    /api/tasks/
PATCH   /api/tasks/{id}/
DELETE  /api/tasks/{id}/
```

---

# 10. Validation Rules

Always validate:

- Unique Email
- Password Length
- Required Fields
- Due Date
- Start Date
- End Date
- Role
- Priority
- Status
- Project Membership

Never trust client-side validation.

---

# 11. Testing Guidelines

Before writing or modifying tests:

- Visit the project's **tests** directory.
- Read the existing testing files.
- Follow the current testing structure.
- Reuse fixtures and helper utilities.
- Match existing naming conventions.

Every new feature should include:

- Unit Tests
- API Tests
- Validation Tests
- Permission Tests
- Authentication Tests
- Integration Tests (if required)

No feature is considered complete without updating the related tests.

---

# 12. Final AI Instructions

Before generating code, always verify the following:

- Read the relevant files before making changes.
- Follow the existing project architecture.
- Keep controllers lightweight.
- Place all business logic inside services.
- Never place business logic inside routes.
- Reuse existing code whenever possible.
- Follow security best practices.
- Visit the testing directory before writing tests.
- Keep generated code modular and production-ready.
- Update documentation if implementation changes.
- Do not introduce unnecessary dependencies.
- Do not modify the folder structure unless explicitly requested.

