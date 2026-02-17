# Deployment Guide for Teaching Platform

This guide provides instructions for deploying the teaching platform with MongoDB Atlas.

## Prerequisites

- Node.js v14 or higher
- MongoDB Atlas account
- A hosting platform (Heroku, AWS, DigitalOcean, etc.)

## MongoDB Atlas Setup

Follow the steps in [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) to configure your MongoDB Atlas database.

## Environment Configuration

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=production
```

### Frontend (.env)
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=https://your-backend-url.com
```

## Deployment Steps

### Option 1: Deploy to Heroku

1. Install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Add environment variables:
   ```bash
   heroku config:set MONGODB_URI=<your-mongodb-atlas-uri>
   heroku config:set JWT_SECRET=<your-jwt-secret>
   heroku config:set GEMINI_API_KEY=<your-gemini-api-key>
   heroku config:set GOOGLE_CLIENT_ID=<your-google-client-id>
   heroku config:set GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   heroku config:set NODE_ENV=production
   ```

4. Deploy:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push heroku main
   ```

### Option 2: Deploy with Docker

1. Create a Dockerfile in the root directory:
   ```dockerfile
   # Multi-stage build
   FROM node:16-alpine AS frontend-build
   WORKDIR /app
   COPY frontend/package*.json ./frontend/
   RUN cd frontend && npm ci && npm run build
   
   FROM node:16-alpine AS backend
   WORKDIR /app
   COPY backend/package*.json ./backend/
   RUN cd backend && npm ci --only=production
   COPY backend/. .
   COPY --from=frontend-build /app/frontend/build ./../frontend/build
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. Create docker-compose.yml:
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - MONGODB_URI=${MONGODB_URI}
         - JWT_SECRET=${JWT_SECRET}
         - NODE_ENV=production
       restart: unless-stopped
   ```

### Option 3: Manual Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Move the build folder to the backend:
   ```bash
   mv build ../backend/
   ```

3. Deploy the backend to your server with all dependencies

## Database Models Verification

All your database models are properly configured for MongoDB Atlas:

- User.js - User authentication and profile data
- Syllabus.js - Syllabus and uploaded content
- Quiz.js - Quiz generation and management
- QuizResult.js - Quiz results tracking
- Timetable.js - Schedule management
- MotivationHistory.js - Motivation tracking

## Production Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **CORS**: Configure CORS properly for production domains
5. **Environment Variables**: Store sensitive data securely

## Testing Production Deployment

After deployment, test the following:

1. User registration and login
2. Syllabus upload and viewing
3. Quiz generation and taking
4. Data persistence across sessions
5. Error handling and logging

## Monitoring and Maintenance

- Set up error tracking (e.g., Sentry)
- Monitor database performance
- Regular backups (handled by MongoDB Atlas)
- Log analysis
- Performance monitoring

## Rollback Plan

In case of deployment issues:

1. Keep a backup of the previous working version
2. Document the rollback procedure
3. Test rollback in staging environment first
4. Have a maintenance window scheduled if needed