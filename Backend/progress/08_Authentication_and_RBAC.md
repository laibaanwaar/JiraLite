# 08. Authentication and RBAC

## Authentication Strategy

The system uses JWT authentication to support a React frontend and a decoupled backend. After login, the user receives:

- Access token
- Refresh token

The access token is used for protected API requests, while the refresh token is used to obtain a new access token when the original expires.

## Authentication Flow

1. User submits email and password.
2. Backend validates credentials.
3. Backend checks that the user is active.
4. Backend returns access and refresh tokens.
5. Frontend stores the tokens securely.
6. Protected endpoints validate the access token on each request.

## Role-Based Access Control

Each user belongs to exactly one role.

### Roles

- Admin
- Task Manager
- Engineer

### Permission Matrix

| Action | Admin | Task Manager | Engineer |
| --- | --- | --- | --- |
| Login | Yes | Yes | Yes |
| Logout | Yes | Yes | Yes |
| Manage users | Yes | No | No |
| Manage roles | Yes | No | No |
| Create projects | Yes | No | No |
| Update projects | Yes | No | No |
| Delete projects | Yes | No | No |
| Assign project owner | Yes | No | No |
| View assigned projects | Yes | Yes | Limited |
| Create tasks | Yes | Yes | No |
| Update tasks | Yes | Yes | No |
| Delete tasks | Yes | Yes | No |
| Assign engineers to tasks | Yes | Yes | No |
| Update task status | No | No | Yes, if assigned |
| Add comments | Yes | Yes | Yes |
| View activity logs | Yes | No | No |
| View task history | Yes | Yes | No |

## Authorization Rules

- Only authenticated users can access protected resources.
- Admin-only endpoints must reject Task Manager and Engineer requests.
- Task Manager actions are limited to projects and tasks they can access.
- Engineers can only modify tasks assigned to them.
- Comment editing is restricted to the original author.

## Token Security Considerations

- Use short-lived access tokens.
- Rotate refresh tokens where appropriate.
- Store secrets in environment variables.
- Use HTTPS in production.
- Reject inactive users even if credentials are correct.

## Implementation Notes

- Django REST Framework permission classes should enforce role checks.
- Token blacklisting can be enabled if logout invalidation is required.
- RBAC logic should be centralized to avoid permission drift across views.
