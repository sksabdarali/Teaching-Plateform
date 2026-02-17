import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const isLoggedIn = !!token;
  
  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">AI Teaching Platform</Link>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link 
                to="/dashboard" 
                className={`hidden md:block px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-500 hover:bg-opacity-75'}`}
              >
                Dashboard
              </Link>
              
              {/* Profile dropdown with navigation items */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
                  onClick={toggleDropdown}
                >
                  <span>{user?.name || 'User'}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-md shadow-lg py-2 z-50 max-h-96 overflow-y-auto"
                    style={{ maxHeight: 'calc(100vh - 100px)' }} /* Adjust based on navbar height */
                  >
                    <Link 
                      to="/dashboard" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/dashboard' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/syllabus" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/syllabus' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Syllabus
                    </Link>
                    <Link 
                      to="/study-materials" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/study-materials' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Study Materials
                    </Link>
                    <Link 
                      to="/quiz" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/quiz' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Quizzes
                    </Link>
                    <Link 
                      to="/progress" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/progress' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Progress
                    </Link>
                    <Link 
                      to="/timetable" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/timetable' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Timetable
                    </Link>
                    <Link 
                      to="/profile" 
                      className={`block px-4 py-2 hover:bg-gray-100 ${location.pathname === '/profile' ? 'bg-blue-100 font-medium' : ''}`}
                      onClick={closeDropdown}
                    >
                      Profile Settings
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!isLoggedIn && (
                <>
                  <Link to="/login" className="hover:underline">Login</Link>
                  <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">Sign Up</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;