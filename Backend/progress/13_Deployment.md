# 13. Deployment

## Deployment Goal

Deploy the Django backend securely and make it available to the React frontend and production database.

## Local Development

### Requirements

- Python installed
- Virtual environment created
- Django dependencies installed
- PostgreSQL available for production testing

### Typical Steps

1. Create and activate a virtual environment.
2. Install dependencies.
3. Configure environment variables.
4. Run migrations.
5. Start the development server.

## Production Deployment Plan

### Backend

- Use a WSGI-compatible host or container platform.
- Set `DEBUG=False`.
- Define `ALLOWED_HOSTS`.
- Store secret values in environment variables.
- Configure static file handling.

### Database

- Use PostgreSQL in production.
- Run migrations before first launch.
- Back up data regularly.

### Frontend

- Build the React app for production.
- Point the frontend to the backend API base URL.
- Configure CORS to allow the frontend origin.

## Security Checklist

- HTTPS enabled
- Secret key not committed to source control
- Database credentials stored securely
- JWT settings reviewed
- CORS restricted to trusted domains

## Suggested Hosting Options

- Render
- Railway
- Railway-like container platform
- DigitalOcean VPS
- AWS deployment using managed services

## Post-Deployment Checks

- Authentication flow works
- Database migrations applied
- Admin login works
- API health endpoint responds
- Frontend can communicate with the backend
