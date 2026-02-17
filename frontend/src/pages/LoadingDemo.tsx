import React from 'react';
import { useLoading } from '../context/LoadingContext';

const LoadingDemo: React.FC = () => {
  const { showLoading, hideLoading, isLoading } = useLoading();

  const simulateLoading = () => {
    showLoading();
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Loading Animation Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Global Loading Demo</h2>
        <p className="text-gray-600 mb-4">
          Click the button below to see the global loading animation in action.
          The loading spinner will cover the entire screen for 3 seconds.
        </p>
        <button
          onClick={simulateLoading}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Show Global Loading'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Loading Spinner Component</h2>
        <p className="text-gray-600 mb-4">
          You can also use the LoadingSpinner component directly in your components.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">Small Spinner</h3>
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">Medium Spinner</h3>
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">Large Spinner</h3>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;