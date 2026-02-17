import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            AI-Powered Personalized Learning Platform
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Experience personalized education tailored to your learning style. Our AI guides you through your syllabus, tracks your progress, and adapts to your needs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Personalized Learning</h3>
              <p className="text-gray-600">AI-powered curriculum adapted to your learning pace and style</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">Detailed analytics to monitor your improvement over time</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Quizzes</h3>
              <p className="text-gray-600">AI-generated quizzes tailored to your weak areas</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!token ? (
              <>
                <Link 
                  to="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 font-bold py-3 px-8 rounded-lg transition duration-300"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link 
                to="/dashboard" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;