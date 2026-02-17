import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import './App.css';

// Import components/pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Syllabus from './pages/Syllabus';
import InteractiveQuiz from './pages/InteractiveQuiz';
import ProgressPage from './pages/Progress'; // Changed import name to match export
import Timetable from './pages/Timetable';
import StudyMaterials from './pages/StudyMaterials';
import GoogleButtonDemo from './pages/GoogleButtonDemo';
import LoadingDemo from './pages/LoadingDemo';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <div className="App">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/syllabus" element={<PrivateRoute><Syllabus /></PrivateRoute>} />
                <Route path="/syllabus/:id" element={<PrivateRoute><Syllabus /></PrivateRoute>} />
                <Route path="/quiz" element={<PrivateRoute><InteractiveQuiz /></PrivateRoute>} />
                <Route path="/quiz/:syllabusId" element={<PrivateRoute><InteractiveQuiz /></PrivateRoute>} />
                <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
                <Route path="/timetable" element={<PrivateRoute><Timetable /></PrivateRoute>} />
                <Route path="/study-materials" element={<PrivateRoute><StudyMaterials /></PrivateRoute>} />
                <Route path="/google-demo" element={<GoogleButtonDemo />} />
                <Route path="/loading-demo" element={<PrivateRoute><LoadingDemo /></PrivateRoute>} />
              </Routes>
            </div>
          </div>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;