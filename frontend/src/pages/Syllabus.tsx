import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../context/LoadingContext';
import axios from 'axios';

interface Topic {
  _id: string;
  title: string;
  description: string;
  content: string;
  subtopics: {
    title: string;
    content: string;
  }[];
  resources: {
    type: string;
    url: string;
    title: string;
  }[];
  completed?: boolean;
}

interface Syllabus {
  _id: string;
  title: string;
  description: string;
  grade: string;
  board: string;
  subject: string;
  topics: Topic[];
}

const SyllabusPage: React.FC = () => {
  const { token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [board, setBoard] = useState('');
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingSyllabusId, setDeletingSyllabusId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainingConcept, setExplainingConcept] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  
  // Store the functions in refs to avoid dependency issues
  const showLoadingRef = useRef(showLoading);
  const hideLoadingRef = useRef(hideLoading);
  
  // Update refs when the functions change
  useEffect(() => {
    showLoadingRef.current = showLoading;
    hideLoadingRef.current = hideLoading;
  }, [showLoading, hideLoading]);

  // Filter topics based on search term
  const filteredTopics = selectedSyllabus?.topics?.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Fetch syllabus progress when a syllabus is selected
  const fetchSyllabusProgress = useCallback(async () => {
    if (selectedSyllabus && token) {
      try {
        const response = await axios.get(`/api/progress/syllabus/${selectedSyllabus._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Update topics with completion status only if different
        setSelectedSyllabus(prevSyllabus => {
          if (!prevSyllabus || prevSyllabus._id !== selectedSyllabus._id) {
            // If this is a different syllabus, return early without update
            return prevSyllabus;
          }

          // Fix: Access completedTopics from response.data.progress
          const completedTopicIds = response.data.progress?.completedTopics || [];

          // Check if completion status has changed
          const hasChanged = prevSyllabus.topics.some(topic =>
            topic.completed !== completedTopicIds.includes(topic._id)
          );

          if (hasChanged) {
            return {
              ...prevSyllabus,
              topics: prevSyllabus.topics.map(topic => ({
                ...topic,
                completed: completedTopicIds.includes(topic._id)
              }))
            };
          }

          return prevSyllabus;
        });


      } catch (error) {
        console.error('Error fetching syllabus progress:', error);
      }
    }
  }, [selectedSyllabus, token]);

  useEffect(() => {
    fetchSyllabusProgress();
  }, [fetchSyllabusProgress]);

  useEffect(() => {
    const fetchSyllabi = async () => {
      if (!token) return;

      try {
        // Use the functions from refs to avoid dependency issues
        showLoadingRef.current();
        const response = await axios.get('/api/syllabi', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSyllabi(response.data);
      } catch (error) {
        console.error('Error fetching syllabi:', error);
      } finally {
        hideLoadingRef.current();
      }
    };

    fetchSyllabi();
  }, [token]); // Removed showLoading and hideLoading from dependencies

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadError('Please select a file');
      return;
    }

    if (!title || !grade || !board || !subject) {
      setUploadError('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('syllabusFile', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('grade', grade);
    formData.append('board', board);
    formData.append('subject', subject);

    try {
      setUploading(true);
      setUploadError('');

      const response = await axios.post('/api/syllabi-upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      // response.data.syllabus has the correct shape with _id and topics
      const newSyllabus = response.data.syllabus;
      setSyllabi(prev => [newSyllabus, ...prev]);
      setUploadSuccess('Syllabus uploaded successfully!');
      setShowUploadForm(false);
      setFile(null);
      setTitle('');
      setDescription('');
      setGrade('');
      setBoard('');
      setSubject('');

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.response?.data?.message || 'Error uploading syllabus');
    } finally {
      setUploading(false);
    }
  };

  // When a syllabus card is clicked, fetch parsed unit-wise data if topics are empty
  const handleSyllabusSelect = async (syllabus: Syllabus) => {
    // If topics are already populated, just select it
    if (syllabus.topics && syllabus.topics.length > 0) {
      setSelectedSyllabus(syllabus);
      return;
    }

    // Otherwise, call the parse endpoint to extract units
    try {
      setParsing(true);
      setSelectedSyllabus(syllabus); // Show the syllabus header immediately

      const response = await axios.get(`/api/syllabi-upload/${syllabus._id}/parse`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const parsedTopics = response.data.topics || [];
      const updatedSyllabus = { ...syllabus, topics: parsedTopics };

      setSelectedSyllabus(updatedSyllabus);

      // Also update the syllabus in the main list so clicking again doesn't re-parse
      setSyllabi(prev => prev.map(s => s._id === syllabus._id ? updatedSyllabus : s));
    } catch (error) {
      console.error('Error parsing syllabus:', error);
      setSelectedSyllabus(syllabus); // Still show it even if parsing fails
    } finally {
      setParsing(false);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId);
  };

  const handleTopicCompletion = async (topicId: string) => {
    if (!selectedSyllabus || !token) return;

    try {
      await axios.post('/api/progress/syllabus-topic', {
        syllabusId: selectedSyllabus._id,
        topicTitle: selectedSyllabus.topics.find(t => t._id === topicId)?.title || '',
        timeSpent: 30, // Default 30 minutes
        completed: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh progress
      fetchSyllabusProgress();
    } catch (error) {
      console.error('Error marking topic as completed:', error);
    }
  };

  const handleDeleteSyllabus = async (syllabusId: string, syllabusTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the syllabus: ${syllabusTitle}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingSyllabusId(syllabusId);
      await axios.delete(`/api/syllabi/${syllabusId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove from the list
      setSyllabi(prev => prev.filter(s => s._id !== syllabusId));
      
      // Clear selected syllabus if it's the one being deleted
      if (selectedSyllabus && selectedSyllabus._id === syllabusId) {
        setSelectedSyllabus(null);
      }
      
      setUploadSuccess('Syllabus deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting syllabus:', error);
      setUploadError(error.response?.data?.message || 'Error deleting syllabus');
    } finally {
      setDeletingSyllabusId(null);
    }
  };

  const getDetailedExplanation = async (subject: string, topicTitle: string, concept: string) => {
    if (!subject || !topicTitle || !concept) {
      setUploadError('Subject, topic, and concept are required for explanation');
      return;
    }

    try {
      setIsExplaining(true);
      setExplainingConcept(concept);
      
      const response = await axios.post('/api/topics/explanation', {
        subject,
        topic: topicTitle,
        concept
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the explanation for this specific concept/topic
      setExplanations(prev => ({
        ...prev,
        [concept]: response.data.explanation
      }));
    } catch (error: any) {
      console.error('Error getting explanation:', error);
      setUploadError(error.response?.data?.message || 'Error getting explanation');
    } finally {
      setIsExplaining(false);
      setExplainingConcept('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Syllabus Management</h1>

      {uploadSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {uploadSuccess}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showUploadForm ? 'Cancel' : 'Upload New Syllabus'}
        </button>

        {selectedSyllabus && (
          <div className="text-lg font-medium text-gray-700">
            Viewing: {selectedSyllabus.title}
          </div>
        )}
      </div>

      {showUploadForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload New Syllabus</h2>

          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Class</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board/University</label>
                <input
                  type="text"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {uploading ? 'Uploading...' : 'Upload Syllabus'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Syllabus List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Syllabi</h2>
          <div className="space-y-2">
            {syllabi.map((syllabus) => (
              <div
                key={syllabus._id}
                className="p-4 border rounded cursor-pointer transition-colors flex justify-between items-start gap-2"
              >
                <div 
                  className={`flex-1 ${selectedSyllabus?._id === syllabus._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSyllabusSelect(syllabus)}
                >
                  <h3 className="font-medium text-gray-800">{syllabus.title}</h3>
                  <p className="text-sm text-gray-600">
                    {syllabus.subject} - {syllabus.grade}
                  </p>
                  <p className="text-xs text-gray-500">
                    {syllabus.topics?.length || 0} topics
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSyllabus(syllabus._id, syllabus.title)}
                  disabled={deletingSyllabusId === syllabus._id}
                  className="text-red-600 hover:text-red-800 p-1 rounded-md self-start"
                  title="Delete syllabus"
                >
                  {deletingSyllabusId === syllabus._id ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.418-5V8M9 11l4-4 4 4m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Syllabus Details */}
        <div className="lg:col-span-2">
          {selectedSyllabus ? (
            <div>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedSyllabus.title}
                </h2>
                <p className="text-gray-600 mb-4">{selectedSyllabus.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span><strong>Subject:</strong> {selectedSyllabus.subject}</span>
                  <span><strong>Grade:</strong> {selectedSyllabus.grade}</span>
                  <span><strong>Board:</strong> {selectedSyllabus.board}</span>
                  <span><strong>Topics:</strong> {selectedSyllabus.topics?.length || 0}</span>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Topics List */}
              {parsing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Parsing syllabus and extracting units...</p>
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No units/topics found in this syllabus.</p>
                  <p className="text-sm mt-1">The file might not contain recognizable unit structure.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <div key={topic._id} className="bg-white rounded-lg shadow">
                      <div
                        className={`p-4 cursor-pointer border-l-4 ${topic.completed
                            ? 'border-green-500 bg-green-50'
                            : 'border-blue-500'
                          }`}
                        onClick={() => handleTopicSelect(topic._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {topic.title}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {topic.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {topic.completed && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Completed
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTopicCompletion(topic._id);
                              }}
                              className={`px-3 py-1 text-sm rounded ${topic.completed
                                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              disabled={topic.completed}
                            >
                              {topic.completed ? 'Completed' : 'Mark Complete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedTopic === topic._id && (
                        <div className="p-4 border-t">
                          <div className="prose max-w-none">
                            <h4 className="font-medium text-gray-800 mb-2">Content:</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {topic.content}
                            </p>
                            
                            <div className="mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  getDetailedExplanation(selectedSyllabus.subject, topic.title, topic.title);
                                }}
                                disabled={isExplaining && explainingConcept === topic.title}
                                className={`px-4 py-2 rounded-md text-white font-medium ${isExplaining && explainingConcept === topic.title
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {isExplaining && explainingConcept === topic.title ? 'Explaining...' : 'Get Detailed Explanation'}
                              </button>
                              
                              {explanations[topic.title] && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                  <h4 className="font-bold text-blue-800 mb-2">Detailed Explanation:</h4>
                                  <div className="text-gray-700 prose max-w-none">
                                    {explanations[topic.title]?.split('\n').map((line: string, i: number) => (
                                      <p key={i} className="mb-2">{line}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-800 mb-2">Subtopics:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {topic.subtopics.map((subtopic, index) => (
                                    <li key={index} className="text-gray-700">
                                      <strong>{subtopic.title}:</strong> {subtopic.content}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {topic.resources && topic.resources.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-800 mb-2">Resources:</h4>
                                <div className="space-y-2">
                                  {topic.resources.map((resource, index) => (
                                    <div key={index} className="flex items-center text-gray-700">
                                      <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {resource.type}
                                      </span>
                                      <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {resource.title}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No syllabus selected
              </h3>
              <p className="text-gray-500">
                Select a syllabus from the list to view its contents
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyllabusPage;