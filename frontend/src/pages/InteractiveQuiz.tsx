import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizData {
  _id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  grade: string;
  board: string;
  questions: Question[];
  syllabusId?: string;
  createdAt?: string;
}

interface QuizResult {
  _id: string;
  score: number;
  total: number;
}

const InteractiveQuiz: React.FC = () => {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('beginner');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Data Structures');
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<number[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quizzes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchUserPoints = useCallback(async () => {
    try {
      const response = await axios.get('/api/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserPoints(response.data.points || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchQuizzes();
      fetchUserPoints();
    }
  }, [token, fetchQuizzes, fetchUserPoints]);

  const generateQuiz = async (useSyllabus: boolean = false) => {
    try {
      const response = await axios.post('/api/ai/generate-quiz', {
        subject,
        topic,
        difficulty,
        numQuestions,
        useSyllabus,
        syllabusId: useSyllabus ? syllabusId : undefined
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setQuizzes(prev => [response.data, ...prev]);
      alert('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      alert(error.response?.data?.message || 'Error generating quiz');
    }
  };

  const handleQuizSelect = (quiz: QuizData) => {
    setSelectedQuiz(quiz);
    setQuizAnswers(Array(quiz.questions.length).fill(-1));
    setSubmittedAnswers(Array(quiz.questions.length).fill(-1));
    setShowResults(false);
    setQuizResults(null);
    setCurrentPoints(0);
  };

  const submitAnswer = (questionIndex: number, optionIndex: number) => {
    if (submittedAnswers[questionIndex] !== -1) return;

    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = optionIndex;
    setQuizAnswers(newAnswers);

    const newSubmittedAnswers = [...submittedAnswers];
    newSubmittedAnswers[questionIndex] = optionIndex;
    setSubmittedAnswers(newSubmittedAnswers);

    if (selectedQuiz && optionIndex === selectedQuiz.questions[questionIndex].correctAnswer) {
      const pointsEarned = 10;
      const newPoints = currentPoints + pointsEarned;
      setCurrentPoints(newPoints);
      setUserPoints(prev => prev + pointsEarned);
      updateUserPoints(pointsEarned);
    }
  };

  const updateUserPoints = async (points: number) => {
    try {
      await axios.post('/api/progress/update-points', {
        points
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const resetQuiz = () => {
    if (selectedQuiz) {
      setQuizAnswers(Array(selectedQuiz.questions.length).fill(-1));
      setSubmittedAnswers(Array(selectedQuiz.questions.length).fill(-1));
      setShowResults(false);
      setQuizResults(null);
      setCurrentPoints(0);
    }
  };

  const submitAllAnswers = async () => {
    if (!selectedQuiz) return;

    let score = 0;
    selectedQuiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        score++;
      }
    });

    setQuizResults({
      _id: selectedQuiz._id,
      score,
      total: selectedQuiz.questions.length
    });
    setShowResults(true);

    // Update progress after quiz completion
    try {
      await axios.post('/api/progress/update-after-quiz', {
        quizId: selectedQuiz._id,
        score,
        maxScore: selectedQuiz.questions.length
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh user points
      fetchUserPoints();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Interactive Quizzes</h1>

      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Your Points</h2>
            <p className="text-3xl font-bold">{userPoints}</p>
          </div>
          {currentPoints > 0 && (
            <div className="text-right">
              <p className="text-lg">+{currentPoints} points earned!</p>
              <p className="text-sm opacity-90">This quiz session</p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Generation Section - Always visible */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Generate New Quiz</h2>
        <p className="text-gray-700 mb-4">Create a custom quiz based on your preferences.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Data Structures"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateQuiz(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Quiz
          </button>

          {syllabusId && (
            <button
              onClick={() => generateQuiz(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate from Syllabus
            </button>
          )}
        </div>
      </div>

      {/* Available Quizzes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Quizzes</h2>

        {quizzes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800 mb-1">No Quizzes Available</h3>
            <p className="text-yellow-700 mb-4">Generate your first quiz using the form above to get started!</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => generateQuiz(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Generate First Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer border border-gray-200 transition-all"
                onClick={() => handleQuizSelect(quiz)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Subject:</span> {quiz.subject} |
                  <span className="font-medium"> Topic:</span> {quiz.topic} |
                  <span className="font-medium"> Questions:</span> {quiz.questions.length}
                </div>
                {quiz.syllabusId && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    From Syllabus
                  </span>
                )}
                <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Quiz Interface */}
      {selectedQuiz && !showResults && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{selectedQuiz.title}</h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Points: {currentPoints}</p>
              <button
                onClick={resetQuiz}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Reset Quiz
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{selectedQuiz.description}</p>

          <div className="space-y-6">
            {selectedQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  {qIndex + 1}. {question.question}
                </h3>

                <div className="space-y-2 ml-4">
                  {question.options.map((option, oIndex) => {
                    const isSelected = quizAnswers[qIndex] === oIndex;
                    const isSubmitted = submittedAnswers[qIndex] !== -1;
                    const isCorrect = oIndex === question.correctAnswer;
                    const showFeedback = isSubmitted;

                    let optionStyle = "flex items-start p-3 rounded-lg border cursor-pointer hover:bg-gray-50";
                    let feedbackText = "";
                    let feedbackColor = "";

                    if (showFeedback) {
                      if (isSelected && isCorrect) {
                        optionStyle += " bg-green-100 border-green-500";
                        feedbackText = "✓ Correct! +10 points";
                        feedbackColor = "text-green-600";
                      } else if (isSelected && !isCorrect) {
                        optionStyle += " bg-red-100 border-red-500";
                        feedbackText = "✗ Incorrect";
                        feedbackColor = "text-red-600";
                      } else if (isCorrect) {
                        optionStyle += " bg-green-50 border-green-300";
                      }
                    } else if (isSelected) {
                      optionStyle += " bg-blue-50 border-blue-500";
                    }

                    return (
                      <div key={oIndex}>
                        <div
                          className={optionStyle}
                          onClick={() => !isSubmitted && submitAnswer(qIndex, oIndex)}
                        >
                          <input
                            type="radio"
                            id={`q${qIndex}-o${oIndex}`}
                            name={`question-${qIndex}`}
                            checked={isSelected}
                            onChange={() => { }}
                            className="mt-1 mr-3"
                            disabled={isSubmitted}
                          />
                          <label
                            htmlFor={`q${qIndex}-o${oIndex}`}
                            className="text-gray-700 flex-grow"
                          >
                            {option}
                          </label>
                        </div>
                        {showFeedback && feedbackText && (
                          <p className={`ml-8 mt-1 text-sm font-medium ${feedbackColor}`}>
                            {feedbackText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={submitAllAnswers}
              disabled={submittedAnswers.every(answer => answer === -1)}
              className={`px-6 py-3 rounded-md text-white font-medium ${submittedAnswers.every(answer => answer === -1)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              Submit Quiz & See Results
            </button>
          </div>
        </div>
      )}

      {/* Quiz Results */}
      {showResults && quizResults && selectedQuiz && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Results</h2>

          <div className="text-center py-8">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {quizResults.score}/{quizResults.total}
            </div>
            <div className="text-xl text-gray-700 mb-6">
              Score: {Math.round((quizResults.score / quizResults.total) * 100)}%
            </div>
            <div className="text-lg text-blue-600 font-medium">
              Points Earned: {currentPoints}
            </div>
          </div>

          <div className="mb-6">
            {selectedQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="mb-4 p-4 border rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">
                  {qIndex + 1}. {question.question}
                </h3>

                <div className="ml-4">
                  <p className="mb-2">
                    <span className="font-medium">Your answer:</span> {quizAnswers[qIndex] !== -1
                      ? question.options[quizAnswers[qIndex]]
                      : 'No answer selected'}
                  </p>

                  <p className="mb-2">
                    <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                  </p>

                  {question.explanation && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </p>
                  )}

                  {quizAnswers[qIndex] === question.correctAnswer ? (
                    <p className="text-green-600 font-medium">✓ Correct! +10 points</p>
                  ) : (
                    <p className="text-red-600 font-medium">✗ Incorrect</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setSelectedQuiz(null);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveQuiz;