# JiraLite

JiraLite is a Jira-inspired task management system with a React frontend and a Django REST Framework backend.

## Project-local tooling storage

This repository is configured to keep project-controlled caches, generated files, and development tooling data on `D:\JiraLite` wherever the tools support local overrides.

### Current project-local paths

- Python virtual environment: `Backend\venv`
- npm dependencies: `Frontend\node_modules`
- frontend build output: `Frontend\dist`
- npm cache: `.cache\npm`
- Vite cache: `.cache\vite`
- pip cache: `.cache\pip`
- Python bytecode cache: `.cache\python`
- temp directories for wrapper-driven commands: `.cache\tmp`

## Recommended commands

Run commands from the project root with the wrapper scripts so Windows tooling uses the project-local cache directories on `D:`.

### Frontend

- `scripts\frontend.cmd install`
- `scripts\frontend.cmd run dev`
- `scripts\frontend.cmd run build`
- `scripts\frontend.cmd run lint`

### Backend

- `scripts\backend-manage.cmd check`
- `scripts\backend-manage.cmd runserver`
- `scripts\backend-manage.cmd test`
- `scripts\backend-python.cmd -m pip list`

### PowerShell variants

- `./scripts/frontend.ps1 run build`
- `./scripts/backend-manage.ps1 check`
- `./scripts/backend-python.ps1 -m pip cache dir`

## Notes

- VS Code integrated terminals inherit the same project-local cache and temp paths through `.vscode/settings.json`.
- Backend wrapper scripts also load `Backend\.env` so project settings win over conflicting global environment variables.
- Existing secrets in `Backend\.env` are left untouched.
- Some global tools may still use system-managed locations if they do not support per-project cache overrides, but the main React, npm, Vite, Python, pip, and Django workflows are redirected into this repository.
