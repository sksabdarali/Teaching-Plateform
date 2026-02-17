import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface QuizResult {
  _id: string;
  quiz: {
    title: string;
    subject: string;
    topic: string;
  };
  score: number;
  percentage: number;
  maxScore: number;
  completedAt: string;
}

interface SubjectProgress {
  subject: string;
  totalQuizzes: number;
  avgScore: number;
  completedTopics: string[];
  masteryLevel: number;
  quizResults: QuizResult[];
}

const ProgressPage: React.FC = () => {
  const { token } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
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
        setLoading(false);
      }
    };

    if (token) {
      fetchProgress();
    }
  }, [token]);

  useEffect(() => {
    const fetchSubjectProgress = async () => {
      if (selectedSubject && token) {
        try {
          const response = await axios.get(`/api/progress/subject/${selectedSubject}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setSubjectProgress(response.data);
        } catch (error) {
          console.error('Error fetching subject progress:', error);
        }
      }
    };

    fetchSubjectProgress();
  }, [selectedSubject, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Prepare data for charts
  const quizHistoryData = progress?.recentResults?.slice(0, 10).map((result: QuizResult) => ({
    name: result.quiz.title,
    score: result.percentage,
    subject: result.quiz.subject
  })) || [];

  const subjectData = progress?.recentResults
    ? Array.from<string>(
        new Set(progress.recentResults.map((result: QuizResult) => result.quiz.subject))
      ).map((subject: string) => {
        const subjectResults = progress.recentResults.filter(
          (result: QuizResult) => result.quiz.subject === subject
        );
        const avgScore = subjectResults.reduce(
          (sum: number, result: QuizResult) => sum + result.percentage,
          0
        ) / subjectResults.length;
        
        return {
          name: subject,
          avgScore: Math.round(avgScore)
        };
      })
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Learning Progress</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Points</span>
              <span className="font-bold text-blue-600">{progress?.points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quizzes Completed</span>
              <span className="font-bold text-indigo-600">{progress?.quizzesCompleted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Streak</span>
              <span className="font-bold text-green-600">{progress?.streak?.current || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quizzes Taken</span>
              <span className="font-bold text-purple-600">{progress?.totalQuizzes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Score</span>
              <span className="font-bold text-yellow-600">{progress?.avgScore || 0}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Subject Mastery</h2>
          {subjectData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" name="Average Score (%)" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quiz History</h2>
          {quizHistoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quizHistoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Score (%)" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No quiz history available</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Subject Distribution</h2>
          {subjectData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name = '', percent = 0 }: { name?: string; percent?: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="avgScore"
                  >
                    {subjectData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => [`${value || 0}%`, 'Score']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Subject Details</h2>
          <div className="mt-2 sm:mt-0">
            <label htmlFor="subject-select" className="mr-2 text-gray-700">Select Subject:</label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Subjects</option>
              {progress?.recentResults && Array.from<string>(
                new Set(progress.recentResults.map((result: QuizResult) => result.quiz.subject))
              ).map((subject: string) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedSubject && subjectProgress ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Subject</h3>
                <p className="text-2xl font-bold">{subjectProgress.subject}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Average Score</h3>
                <p className="text-2xl font-bold">{subjectProgress.avgScore}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Mastery Level</h3>
                <p className="text-2xl font-bold">{subjectProgress.masteryLevel}%</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Recent Quiz Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Add null check for quizResults */}
                  {subjectProgress.quizResults && subjectProgress.quizResults.length > 0 ? (
                    subjectProgress.quizResults.map((result: QuizResult) => (
                      <tr key={result._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{result.quiz.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{result.quiz.topic}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.percentage >= 70 ? 'bg-green-100 text-green-800' : 
                            result.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.score}/{result.maxScore} ({result.percentage}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(result.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No quiz results available for this subject
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Select a subject to view detailed progress</p>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;