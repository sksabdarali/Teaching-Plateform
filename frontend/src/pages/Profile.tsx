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
  });
  const [currentSubject, setCurrentSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Added hook to refresh user data after profile update
  const { register, login, googleLogin } = useAuth(); // We might not need all of these, but we need a way to refresh the user. Actually, reloading the page or just updating local state works too. Let's just reload the page for now if needed, or AuthContext handles it. We can just rely on the API.

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        grade: user.grade || '',
        board: user.board || '',
        subjects: user.subjects || [],
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



  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Profile Settings</h1>

      {user?.profileComplete === false && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 relative">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                Mandatory Action Required: Please complete your profile by filling in your Grade, Board, and Subjects to access the platform.
              </p>
            </div>
          </div>
        </div>
      )}

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
          const res = await axios.put('/api/users/profile', profileData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setMessage('Profile updated successfully!');
          // If profile was incomplete, forcing a reload will let PrivateRoute pass them to dashboard next time they navigate, or we can just reload here.
          if (user?.profileComplete === false && res.data.profileComplete) {
            window.location.href = '/dashboard';
          }
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
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
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
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
              onChange={(e) => setProfileData({ ...profileData, grade: e.target.value })}
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
              onChange={(e) => setProfileData({ ...profileData, board: e.target.value })}
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

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Profile
          </button>
        </div>
      </form>

      {/* Password Change Section */}
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-6">Security Settings</h2>

      {passwordMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          {passwordMessage}
        </div>
      )}

      {passwordError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {passwordError}
        </div>
      )}

      <form onSubmit={async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (newPassword !== confirmPassword) {
          setPasswordError('New passwords do not match');
          return;
        }

        try {
          await axios.put('/api/users/password', {
            currentPassword,
            newPassword
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setPasswordMessage('Password updated successfully!');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (err: any) {
          setPasswordError(err.response?.data?.message || 'Error updating password');
        }
      }} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8">

        {user?.authMethod !== 'google' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={user?.authMethod !== 'google'}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            minLength={6}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            minLength={6}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;