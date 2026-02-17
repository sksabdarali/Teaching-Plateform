# Teaching Platform

A comprehensive teaching platform with AI-powered features for educators and students.

## Features

- User authentication and authorization
- Syllabus management
- AI-powered quiz generation
- Personalized learning content
- Progress tracking and analytics
- Motivational content delivery
- Customizable timetables
- Doubt-solving assistance
- Achievement system with gamification

## Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI Integration**: Google Gemini API
- **Authentication**: JWT

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd teaching-platform
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# In the backend directory, create .env file:
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/) and create an API key
2. Enable the Generative Language API in Google Cloud Console
3. Add your API key to the `.env` file as `GEMINI_API_KEY`

**Important**: The free tier of Gemini API has usage limits. If you encounter "429 Too Many Requests" errors, you may need to enable billing for higher quotas.

## Running the Application

```bash
# Terminal 1: Start the backend
cd backend
npm start

# Terminal 2: Start the frontend
cd frontend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Syllabus Management
- `POST /api/syllabi` - Create a new syllabus
- `GET /api/syllabi` - Get user's syllabi
- `GET /api/syllabi/:id` - Get a specific syllabus
- `PUT /api/syllabi/:id` - Update a syllabus
- `DELETE /api/syllabi/:id` - Delete a syllabus

### AI Features
- `POST /api/ai/generate-quiz` - Generate a quiz using AI
- `POST /api/ai/generate-content` - Generate learning content using AI
- `POST /api/ai/generate-study-materials` - Generate study materials based on syllabus

### Topics
- `GET /api/topics/:syllabusId` - Get all topics for a syllabus
- `GET /api/topics/:syllabusId/:topicIndex` - Get a specific topic
- `POST /api/topics/mark-complete` - Mark a topic as completed
- `POST /api/topics/explanation` - Get AI explanation for a topic

### Quizzes
- `POST /api/quizzes` - Create a new quiz
- `GET /api/quizzes` - Get quizzes
- `GET /api/quizzes/:id` - Get a specific quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Progress Tracking
- `GET /api/progress` - Get user's overall progress
- `GET /api/progress/subject/:subject` - Get progress for a specific subject
- `GET /api/progress/achievements` - Get user's achievements
- `POST /api/progress/update-after-quiz` - Update progress after quiz completion
- `POST /api/progress/syllabus-topic` - Track progress for a specific syllabus topic
- `GET /api/progress/syllabus/:syllabusId` - Get progress for a specific syllabus
- `GET /api/progress/recommendations` - Get personalized recommendations based on user progress

### Timetables
- `POST /api/timetables` - Create a new timetable
- `GET /api/timetables` - Get user's timetables
- `GET /api/timetables/:id` - Get a specific timetable
- `PUT /api/timetables/:id` - Update a timetable
- `DELETE /api/timetables/:id` - Delete a timetable
- `POST /api/timetables/generate-ai` - Generate AI-based timetable

### Motivation Features
- `GET /api/motivation/daily` - Get daily motivation
- `GET /api/motivation/history` - Get motivation history
- `PUT /api/motivation/:id/read` - Mark motivation as read
- `GET /api/motivation/achievements` - Get user's achievements
- `POST /api/motivation/notification` - Send motivational notification

### Doubt Solving
- `POST /api/doubts/ask` - Ask a question and get AI explanation
- `POST /api/doubts/ask-contextual` - Ask a question with context from user's progress

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License