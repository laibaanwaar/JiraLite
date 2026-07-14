# JiraLite Frontend

This frontend runs with project-local Node dependencies and caches stored inside `D:\JiraLite`.

## Recommended commands

Use the repo wrapper scripts from the project root so npm cache and temp files stay on `D:`:

- `scripts\frontend.cmd install`
- `scripts\frontend.cmd run dev`
- `scripts\frontend.cmd run build`
- `scripts\frontend.cmd run lint`

## Local storage paths

- npm package cache: `..\.cache\npm`
- Vite cache: `..\.cache\vite`
- build output: `dist`
- installed packages: `node_modules`
