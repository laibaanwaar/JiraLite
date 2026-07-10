# 07. API Documentation

## API Design Principles

- RESTful resource naming
- JSON request and response payloads
- JWT protection for private endpoints
- Role-based authorization on every restricted route
- Consistent status codes and validation errors

## Base URL

`/api/`

## Module: Authentication

### `POST /api/auth/login/`
- Purpose: Authenticate a user and issue JWT tokens
- Access: Public
- Request: email, password
- Response: access token, refresh token, user profile summary

### `POST /api/auth/refresh/`
- Purpose: Renew the access token
- Access: Public with refresh token
- Response: new access token

### `POST /api/auth/logout/`
- Purpose: Invalidate refresh token
- Access: Authenticated
- Response: confirmation message

## Module: Roles

### `GET /api/roles/`
- Purpose: List roles
- Access: Admin
- Response: role details, including `users_count`

### `POST /api/roles/`
- Purpose: Create a role
- Access: Admin
- Response: created role details, including `users_count`

### `GET /api/roles/{id}/`
- Purpose: View role details
- Access: Admin
- Response: role details, including `users_count`

### `PATCH /api/roles/{id}/`
- Purpose: Update role details
- Access: Admin
- Response: updated role details, including `users_count`

## Module: Users

### `GET /api/users/`
- Purpose: List users
- Access: Admin

### `POST /api/users/`
- Purpose: Create a user
- Access: Admin
- Note: Uses the same `/api/users/` resource as the list endpoint.

### `GET /api/users/{id}/`
- Purpose: View user details
- Access: Admin

### `PATCH /api/users/{id}/`
- Purpose: Update user details
- Access: Admin

### `PATCH /api/users/{id}/deactivate/`
- Purpose: Deactivate a user
- Access: Admin

## Module: Projects

### `GET /api/projects/`
- Purpose: List projects visible to the user
- Access: Authenticated

### `POST /api/projects/`
- Purpose: Create a project
- Access: Admin

### `GET /api/projects/{id}/`
- Purpose: View project details
- Access: Project members and privileged roles

### `PATCH /api/projects/{id}/`
- Purpose: Update project details
- Access: Admin

### `DELETE /api/projects/{id}/`
- Purpose: Delete a project
- Access: Admin

### `POST /api/projects/{id}/members/`
- Purpose: Add an engineer to a project
- Access: Task Manager

### `DELETE /api/projects/{id}/members/{user_id}/`
- Purpose: Remove an engineer from a project
- Access: Task Manager

## Module: Tasks

### `GET /api/tasks/`
- Purpose: List tasks visible to the user
- Access: Authenticated

### `POST /api/tasks/`
- Purpose: Create a task
- Access: Task Manager

### `GET /api/tasks/{id}/`
- Purpose: View task details
- Access: Assigned users, project members, managers, admin

### `PATCH /api/tasks/{id}/`
- Purpose: Update task details
- Access: Task Manager

### `DELETE /api/tasks/{id}/`
- Purpose: Delete a task
- Access: Task Manager

### `POST /api/tasks/{id}/assign/`
- Purpose: Assign engineers to a task
- Access: Task Manager

### `PATCH /api/tasks/{id}/priority/`
- Purpose: Update priority
- Access: Task Manager

### `PATCH /api/tasks/{id}/status/`
- Purpose: Update status
- Access: Assigned engineer or authorized manager

## Module: Comments

### `GET /api/tasks/{id}/comments/`
- Purpose: List comments for a task
- Access: Authenticated and authorized users

### `POST /api/tasks/{id}/comments/`
- Purpose: Add a comment
- Access: Engineer, Task Manager, Admin

### `PATCH /api/comments/{id}/`
- Purpose: Edit own comment
- Access: Comment owner

### `DELETE /api/comments/{id}/`
- Purpose: Remove a comment
- Access: Comment owner or admin

## Module: Activity Logs

### `GET /api/activity-logs/`
- Purpose: View audit trail
- Access: Admin

## Module: Task History

### `GET /api/tasks/{id}/history/`
- Purpose: View task status history
- Access: Admin, Task Manager

## Module: Dashboard

### `GET /api/dashboard/`
- Purpose: Return role-specific summary data
- Access: Authenticated

## Standard Error Responses

- `400 Bad Request` for validation errors
- `401 Unauthorized` for missing or invalid tokens
- `403 Forbidden` for permission failures
- `404 Not Found` for missing resources

## Expected Response Style

```json
{
  "message": "Success",
  "data": {}
}
```

## API Notes

- Every create/update/delete action should generate an activity log entry where applicable.
- Task status changes must also create a task history record.
- Endpoints should return filtered data based on the requesting user’s role and membership.
