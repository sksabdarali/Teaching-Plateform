import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../context/LoadingContext';
import axios from 'axios';

interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
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

const Quiz: React.FC = () => {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const { token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    grade: '',
    board: ''
  });
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<{score: number, total: number} | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch quizzes after token is set
    const fetchData = async () => {
      try {
        showLoading();
        let endpoint = '/api/quizzes';
        if (syllabusId) {
          endpoint = `/api/quizzes/by-syllabus/${syllabusId}`;
        }
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setQuizzes(response.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        hideLoading();
      }
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate, syllabusId, showLoading, hideLoading]);

  useEffect(() => {
    if (selectedQuiz) {
      setQuizAnswers(Array(selectedQuiz.questions.length).fill(-1));
    }
  }, [selectedQuiz]);

  const generateQuizFromSyllabus = async () => {
    if (!token || !syllabusId) return;

    try {
      const response = await axios.post(
        `/api/quizzes/generate-from-syllabus/${syllabusId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Add the generated quiz to the list
      setQuizzes(prev => [response.data, ...prev]);
      alert('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      alert(error.response?.data?.message || 'Error generating quiz');
    }
  };

  const createQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const quizData = {
        ...quizForm,
        questions: [newQuestion] // Start with one question
      };

      const response = await axios.post('/api/quizzes', quizData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setQuizzes(prev => [response.data, ...prev]);
      setQuizForm({
        title: '',
        description: '',
        subject: '',
        topic: '',
        grade: '',
        board: ''
      });
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      });
      setShowCreateForm(false);
      alert('Quiz created successfully!');
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      alert(error.response?.data?.message || 'Error creating quiz');
    }
  };

  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the quiz: ${quizTitle}?`)) {
      return;
    }

    if (!token) return;

    try {
      await axios.delete(`/api/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setQuizzes(prev => prev.filter(quiz => quiz._id !== quizId));
      if (selectedQuiz && selectedQuiz._id === quizId) {
        setSelectedQuiz(null);
      }
      alert('Quiz deleted successfully');
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      alert(error.response?.data?.message || 'Error deleting quiz');
    }
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = optionIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    if (!selectedQuiz) return;

    let score = 0;
    selectedQuiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        score++;
      }
    });

    setQuizResults({ score, total: selectedQuiz.questions.length });
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizAnswers(Array(selectedQuiz?.questions.length || 0).fill(-1));
    setShowResults(false);
    setQuizResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quizzes</h1>

      {/* Generate Quiz from Syllabus Section */}
      {syllabusId && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Generate Quiz from Syllabus</h2>
          <p className="text-gray-700 mb-4">Create a quiz based on the selected syllabus content.</p>
          <button
            onClick={generateQuizFromSyllabus}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Quiz from Syllabus
          </button>
        </div>
      )}

      {/* Create New Quiz Form */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Quiz</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showCreateForm ? 'Cancel' : 'Create New Quiz'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={createQuiz} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={quizForm.subject}
                  onChange={(e) => setQuizForm({...quizForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={quizForm.topic}
                  onChange={(e) => setQuizForm({...quizForm, topic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Class</label>
                <input
                  type="text"
                  value={quizForm.grade}
                  onChange={(e) => setQuizForm({...quizForm, grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Board/University</label>
                <input
                  type="text"
                  value={quizForm.board}
                  onChange={(e) => setQuizForm({...quizForm, board: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">First Question</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="text-gray-600 mr-2">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <select
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                >
                  {newQuestion.options.map((_, index) => (
                    <option key={index} value={index}>{index + 1}. {newQuestion.options[index]}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Create Quiz
            </button>
          </form>
        )}
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quizzes.map((quiz) => (
          <div 
            key={quiz._id} 
            className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
              selectedQuiz && selectedQuiz._id === quiz._id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedQuiz(quiz);
              setShowResults(false);
              setQuizResults(null);
            }}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuiz(quiz._id, quiz.title);
                }}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md p-1"
                title="Delete quiz"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
            <div className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Subject:</span> {quiz.subject} | 
              <span className="font-medium"> Topic:</span> {quiz.topic} | 
              <span className="font-medium"> Grade:</span> {quiz.grade}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              <span className="font-medium">Questions:</span> {quiz.questions.length}
            </div>
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/syllabus/${quiz.syllabusId}`);
              }}
            >
              View Source Syllabus
            </button>
          </div>
        ))}
      </div>

      {/* Quiz Taking Interface */}
      {selectedQuiz && !showResults && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{selectedQuiz.title}</h2>
            <button 
              onClick={resetQuiz}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Reset Quiz
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{selectedQuiz.description}</p>
          
          <div className="space-y-6">
            {selectedQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  {qIndex + 1}. {question.question}
                </h3>
                
                <div className="space-y-2 ml-4">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-start">
                      <input
                        type="radio"
                        id={`q${qIndex}-o${oIndex}`}
                        name={`question-${qIndex}`}
                        checked={quizAnswers[qIndex] === oIndex}
                        onChange={() => handleOptionChange(qIndex, oIndex)}
                        className="mt-1 mr-2"
                      />
                      <label 
                        htmlFor={`q${qIndex}-o${oIndex}`} 
                        className="text-gray-700"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={submitQuiz}
              disabled={quizAnswers.some(answer => answer === -1)}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                quizAnswers.some(answer => answer === -1) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Submit Quiz
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
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    )}
                    
                    {quizAnswers[qIndex] === question.correctAnswer ? (
                      <p className="text-green-600 font-medium">✓ Correct!</p>
                    ) : (
                      <p className="text-red-600 font-medium">✗ Incorrect</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

export default Quiz;