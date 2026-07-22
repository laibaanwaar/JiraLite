JiraLite — Precise Project Workflow and Logic

1. Project Overview

JiraLite is a multi-user project management application inspired by Jira.Users create accounts, create or join projects, manage tasks, and track progress.Recommended stack: React, Vite, Tailwind CSS, Django REST Framework, and PostgreSQL/MySQL.

Core Role Logic

Roles are project-specific, not global.Project A + Ali  = ADMIN | Project A + Sara = MEMBER | Project B + Sara = ADMIN | Project B + Ali  = MEMBERDo not store a permanent global role such as Ali = ADMIN.Store the role inside the ProjectMember relationship.

Every person creates an independent user account.

A user becomes Admin only for a project they create.

Project Admins invite users who already have registered accounts.

Invited users can accept or decline invitations.

Accepted users become project members.

Admins create and assign tasks.

Members update the status of their own assigned tasks.

Dashboards show personal and project progress.

2. Core Role Logic

Roles are project-specific, not global.Project A + Ali  = ADMIN | Project A + Sara = MEMBER | Project B + Sara = ADMIN | Project B + Ali  = MEMBERDo not store a permanent global role such as Ali = ADMIN.Store the role inside the ProjectMember relationship.

3. Main Actors

3.1 Registered User

Sign up, log in, and log out.

Create projects.

View projects they created or joined.

View, accept, or decline invitations.

View assigned tasks.

Update the status of their own tasks.

View personal progress.

3.2 Project Admin

Edit or archive their project.

Invite registered users.

Cancel pending invitations.

View and remove project members.

Create, assign, edit, and delete tasks.

View all project tasks.

View project and member progress.

3.3 Project Member

View joined projects and project members.

View assigned tasks.

Update the status of their own tasks.

View personal progress.

Cannot invite users, remove members, assign tasks, or edit project settings.

4. Complete End-to-End Flow

Signup | ↓ | Login | ↓ | Personal Dashboard↓ | Create Project | ↓ | Creator automatically becomes Project Admin | ↓Admin invites an existing registered user | ↓ | Invitation status = PENDING | ↓ | Invited user chooses Accept or Decline↓ | Accepted user becomes Project Member | ↓ | Admin creates and assigns a task | ↓Member views My Tasks | ↓ | TODO → IN_PROGRESS → DONE | ↓ | Personal and project dashboards update

5. Signup and Login

5.1 Signup

Required fields: first name, last name, email, password, and confirm password.

Email must be valid and unique.

Password and confirmation must match.

Password must be securely hashed.

Signup creates a normal User, not an Admin.POST /api/auth/signup/

5.2 Login

Find user by email.

Verify password.

Check that the account is active.

Return an authentication token/session.

Redirect the user to the dashboard.POST /api/auth/login/ | POST /api/auth/logout/ | GET  /api/auth/me/

6. Personal Dashboard

Total joined projects.

Total assigned tasks.

To Do tasks.

In Progress tasks.

Completed tasks.

Personal progress percentage.

Recent tasks and invitations.GET /api/dashboard/me/{ | "total_projects": 3, | "total_tasks": 10, | "todo_tasks": 3, | "in_progress_tasks": 2, | "completed_tasks": 5, | "progress_percentage": 50 | }The dashboard must only show data accessible to the authenticated user.

7. Project Creation Logic

A logged-in user creates a project using name, key, description, dates, and status.Validate authenticated user | ↓ | Validate project data | ↓ | Create Project↓ | Create ProjectMember | ↓ | user = project creator | role = ADMIN↓ | Return project detailsProject creation and Admin membership should run in one database transaction.POST   /api/projects/ | GET    /api/projects/ | GET    /api/projects/{project_id}/ | PATCH  /api/projects/{project_id}/ | DELETE /api/projects/{project_id}/The project list returns only projects where the user is creator or ProjectMember.

8. Invitation Workflow

8.1 Send Invitation

Only a Project Admin can send an invitation.POST /api/projects/{project_id}/invitations/{ | "email": "sara@example.com" | }Before creating the invitation, the backend checks:

The project exists and is active.

The logged-in user is Admin of that project.

The invited email belongs to a registered user.

The Admin is not inviting themselves.

The user is not already a project member.

No active pending invitation already exists.If valid, create a secure token and set status to PENDING.PENDING | ACCEPTED | DECLINED | CANCELLED | EXPIRED

8.2 Invitation Email

Ali Khan invited you to join JiraLite Development. | [Accept Invitation] | [Decline Invitation]If the invited user is not logged in, redirect to Login and return to the invitation afterward.

8.3 View Invitations

GET /api/invitations/

Show only invitations belonging to the logged-in user.

Display Pending, Accepted, and Declined tabs.

Show project, inviter, date, status, and available actions.

8.4 Accept Invitation

POST /api/invitations/{token}/accept/Validate authentication and token | ↓ | Confirm invitation belongs to logged-in user | ↓ | Confirm status = PENDING and not expired↓ | Confirm project exists | ↓ | Confirm membership does not already exist | ↓Create ProjectMember with role MEMBER | ↓ | Set invitation status = ACCEPTED | ↓ | Save responded_at and return successAccept must be idempotent: repeated clicks cannot create duplicate membership.

8.5 Decline or Cancel Invitation

POST   /api/invitations/{token}/decline/ | DELETE /api/invitations/{invitation_id}/

Decline changes status to DECLINED and creates no membership.

Admin cancellation changes status to CANCELLED.

Keep the invitation record for history instead of permanently deleting it.

9. Project Membership

Accepting an invitation creates a ProjectMember record.project = JiraLite Development | user = Sara | role = MEMBERRequired database constraint:UNIQUE(project_id, user_id)GET    /api/projects/{project_id}/members/ | DELETE /api/projects/{project_id}/members/{user_id}/Only the Project Admin can remove a member.

10. Task Workflow

10.1 Create and Assign Task

Only a Project Admin creates and assigns tasks.POST /api/projects/{project_id}/tasks/Task fields: title, description, project, assignee, creator, priority, status, due date, and timestamps.Statuses: TODO, IN_PROGRESS, DONE | Priorities: LOW, MEDIUM, HIGHThe assignee must have a ProjectMember record for the same project.

10.2 View Tasks

GET /api/projects/{project_id}/tasks/ | GET /api/my-tasks/ | GET /api/tasks/{task_id}/

Admin can view all project tasks.

My Tasks returns tasks assigned to the logged-in user.

Members should not receive unauthorized task data.

10.3 Update Task Status

PATCH /api/tasks/{task_id}/status/{ | "status": "DONE" | }Is logged-in user the task assignee? → ├── Yes → Allow status update → └── No → Is logged-in user Project Admin? → ├── Yes → Allow → └── No → 403 Permission DeniedWhen status becomes DONE, set completed_at and recalculate dashboard values.

10.4 Task APIs

POST   /api/projects/{project_id}/tasks/ | GET    /api/projects/{project_id}/tasks/ | GET    /api/tasks/{task_id}/ | PATCH  /api/tasks/{task_id}/ | DELETE /api/tasks/{task_id}/ | PATCH  /api/tasks/{task_id}/status/ | GET    /api/my-tasks/

11. Dashboard and Progress Logic

11.1 Project Dashboard

GET /api/projects/{project_id}/dashboard/

Total members.

Total tasks.

To Do, In Progress, and Completed counts.

Overall project progress.

Progress of each member.

Upcoming deadlines.Progress Percentage = Completed Tasks / Total Tasks × 100Calculate progress from current task records instead of storing a separate percentage.

12. Main Frontend Screens

Signup

Login

Dashboard

Projects

Project Details

Invitations

Project Members

My Tasks

Project Dashboard

ProfileUse modals for Create Project, Invite Member, and Create Task in the one-day MVP.

13. Main Use Cases

UC-01 Register User

Actor: VisitorFlow: Enter valid details; system creates a normal User account.Result: User account exists.

UC-02 Login

Actor: Registered UserFlow: Enter email/password; system verifies credentials and returns authentication.Result: User reaches Dashboard.

UC-03 Create Project

Actor: Registered UserFlow: Create Project and automatic ProjectMember with ADMIN role.Result: Creator owns the project.

UC-04 Invite User

Actor: Project AdminFlow: Enter registered email; validate and create PENDING invitation.Result: Invitation is available to invited user.

UC-05 View Invitations

Actor: Registered UserFlow: Load invitations where invited_user is logged-in user.Result: User sees invitation history.

UC-06 Accept Invitation

Actor: Invited UserFlow: Validate invitation; create MEMBER record; mark ACCEPTED.Result: User joins project.

UC-07 Decline Invitation

Actor: Invited UserFlow: Validate invitation and mark DECLINED.Result: User does not join project.

UC-08 View Members

Actor: Admin or MemberFlow: Load ProjectMember records for the project.Result: Project team is displayed.

UC-09 Remove Member

Actor: Project AdminFlow: Select and confirm member removal.Result: Membership is removed or deactivated.

UC-10 Create Task

Actor: Project AdminFlow: Enter task details and choose a valid project member.Result: Task is created.

UC-11 View My Tasks

Actor: Project MemberFlow: Load tasks assigned to logged-in user.Result: Assigned tasks are displayed.

UC-12 Update Status

Actor: Assignee or AdminFlow: Change TODO, IN_PROGRESS, or DONE after permission check.Result: Task and progress update.

UC-13 View Personal Dashboard

Actor: Registered UserFlow: Calculate user projects, tasks, statuses, and progress.Result: Personal overview is displayed.

UC-14 View Project Dashboard

Actor: Project AdminFlow: Calculate members, task totals, and member progress.Result: Project overview is displayed.

14. Core Relational Entities

User | Project | ProjectMember | ProjectInvitation | TaskOptional future entities: UserProfile, TaskComment, TaskActivity, and Notification.

15. Entity Fields

15.1 User

id PK | first_name | last_name | email UNIQUE | password | is_active | created_at | updated_at

15.2 Project

id PK | name | project_key | description | created_by FK → User.idstart_date | end_date | status | created_at | updated_at

15.3 ProjectMember

id PK → project_id FK → Project.id → user_id FK → User.id → role: ADMIN or MEMBER → status → joined_at → UNIQUE(project_id, user_id)

15.4 ProjectInvitation

id PK | project_id FK → Project.id | invited_user_id FK → User.id | invited_by_id FK → User.id | token UNIQUEstatus | expires_at | created_at | responded_at

15.5 Task

id PK | project_id FK → Project.id | assigned_to_id FK → User.id | created_by_id FK → User.id | titledescription | priority | status | due_date | created_atupdated_at | completed_at

16. Entity Relationships

User to Project Creation

Type: 1Meaning: One user creates many projects; each project has one creator.Key: Project.created_by

User to Project Membership

Type: MMeaning: Users join many projects and projects contain many users.Key: Resolved through ProjectMember

User to ProjectMember

Type: 1Meaning: One user has many membership records.Key: ProjectMember.user_id

Project to ProjectMember

Type: 1Meaning: One project has many membership records.Key: ProjectMember.project_id

Project to ProjectInvitation

Type: 1Meaning: One project can have many invitations.Key: ProjectInvitation.project_id

User to Received Invitations

Type: 1Meaning: One user can receive many invitations.Key: ProjectInvitation.invited_user_id

User to Sent Invitations

Type: 1Meaning: One Admin can send many invitations.Key: ProjectInvitation.invited_by_id

Project to Task

Type: 1Meaning: One project contains many tasks.Key: Task.project_id

User to Assigned Task

Type: 1Meaning: One user can be assigned many tasks; one task has one assignee.Key: Task.assigned_to_id

User to Created Task

Type: 1Meaning: One Admin can create many tasks.Key: Task.created_by_id

User to UserProfile

Type: 1:1 OptionalMeaning: Use only when profile details are stored separately.Key: UserProfile.user_id UNIQUE

17. Relationship Summary

User 1:M Project | User M:N Project through ProjectMember | User 1:M ProjectMember | Project 1:M ProjectMember | Project 1:M ProjectInvitationUser 1:M Received Invitations | User 1:M Sent Invitations | Project 1:M Task | User 1:M Assigned Tasks | User 1:M Created TasksUser 1:1 UserProfile (optional)The core flow has no mandatory 1:1 relationship. Do not create one unnecessarily.

18. Simplified ER Diagram

USER | ├── creates many PROJECTS | ├── has many PROJECT_MEMBERSHIPS | ├── receives many INVITATIONS | ├── sends many INVITATIONS├── creates many TASKS | └── is assigned many TASKS | PROJECT | ├── has many PROJECT_MEMBERS | ├── has many PROJECT_INVITATIONS└── has many TASKS | PROJECT_MEMBER | ├── belongs to one USER | ├── belongs to one PROJECT | └── stores ADMIN or MEMBER rolePROJECT_INVITATION | ├── belongs to one PROJECT | ├── has one invited USER | └── has one inviting USER | TASK├── belongs to one PROJECT | ├── has one assigned USER | └── has one creator USER

19. Permission Matrix

Feature

Project Admin

Project Member

View Project

Yes

Yes

Edit Project

Yes

No

Invite User

Yes

No

Remove Member

Yes

No

Create Task

Yes

No

Assign Task

Yes

No

Edit Task

Yes

No

Delete Task

Yes

No

View Own Tasks

Yes

Yes

Update Own Task Status

Yes

Yes

Update Another User Task

Yes

No

View Full Project Dashboard

Yes

Limited

20. Critical Backend Validations

20.1 Authentication

Unique email.

Secure password hash.

Valid credentials.

Authentication required for protected APIs.

20.2 Project

Creator becomes Admin automatically.

Only Admin edits or deletes project.

Prevent duplicate membership.

Use a transaction when creating Project and Admin membership.

20.3 Invitation

Only Admin can invite.

Invited user must exist.

Cannot invite self or existing member.

Prevent duplicate PENDING invitation.

Only invited user can respond.

Expired or already-responded invitation cannot be reused.

Accept must not create duplicate membership.

20.4 Task

Only Admin creates or assigns tasks.

Assignee must belong to the project.

Member updates only their own task status.

Status and priority must use allowed values.

21. Demo Scenario

1. Ali, Sara, and Ahmed create accounts. | 2. Ali logs in. | 3. Ali creates JiraLite Development. | 4. Ali automatically becomes Project Admin. | 5. Ali invites Sara.6. Invitation status becomes PENDING. | 7. Sara logs in and opens Invitations. | 8. Sara accepts the invitation. | 9. Sara becomes Project Member. | 10. Project appears in Sara’s My Projects.11. Ali creates Build Login UI. | 12. Ali assigns the task to Sara. | 13. Sara views the task in My Tasks. | 14. Sara changes TODO to IN_PROGRESS. | 15. Sara changes IN_PROGRESS to DONE.16. Personal and project progress update. | 17. Ali sees Sara’s updated performance.

22. One-Day MVP Scope

Complete these features first:

Signup and login.

Project creation.

Automatic Project Admin membership.

Invite an existing registered user.

Accept or decline invitation.

Project member list.

Create and assign tasks.

My Tasks page.

Task status update.

Basic dashboard counts and progress.Skip until the core flow works:

Google login.

Real-time notifications.

Complex charts.

File uploads.

Advanced search and filters.

Drag-and-drop Kanban.

Multiple task assignees.

Advanced audit logs.

23. Implementation Order

1. Authentication | 2. Project model and APIs | 3. ProjectMember and automatic Admin role | 4. Invitation model and APIs | 5. Accept and Decline logic6. Project member list | 7. Task model and APIs | 8. Task assignment | 9. My Tasks | 10. Task status update11. Dashboard calculations | 12. Frontend integration | 13. Validation and end-to-end testing

24. Final Success Criteria

User A signs up | ↓ | User B signs up | ↓ | User A creates a project and becomes Admin↓ | User A invites User B | ↓ | User B accepts and becomes Member | ↓User A creates and assigns a task | ↓ | User B views and completes the task | ↓ | Personal and project dashboards update↓ | Admin sees complete team progressWhen this workflow works without manual database changes, the JiraLite MVP is complete