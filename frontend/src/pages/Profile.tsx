import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    grade: user?.grade || '',
    board: user?.board || '',
    subjects: user?.subjects || [],
    weakSubjects: user?.weakSubjects || [],
    strongSubjects: user?.strongSubjects || [],
    dailyStudyHours: user?.studyPreferences?.dailyStudyHours || 2,
    preferredStudyTime: user?.studyPreferences?.preferredStudyTime || { startTime: '', endTime: '' },
    difficultyPreference: user?.studyPreferences?.difficultyPreference || 'intermediate'
  });
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentWeakSubject, setCurrentWeakSubject] = useState('');
  const [currentStrongSubject, setCurrentStrongSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        grade: user.grade || '',
        board: user.board || '',
        subjects: user.subjects || [],
        weakSubjects: user.weakSubjects || [],
        strongSubjects: user.strongSubjects || [],
        dailyStudyHours: user.studyPreferences?.dailyStudyHours || 2,
        preferredStudyTime: user.studyPreferences?.preferredStudyTime || { startTime: '', endTime: '' },
        difficultyPreference: user.studyPreferences?.difficultyPreference || 'intermediate'
      });
    }
  }, [user]);



  const addSubject = () => {
    if (currentSubject.trim() && !profileData.subjects.includes(currentSubject.trim())) {
      setProfileData({
        ...profileData,
        subjects: [...profileData.subjects, currentSubject.trim()]
      });
      setCurrentSubject('');
    }
  };

  const removeSubject = (index: number) => {
    const newSubjects = [...profileData.subjects];
    newSubjects.splice(index, 1);
    setProfileData({
      ...profileData,
      subjects: newSubjects
    });
  };

  const addWeakSubject = () => {
    if (currentWeakSubject.trim() && !profileData.weakSubjects.includes(currentWeakSubject.trim())) {
      setProfileData({
        ...profileData,
        weakSubjects: [...profileData.weakSubjects, currentWeakSubject.trim()]
      });
      setCurrentWeakSubject('');
    }
  };

  const removeWeakSubject = (index: number) => {
    const newWeakSubjects = [...profileData.weakSubjects];
    newWeakSubjects.splice(index, 1);
    setProfileData({
      ...profileData,
      weakSubjects: newWeakSubjects
    });
  };

  const addStrongSubject = () => {
    if (currentStrongSubject.trim() && !profileData.strongSubjects.includes(currentStrongSubject.trim())) {
      setProfileData({
        ...profileData,
        strongSubjects: [...profileData.strongSubjects, currentStrongSubject.trim()]
      });
      setCurrentStrongSubject('');
    }
  };

  const removeStrongSubject = (index: number) => {
    const newStrongSubjects = [...profileData.strongSubjects];
    newStrongSubjects.splice(index, 1);
    setProfileData({
      ...profileData,
      strongSubjects: newStrongSubjects
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile Settings</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
          await axios.put('/api/users/profile', profileData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setMessage('Profile updated successfully!');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Error updating profile');
        }
      }} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade">
              Grade/Class
            </label>
            <input
              id="grade"
              type="text"
              value={profileData.grade}
              onChange={(e) => setProfileData({...profileData, grade: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="board">
              Board/University
            </label>
            <input
              id="board"
              type="text"
              value={profileData.board}
              onChange={(e) => setProfileData({...profileData, board: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Subjects
          </label>
          <div className="flex mb-2">
            <input
              type="text"
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="Add a subject"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={addSubject}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          {profileData.subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profileData.subjects.map((subject, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-800 hover:bg-blue-200 focus:outline-none"
                  >
                    <span className="sr-only">Remove</span>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Weak Subjects
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={currentWeakSubject}
                onChange={(e) => setCurrentWeakSubject(e.target.value)}
                placeholder="Add weak subject"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={addWeakSubject}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Add
              </button>
            </div>
            {profileData.weakSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.weakSubjects.map((subject, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeWeakSubject(index)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-red-800 hover:bg-red-200 focus:outline-none"
                    >
                      <span className="sr-only">Remove</span>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Strong Subjects
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={currentStrongSubject}
                onChange={(e) => setCurrentStrongSubject(e.target.value)}
                placeholder="Add strong subject"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={addStrongSubject}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add
              </button>
            </div>
            {profileData.strongSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.strongSubjects.map((subject, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeStrongSubject(index)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-800 hover:bg-green-200 focus:outline-none"
                    >
                      <span className="sr-only">Remove</span>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dailyStudyHours">
              Daily Study Hours
            </label>
            <input
              id="dailyStudyHours"
              type="number"
              min="1"
              max="24"
              value={profileData.dailyStudyHours}
              onChange={(e) => setProfileData({...profileData, dailyStudyHours: parseInt(e.target.value) || 2})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="difficultyPreference">
              Difficulty Preference
            </label>
            <select
              id="difficultyPreference"
              value={profileData.difficultyPreference}
              onChange={(e) => setProfileData({...profileData, difficultyPreference: e.target.value})}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Preferred Study Time
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-xs mb-1">Start Time</label>
              <input
                type="time"
                value={profileData.preferredStudyTime.startTime}
                onChange={(e) => setProfileData({
                  ...profileData, 
                  preferredStudyTime: {
                    ...profileData.preferredStudyTime,
                    startTime: e.target.value
                  }
                })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs mb-1">End Time</label>
              <input
                type="time"
                value={profileData.preferredStudyTime.endTime}
                onChange={(e) => setProfileData({
                  ...profileData, 
                  preferredStudyTime: {
                    ...profileData.preferredStudyTime,
                    endTime: e.target.value
                  }
                })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;