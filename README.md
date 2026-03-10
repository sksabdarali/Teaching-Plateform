# 📚 EduSmart - AI-Powered Teaching Platform

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) web application that leverages **AI (Google Gemini API)** to deliver personalized learning experiences. The platform helps students manage their syllabus, generate AI-powered quizzes, track progress, get doubt resolution, and stay motivated throughout their learning journey.

> **Live Demo:** [https://teaching-plateform.onrender.com](https://teaching-plateform.onrender.com)

---

## 🚀 Key Features

### 🔐 Authentication & User Management
- **Email/Password Registration** with OTP email verification
- **Google OAuth 2.0** Sign-In for quick access
- **JWT-based** session management with protected routes
- **Admin Panel** for user management and platform oversight
- **Profile Management** – students can update grade, board, subjects, and change password

### 📖 Syllabus Management
- Upload syllabus via **PDF, DOCX, or text input**
- AI-powered **syllabus parsing** to extract topics and subtopics automatically
- Organize syllabi by subject with topic-level tracking
- Mark topics as completed to track learning progress

### 🤖 AI-Powered Quiz Generation
- Generate **multiple-choice quizzes** from any topic using Google Gemini AI
- Configurable **difficulty levels** and number of questions
- **Interactive quiz interface** with real-time feedback
- **Detailed explanations** for each answer after submission
- Quiz history and **performance analytics**

### 📊 Progress Tracking & Analytics
- **Dashboard** with visual charts (built with Recharts) showing overall performance
- Subject-wise **progress breakdown**
- **Achievement system** with gamification (badges, streaks)
- Personalized **study recommendations** based on performance data

### 📅 AI-Generated Timetable
- Generate **customized study schedules** using AI
- Specify number of days and subjects
- **CRUD operations** on timetables (create, view, edit, delete)

### 💡 Doubt Solving & AI Mentor
- **Ask any academic question** and receive AI-powered explanations
- **Contextual doubt solving** that considers the student's current progress
- **AI Mentor** feature for guided learning and concept clarification

### 📧 Email Notifications
- **OTP verification** emails for new user registration
- **Welcome emails** for new users
- **Daily motivational quotes** sent to all users via automated cron jobs

### 🎯 Motivation System
- **Daily motivational quotes** and study tips
- **Motivation history** tracking
- **Achievement notifications** to keep students engaged

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **AI Integration** | Google Gemini API |
| **Authentication** | JWT, Google OAuth 2.0, bcrypt.js |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **File Parsing** | Multer, pdf-parse, Mammoth (DOCX) |
| **Charts** | Recharts |
| **Task Scheduling** | node-cron |
| **Deployment** | Render (Backend + Frontend) |

---

## 📁 Project Structure

```
Teaching-Platform/
│
├── backend/                    # Express.js REST API
│   ├── controllers/            # Business logic
│   │   ├── aiController.js          # AI quiz, content, timetable generation
│   │   ├── motivationController.js  # Daily motivation & achievements
│   │   ├── progressController.js    # Progress tracking logic
│   │   └── topicController.js       # Topic management
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js                  # User model (auth, profile, Google OAuth)
│   │   ├── Syllabus.js              # Syllabus with topics & subtopics
│   │   ├── Quiz.js                  # Quiz model
│   │   ├── QuizResult.js            # Quiz attempt results
│   │   ├── Timetable.js             # AI-generated timetables
│   │   ├── MotivationHistory.js     # Daily motivation records
│   │   └── OTP.js                   # OTP model for email verification
│   ├── routes/                 # API route definitions
│   │   ├── auth.js                  # Register, login, profile, Google OAuth
│   │   ├── users.js                 # User CRUD (admin)
│   │   ├── syllabi.js               # Syllabus CRUD
│   │   ├── syllabusUpload.js        # File upload & AI parsing
│   │   ├── quizzes.js               # Quiz CRUD & submission
│   │   ├── topics.js                # Topic routes
│   │   ├── progress.js              # Progress & recommendations
│   │   ├── timetables.js            # Timetable CRUD & AI generation
│   │   ├── motivation.js            # Motivation routes
│   │   ├── ai.js                    # AI endpoint routes
│   │   ├── doubts.js                # Doubt solving routes
│   │   └── mentor.js                # AI Mentor routes
│   ├── middleware/              # Express middleware
│   │   ├── auth.js                  # JWT verification middleware
│   │   └── admin.js                 # Admin role check middleware
│   ├── utils/                  # Utility services
│   │   ├── aiService.js             # Core AI service (Gemini API integration)
│   │   ├── geminiService.js         # Gemini model initialization & fallback
│   │   ├── emailService.js          # Nodemailer email service
│   │   ├── cronJobs.js              # Scheduled tasks (daily emails)
│   │   ├── fileParser.js            # PDF/DOCX file parsing
│   │   ├── syllabusParser.js        # AI-powered syllabus extraction
│   │   └── generateToken.js         # JWT token generator
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── frontend/                   # React.js SPA
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.tsx           # Navigation bar
│   │   │   ├── GoogleSignInButton.tsx  # Google OAuth button
│   │   │   ├── LoadingSpinner.tsx   # Loading animation
│   │   │   └── PrivateRoute.tsx     # Auth-protected route wrapper
│   │   ├── pages/              # Page-level components
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── Register.tsx         # Registration with OTP
│   │   │   ├── Dashboard.tsx        # Main user dashboard
│   │   │   ├── Syllabus.tsx         # Syllabus management
│   │   │   ├── Quiz.tsx             # Quiz generation & list
│   │   │   ├── InteractiveQuiz.tsx  # Quiz-taking interface
│   │   │   ├── StudyMaterials.tsx   # AI study materials
│   │   │   ├── Timetable.tsx        # Timetable management
│   │   │   ├── Progress.tsx         # Progress analytics
│   │   │   ├── Profile.tsx          # User profile settings
│   │   │   ├── AIMentor.tsx         # AI Mentor chat
│   │   │   └── AdminDashboard.tsx   # Admin panel
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── LoadingContext.tsx   # Global loading state
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Auth hook
│   │   ├── App.tsx             # Root component with routing
│   │   └── index.tsx           # React entry point
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── package.json                # Root package (concurrently)
├── start-app.js                # App startup script
└── README.md
```

---

## 📦 Database Models

### User
| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name |
| email | String | Unique email (indexed) |
| password | String | Hashed with bcrypt |
| role | String | `user` or `admin` |
| grade | String | Student's grade/class |
| board | String | Education board (CBSE, ICSE, etc.) |
| subjects | [String] | List of subjects |
| googleId | String | Google OAuth ID |
| isVerified | Boolean | Email verification status |

### Syllabus
| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId | Reference to User |
| subject | String | Subject name |
| title | String | Syllabus title |
| topics | [Object] | Array of topics with subtopics |
| completedTopics | [Number] | Indices of completed topics |

### Quiz & QuizResult
- Stores AI-generated questions with options and correct answers
- Tracks user responses, scores, and time taken

### Timetable
- AI-generated study schedules with day-wise breakdowns
- Linked to user and customizable

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/profile` | Get logged-in user profile |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| PUT | `/api/auth/change-password` | Change password |

### Syllabus
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/syllabi` | Create syllabus |
| GET | `/api/syllabi` | Get all user syllabi |
| GET | `/api/syllabi/:id` | Get specific syllabus |
| PUT | `/api/syllabi/:id` | Update syllabus |
| DELETE | `/api/syllabi/:id` | Delete syllabus |
| POST | `/api/syllabi-upload/upload` | Upload & parse syllabus file |

### AI Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-quiz` | Generate AI quiz |
| POST | `/api/ai/generate-content` | Generate learning content |
| POST | `/api/ai/generate-study-materials` | Generate study materials |
| POST | `/api/doubts/ask` | Ask a doubt |
| POST | `/api/doubts/ask-contextual` | Contextual doubt solving |
| POST | `/api/mentor/chat` | AI Mentor conversation |

### Progress & Timetable
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get overall progress |
| GET | `/api/progress/achievements` | Get achievements |
| GET | `/api/progress/recommendations` | Get personalized recommendations |
| POST | `/api/timetables/generate-ai` | Generate AI timetable |
| GET | `/api/timetables` | Get all timetables |
| DELETE | `/api/timetables/:id` | Delete timetable |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin only) |
| DELETE | `/api/users/:id` | Delete user (admin only) |

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or above)
- **MongoDB** (local or MongoDB Atlas)
- **Google Gemini API Key** ([Get it here](https://aistudio.google.com/))
- **Gmail App Password** (for Nodemailer email service)

### 1. Clone the Repository

```bash
git clone https://github.com/sksabdarali/Teaching-Plateform.git
cd Teaching-Plateform
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/teaching-platform
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Create a `.env` file inside the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 4. Run the Application

```bash
# Start both backend & frontend concurrently
npm run dev
```

- **Backend** runs on: `http://localhost:5000`
- **Frontend** runs on: `http://localhost:3000`

---

## 🔑 Key Implementation Details

### AI Integration (Google Gemini API)
- Uses `@google/generative-ai` package with **model fallback system**
- Primary model: `gemini-2.0-flash` (fastest), with fallbacks to `gemini-1.5-flash`, `gemini-1.5-pro`, etc.
- Custom prompts engineered for educational content generation
- Built-in **JSON response parsing** with error recovery for AI outputs
- Rate limiting handled gracefully with user-friendly error messages

### Authentication Flow
1. User registers with email → OTP sent via Nodemailer → email verified
2. OR user signs in via Google OAuth 2.0
3. JWT token issued on successful login, stored on client side
4. Protected routes verify JWT via `auth` middleware on every request

### File Upload & Parsing
- Supports **PDF** (pdf-parse), **DOCX** (Mammoth), and plain text uploads
- Multer handles multipart file uploads (max 5MB)
- Uploaded syllabus files are parsed by AI to extract structured topics

### Cron Jobs
- **Daily motivational quotes**: Runs daily via `node-cron`, sends motivational emails to all verified users using Nodemailer

---

## 📱 Application Pages

| Page | Description |
|------|-------------|
| **Home** | Landing page with feature overview |
| **Register/Login** | Authentication with email OTP & Google OAuth |
| **Dashboard** | Overview of progress, subjects, and recent activity |
| **Syllabus** | Upload, view, and manage syllabi with topic tracking |
| **Quiz** | Generate AI quizzes and take interactive assessments |
| **Study Materials** | AI-generated learning content for any topic |
| **Timetable** | Create and manage AI-generated study schedules |
| **Progress** | Visual analytics with charts and achievement badges |
| **AI Mentor** | Chat with AI mentor for guided learning |
| **Profile** | Update personal info and change password |
| **Admin Dashboard** | Manage users and monitor platform (admin only) |

---

## 🧪 Testing the API

You can test the API using tools like **Postman** or **Thunder Client**:

```bash
# Health check
GET http://localhost:5000/

# Register a new user
POST http://localhost:5000/api/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "123456" }

# Login
POST http://localhost:5000/api/auth/login
Body: { "email": "john@example.com", "password": "123456" }

# Generate AI Quiz (requires JWT token in Authorization header)
POST http://localhost:5000/api/ai/generate-quiz
Headers: { "Authorization": "Bearer <your_jwt_token>" }
Body: { "topic": "Photosynthesis", "difficulty": "medium", "numberOfQuestions": 5 }
```

---

## 🚀 Deployment

The application is deployed on **Render**:
- Backend and frontend are served from the same instance
- Frontend is built using `npm run build` and served as static files
- MongoDB Atlas is used as the production database
- Environment variables are configured in Render's dashboard

---

## 📈 Future Scope

- **Video Content Integration** – Embed educational videos for topics
- **Peer-to-Peer Learning** – Collaborative study features
- **Mobile App** – React Native version for mobile users
- **Advanced Analytics** – Detailed performance reports with export
- **Parent/Teacher Dashboard** – Allow parents/teachers to monitor progress
- **Multi-language Support** – Internationalization for wider reach

---

## 👨‍💻 Author

**SK Sabdar Ali**

---

## 📄 License

This project is licensed under the MIT License.