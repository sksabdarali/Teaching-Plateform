import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

interface ScheduleItem {
  _id: string;
  subject: string;
  topic: string;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  priority: number;
  isCompleted: boolean;
}

interface Timetable {
  _id: string;
  title: string;
  description: string;
  schedule: ScheduleItem[];
  startDate: string;
  endDate: string;
  status: string;
  generationMethod: string;
}

const TimetablePage: React.FC = () => {
  const { token } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchTimetables = useCallback(async () => {
    try {
      const response = await axios.get('/api/timetables', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTimetables(response.data);
      if (response.data.length > 0) {
        setSelectedTimetable(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching timetables:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTimetables();
    }
  }, [token, fetchTimetables]);

  const openGenerateModal = () => {
    setSubjectsList([]);
    setSubjectInput('');
    setError('');
    setShowSubjectModal(true);
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !subjectsList.includes(trimmed)) {
      setSubjectsList([...subjectsList, trimmed]);
      setSubjectInput('');
    }
  };

  const removeSubject = (index: number) => {
    setSubjectsList(subjectsList.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubject();
    }
  };

  const generateAITimetable = async () => {
    setGenerating(true);
    setError('');
    setShowSubjectModal(false);
    try {
      const response = await axios.post('/api/timetables/generate-ai',
        { subjects: subjectsList.length > 0 ? subjectsList : undefined },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setTimetables([response.data, ...timetables]);
      setSelectedTimetable(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate timetable. Please try again.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const deleteTimetable = async (id: string) => {
    if (!window.confirm('Delete this timetable?')) return;
    try {
      await axios.delete(`/api/timetables/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = timetables.filter(t => t._id !== id);
      setTimetables(updated);
      if (selectedTimetable?._id === id) {
        setSelectedTimetable(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error('Error deleting timetable:', err);
    }
  };

  // Get unique dates from the selected timetable's schedule
  const getUniqueDates = (schedule: ScheduleItem[]) => {
    const dates = Array.from(new Set(schedule.map(item => item.date)));
    return dates.sort();
  };

  // Filter schedule by selected date
  const getFilteredSchedule = () => {
    if (!selectedTimetable) return [];
    const schedule = selectedTimetable.schedule;
    if (!selectedDate) return schedule;
    return schedule.filter(item => item.date === selectedDate);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Study Timetable</h1>
        <button
          onClick={openGenerateModal}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : 'Generate AI Timetable'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 font-bold">×</button>
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>AI is creating your personalized timetable... This may take a moment.</span>
        </div>
      )}

      {/* Subject Input Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Generate Study Timetable</h2>
            <p className="text-gray-600 text-sm mb-4">
              Add your subjects below, or leave empty to use subjects from your uploaded syllabi / profile.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="e.g. Mathematics"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Add
              </button>
            </div>
            {subjectsList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {subjectsList.map((subject, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {subject}
                    <button onClick={() => removeSubject(idx)} className="hover:text-blue-600 font-bold">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={generateAITimetable}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold"
              >
                Generate Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {timetables.length === 0 && !generating ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No timetables found</h2>
          <p className="text-gray-600 mb-4">You don't have any study timetables yet.</p>
          <button
            onClick={openGenerateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Generate Your First Timetable
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timetable List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Your Timetables</h2>
              <ul className="space-y-2">
                {timetables.map((timetable) => (
                  <li key={timetable._id}>
                    <div
                      className={`p-3 rounded-md cursor-pointer ${selectedTimetable?._id === timetable._id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                        }`}
                    >
                      <div onClick={() => setSelectedTimetable(timetable)}>
                        <div className="font-medium">{timetable.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(timetable.startDate).toLocaleDateString()} - {new Date(timetable.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs mt-1 flex items-center gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full ${timetable.status === 'active' ? 'bg-green-100 text-green-800' :
                            timetable.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {timetable.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {timetable.generationMethod === 'ai_generated' ? 'AI' : timetable.generationMethod}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTimetable(timetable._id); }}
                        className="text-xs text-red-500 hover:text-red-700 mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timetable Content */}
          <div className="lg:col-span-3">
            {selectedTimetable ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedTimetable.title}</h2>
                  <p className="text-gray-600">{selectedTimetable.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
                    <span>Start: {new Date(selectedTimetable.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(selectedTimetable.endDate).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${selectedTimetable.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedTimetable.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedTimetable.status}
                    </span>
                  </div>
                </div>

                {/* Date filter tabs */}
                {selectedTimetable.schedule.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setSelectedDate('')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${!selectedDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      All Days
                    </button>
                    {getUniqueDates(selectedTimetable.schedule).map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedDate === date ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredSchedule().map((item, index) => (
                        <tr key={item._id || index} className={item.isCompleted ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatDate(item.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.startTime} - {item.endTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.subject}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{item.topic}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.duration} min</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < item.priority ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461c.969 0 1.371-1.24.588-1.81l-2.8-2.034z" />
                                </svg>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {item.isCompleted ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getFilteredSchedule().length === 0 && (
                    <div className="text-center py-8 text-gray-500">No sessions found for the selected day.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p>Select a timetable to view its schedule</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;