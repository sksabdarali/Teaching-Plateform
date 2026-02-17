import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../context/LoadingContext';
import axios from 'axios';

interface QuizResult {
  _id: string;
  quiz: {
    title: string;
    subject: string;
  };
  score: number;
  percentage: number;
  completedAt: string;
}

interface ProgressData {
  userProgress: any;
  totalQuizzes: number;
  avgScore: number;
  recentResults: QuizResult[];
  streak: {
    current: number;
    longest: number;
  };
  points: number;
  achievements: any[];
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  
  // Store the functions in refs to avoid dependency issues
  const showLoadingRef = useRef(showLoading);
  const hideLoadingRef = useRef(hideLoading);
  
  // Update refs when the functions change
  useEffect(() => {
    showLoadingRef.current = showLoading;
    hideLoadingRef.current = hideLoading;
  }, [showLoading, hideLoading]);

  const fetchProgress = useCallback(async () => {
    if (!token) return;
    
    // Use the functions from refs to avoid dependency issues
    showLoadingRef.current();
    try {
      const response = await axios.get('/api/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      hideLoadingRef.current();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProgress();
    }
  }, [token, fetchProgress]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="mt-2">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{progress?.points || 0}</div>
          <div className="text-gray-600">Points</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{progress?.streak?.current || 0}</div>
          <div className="text-gray-600">Current Streak</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{progress?.totalQuizzes || 0}</div>
          <div className="text-gray-600">Quizzes Taken</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-yellow-600">{progress?.avgScore || 0}%</div>
          <div className="text-gray-600">Avg. Score</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/syllabus" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg text-center transition"
          >
            View Syllabus
          </Link>
          <Link 
            to="/quiz" 
            className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg text-center transition"
          >
            Take Quiz
          </Link>
          <Link 
            to="/timetable" 
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-3 px-4 rounded-lg text-center transition"
          >
            View Timetable
          </Link>
          <Link 
            to="/progress" 
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-3 px-4 rounded-lg text-center transition"
          >
            Track Progress
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Quiz Results</h2>
          {progress?.recentResults && progress.recentResults.length > 0 ? (
            <div className="space-y-4">
              {progress.recentResults.map((result) => (
                <div key={result._id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{result.quiz.title}</div>
                      <div className="text-sm text-gray-600">{result.quiz.subject}</div>
                    </div>
                    <div className={`font-bold ${result.percentage >= 70 ? 'text-green-600' : result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {result.percentage}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent quiz results</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Your Subjects</h2>
          <div className="space-y-3">
            {user?.subjects?.map((subject: string, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span>{subject}</span>
                <Link 
                  to={`/syllabus?subject=${encodeURIComponent(subject)}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Study
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;