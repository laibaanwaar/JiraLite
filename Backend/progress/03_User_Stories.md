# 03. User Stories

## Format

Each user story includes a story ID, title, description, actor, acceptance criteria, priority, and dependencies.

## User Stories

### US-01
- Title: User login
- Description: As a user, I want to log in with my email and password so that I can access the system securely.
- Actor: Admin, Task Manager, Engineer
- Acceptance Criteria: Valid credentials return access and refresh tokens; invalid credentials are rejected.
- Priority: High
- Dependencies: User account exists

### US-02
- Title: User logout
- Description: As a logged-in user, I want to log out so that my session can be terminated safely.
- Actor: Admin, Task Manager, Engineer
- Acceptance Criteria: Refresh token is invalidated and the user can no longer renew the session.
- Priority: High
- Dependencies: US-01

### US-03
- Title: View dashboard
- Description: As a user, I want to see a dashboard relevant to my role so that I can quickly understand my work.
- Actor: Admin, Task Manager, Engineer
- Acceptance Criteria: Dashboard data changes according to role permissions.
- Priority: High
- Dependencies: US-01

### US-04
- Title: Manage roles
- Description: As an admin, I want to create and maintain roles so that users can be classified correctly.
- Actor: Admin
- Acceptance Criteria: Roles can be listed, created, updated, and validated.
- Priority: High
- Dependencies: Authentication, role model

### US-05
- Title: Create user
- Description: As an admin, I want to create users so that the organization can onboard new staff.
- Actor: Admin
- Acceptance Criteria: A user is created with a unique email, active status, and assigned role.
- Priority: High
- Dependencies: US-04

### US-06
- Title: Update user
- Description: As an admin, I want to update user details so that records stay accurate.
- Actor: Admin
- Acceptance Criteria: Names, email, role, and active status can be updated.
- Priority: High
- Dependencies: US-05

### US-07
- Title: Deactivate user
- Description: As an admin, I want to deactivate a user so that access can be revoked without deleting data.
- Actor: Admin
- Acceptance Criteria: Deactivated users cannot log in or access protected endpoints.
- Priority: High
- Dependencies: US-05

### US-08
- Title: Create project
- Description: As an admin, I want to create projects so that work can be organized into delivery units.
- Actor: Admin
- Acceptance Criteria: Project name, owner, and dates are validated and stored.
- Priority: High
- Dependencies: US-05

### US-09
- Title: Update project
- Description: As an admin, I want to edit project details so that the project remains current.
- Actor: Admin
- Acceptance Criteria: Project metadata can be updated without breaking relationships.
- Priority: High
- Dependencies: US-08

### US-10
- Title: Delete project
- Description: As an admin, I want to delete a project so that obsolete work can be removed.
- Actor: Admin
- Acceptance Criteria: Project deletion is controlled and logged.
- Priority: Medium
- Dependencies: US-08

### US-11
- Title: Assign project owner
- Description: As an admin, I want to assign a project owner so that every project has a responsible lead.
- Actor: Admin
- Acceptance Criteria: A valid active user is linked as project owner.
- Priority: High
- Dependencies: US-08

### US-12
- Title: View project list
- Description: As a task manager, I want to view assigned projects so that I can plan tasks effectively.
- Actor: Task Manager
- Acceptance Criteria: Only accessible projects are shown.
- Priority: High
- Dependencies: US-01

### US-13
- Title: Add engineer to project
- Description: As a task manager, I want to add engineers to a project so that they can participate in delivery.
- Actor: Task Manager
- Acceptance Criteria: Engineers become project members.
- Priority: High
- Dependencies: US-08

### US-14
- Title: Remove engineer from project
- Description: As a task manager, I want to remove engineers from a project so that team membership stays accurate.
- Actor: Task Manager
- Acceptance Criteria: Removed members are no longer eligible for project tasks.
- Priority: High
- Dependencies: US-13

### US-15
- Title: Create task
- Description: As a task manager, I want to create tasks so that project work can be broken down into deliverables.
- Actor: Task Manager
- Acceptance Criteria: Task title, due date, priority, and project are validated.
- Priority: High
- Dependencies: US-12

### US-16
- Title: Update task
- Description: As a task manager, I want to update tasks so that scope and details can evolve during the project.
- Actor: Task Manager
- Acceptance Criteria: Task fields can be edited with permission checks.
- Priority: High
- Dependencies: US-15

### US-17
- Title: Delete task
- Description: As a task manager, I want to delete tasks so that cancelled work can be removed.
- Actor: Task Manager
- Acceptance Criteria: Deleted tasks are removed or archived according to policy.
- Priority: Medium
- Dependencies: US-15

### US-18
- Title: Assign engineers to task
- Description: As a task manager, I want to assign engineers to tasks so that work ownership is clear.
- Actor: Task Manager
- Acceptance Criteria: Only project members can be assigned.
- Priority: High
- Dependencies: US-13, US-15

### US-19
- Title: Change task priority
- Description: As a task manager, I want to adjust priority so that urgent work is handled first.
- Actor: Task Manager
- Acceptance Criteria: Priority must be one of Low, Medium, High, or Critical.
- Priority: Medium
- Dependencies: US-15

### US-20
- Title: Change task status
- Description: As an engineer, I want to update the status of tasks assigned to me so that progress is visible.
- Actor: Engineer
- Acceptance Criteria: Only assigned engineers can update status.
- Priority: High
- Dependencies: US-18

### US-21
- Title: View assigned tasks
- Description: As an engineer, I want to see my assigned tasks so that I can focus on my workload.
- Actor: Engineer
- Acceptance Criteria: Only tasks assigned to the engineer are displayed.
- Priority: High
- Dependencies: US-01

### US-22
- Title: View task details
- Description: As an engineer, I want to view task details so that I understand the requirements and deadlines.
- Actor: Engineer
- Acceptance Criteria: Task details are readable if access is permitted.
- Priority: High
- Dependencies: US-21

### US-23
- Title: Add comment
- Description: As an engineer, I want to comment on tasks so that collaboration is easier.
- Actor: Engineer
- Acceptance Criteria: Comments cannot be empty and are saved with timestamps.
- Priority: Medium
- Dependencies: US-22

### US-24
- Title: Edit own comment
- Description: As an engineer, I want to edit my own comments so that I can correct mistakes.
- Actor: Engineer
- Acceptance Criteria: Users can only edit comments they authored.
- Priority: Medium
- Dependencies: US-23

### US-25
- Title: View project information
- Description: As an engineer, I want to see project information so that I understand the context of my tasks.
- Actor: Engineer
- Acceptance Criteria: Project summary and membership are visible within access limits.
- Priority: Medium
- Dependencies: US-13

### US-26
- Title: View activity logs
- Description: As an admin, I want to review activity logs so that I can audit important actions.
- Actor: Admin
- Acceptance Criteria: Logs record action, actor, related project, and related task.
- Priority: Medium
- Dependencies: Activity log module

### US-27
- Title: View task history
- Description: As a manager or admin, I want to view task history so that every status change is traceable.
- Actor: Admin, Task Manager
- Acceptance Criteria: History shows old status, new status, and the user who made the change.
- Priority: High
- Dependencies: US-20

### US-28
- Title: Audit user actions
- Description: As the system, I want to store activity logs for important actions so that accountability is preserved.
- Actor: System
- Acceptance Criteria: Key create, update, delete, and status actions generate logs automatically.
- Priority: High
- Dependencies: Logging service

### US-29
- Title: Enforce single role per user
- Description: As the system, I want each user to have exactly one role so that permissions remain simple and predictable.
- Actor: System
- Acceptance Criteria: A user cannot be saved with multiple roles.
- Priority: High
- Dependencies: Role model

### US-30
- Title: Validate due date
- Description: As the system, I want to reject past due dates so that tasks always have realistic deadlines.
- Actor: System
- Acceptance Criteria: Due date must be today or later.
- Priority: High
- Dependencies: US-15

### US-31
- Title: Validate project dates
- Description: As the system, I want to ensure project end date is after start date so that timelines are consistent.
- Actor: System
- Acceptance Criteria: End date cannot be earlier than start date.
- Priority: High
- Dependencies: US-08

### US-32
- Title: Manage project status
- Description: As an admin, I want to set project status so that projects can be planned, active, or closed.
- Actor: Admin
- Acceptance Criteria: Status comes from the Project_Status table.
- Priority: Medium
- Dependencies: Project status model

### US-33
- Title: Manage task status catalog
- Description: As an admin, I want to control task statuses so that workflow states stay standard.
- Actor: Admin
- Acceptance Criteria: Task statuses are centrally maintained.
- Priority: Medium
- Dependencies: Task status model

### US-34
- Title: Manage priority catalog
- Description: As an admin, I want to control priority values so that task urgency is standardized.
- Actor: Admin
- Acceptance Criteria: Priority choices are available and validated.
- Priority: Medium
- Dependencies: Priority model

### US-35
- Title: View authenticated profile
- Description: As a logged-in user, I want to view my profile so that I can confirm my account information.
- Actor: Admin, Task Manager, Engineer
- Acceptance Criteria: Current user data is returned securely.
- Priority: Medium
- Dependencies: US-01

### US-36
- Title: Receive permission-based access
- Description: As the system, I want permissions to depend on role so that sensitive endpoints stay protected.
- Actor: System
- Acceptance Criteria: Unauthorized actions return appropriate access errors.
- Priority: High
- Dependencies: RBAC middleware or permission classes
