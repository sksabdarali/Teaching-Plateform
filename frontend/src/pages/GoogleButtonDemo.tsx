import React from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton';

const GoogleButtonDemo: React.FC = () => {
  const handleSuccess = (tokenId: string) => {
    console.log('Google Sign-In Success:', tokenId);
    alert('Google Sign-In successful! Check console for token.');
  };

  const handleError = (error: string) => {
    console.error('Google Sign-In Error:', error);
    alert('Google Sign-In failed: ' + error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Google Sign-In Button Demo
          </h1>
          <p className="text-gray-600">
            Modern, customizable Google Sign-In buttons with different styles
          </p>
        </div>

        <div className="space-y-12">
          {/* Outline Variant */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Outline Style (Default)</h2>
            <div className="max-w-md mx-auto">
              <GoogleSignInButton 
                onSuccess={handleSuccess}
                onError={handleError}
                text="Continue with Google"
                variant="outline"
              />
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Clean border with hover effects and subtle shadow
            </div>
          </div>

          {/* Filled Variant */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Filled Style</h2>
            <div className="max-w-md mx-auto">
              <GoogleSignInButton 
                onSuccess={handleSuccess}
                onError={handleError}
                text="Sign in with Google"
                variant="filled"
              />
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Solid background with border, clean and professional look
            </div>
          </div>

          {/* Minimal Variant */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Minimal Style</h2>
            <div className="max-w-md mx-auto">
              <GoogleSignInButton 
                onSuccess={handleSuccess}
                onError={handleError}
                text="Google Sign-In"
                variant="minimal"
              />
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
                Subtle background with muted colors, perfect for minimalist designs
            </div>
          </div>

          {/* Comparison Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">All Variants Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="mb-4">
                  <GoogleSignInButton 
                    onSuccess={handleSuccess}
                    onError={handleError}
                    text="Outline"
                    variant="outline"
                  />
                </div>
                <div className="text-sm font-medium text-gray-700">Outline</div>
                <div className="text-xs text-gray-500 mt-1">Border-focused design</div>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <GoogleSignInButton 
                    onSuccess={handleSuccess}
                    onError={handleError}
                    text="Filled"
                    variant="filled"
                  />
                </div>
                <div className="text-sm font-medium text-gray-700">Filled</div>
                <div className="text-xs text-gray-500 mt-1">Solid background</div>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <GoogleSignInButton 
                    onSuccess={handleSuccess}
                    onError={handleError}
                    text="Minimal"
                    variant="minimal"
                  />
                </div>
                <div className="text-sm font-medium text-gray-700">Minimal</div>
                <div className="text-xs text-gray-500 mt-1">Subtle design</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Modern Design</h3>
                  <p className="text-gray-600 text-sm mt-1">Clean, contemporary styling that matches modern UI standards</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Multiple Variants</h3>
                  <p className="text-gray-600 text-sm mt-1">Choose from outline, filled, or minimal styles to match your design</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Smooth Animations</h3>
                  <p className="text-gray-600 text-sm mt-1">Subtle hover effects and transitions for enhanced user experience</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Fully Responsive</h3>
                  <p className="text-gray-600 text-sm mt-1">Works perfectly on all device sizes and screen resolutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleButtonDemo;