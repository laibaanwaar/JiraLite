# Task Management System Backend

A Django REST Framework backend for a Jira-inspired Task Management System with PostgreSQL, JWT authentication, and role-based access control.

This repository currently contains the backend project scaffold and the documentation needed to plan and implement the full system.

## Documentation

All project documentation is stored in [`progress/`](./progress/):

- [`01_Project_Overview.md`](./progress/01_Project_Overview.md)
- [`02_Technology_Stack.md`](./progress/02_Technology_Stack.md)
- [`03_User_Stories.md`](./progress/03_User_Stories.md)
- [`04_Product_Backlog.md`](./progress/04_Product_Backlog.md)
- [`05_Sprint_Planning.md`](./progress/05_Sprint_Planning.md)
- [`06_ERD_and_Database.md`](./progress/06_ERD_and_Database.md)
- [`07_API_Documentation.md`](./progress/07_API_Documentation.md)
- [`08_Authentication_and_RBAC.md`](./progress/08_Authentication_and_RBAC.md)
- [`09_Project_Structure.md`](./progress/09_Project_Structure.md)
- [`10_Development_Log.md`](./progress/10_Development_Log.md)
- [`11_Test_Cases.md`](./progress/11_Test_Cases.md)
- [`12_Bugs_and_Fixes.md`](./progress/12_Bugs_and_Fixes.md)
- [`13_Deployment.md`](./progress/13_Deployment.md)
- [`14_Future_Enhancements.md`](./progress/14_Future_Enhancements.md)

## Current Backend Status

- Django project scaffold created in `config/`
- Local app scaffold available in `core/`
- JWT authentication configured in `settings.py`
- CORS enabled for the React frontend
- Database currently uses SQLite for development

## Planned Core Capabilities

- Admin user management
- Task manager project and task operations
- Engineer task collaboration
- Audit logging and task history
- React frontend integration

## Tech Stack

- Backend: Django REST Framework
- Authentication: JWT
- Database: PostgreSQL in production
- Frontend: React, Tailwind CSS, Axios

## Project Goal

Deliver a secure, modular, role-aware task management platform that supports project planning, task assignment, team collaboration, and traceable activity across the organization.
