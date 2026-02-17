import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (tokenId: string) => void;
  onError?: (error: string) => void;
  text?: string;
  type?: 'login' | 'signup';
  variant?: 'outline' | 'filled' | 'minimal';
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  onError, 
  text = 'Continue with Google',
  type = 'login',
  variant = 'outline'
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google SDK if not already loaded
    const loadGoogleScript = () => {
      if (!(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleAuth;
        document.body.appendChild(script);
      } else {
        initializeGoogleAuth();
      }
    };

    const initializeGoogleAuth = () => {
      if (buttonRef.current && buttonRef.current.children.length === 0) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        // Render a custom button instead of Google's default button
        renderCustomButton();
      }
    };

    const handleGoogleResponse = (response: any) => {
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError?.('Google authentication failed');
      }
    };

    const renderCustomButton = () => {
      if (buttonRef.current) {
        // Create custom styled button
        let buttonClasses = '';
        
        switch (variant) {
          case 'filled':
            buttonClasses = `
              w-full flex items-center justify-center gap-3 
              px-4 py-3 rounded-lg
              bg-white border border-gray-300
              hover:bg-gray-50 active:bg-gray-100
              text-gray-700 font-medium
              shadow-sm hover:shadow-md
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `;
            break;
          case 'minimal':
            buttonClasses = `
              w-full flex items-center justify-center gap-3 
              px-4 py-3 rounded-lg
              bg-gray-50 hover:bg-gray-100
              text-gray-700 font-medium
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-300
            `;
            break;
          case 'outline':
          default:
            buttonClasses = `
              w-full flex items-center justify-center gap-3 
              px-4 py-3 border-2 border-gray-300 rounded-xl
              bg-white hover:bg-gray-50 hover:border-gray-400
              active:bg-gray-100
              text-gray-700 font-semibold
              shadow-sm hover:shadow-md
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `;
            break;
        }
        
        const customButton = document.createElement('button');
        customButton.className = buttonClasses.trim().replace(/\s+/g, ' ');
        
        customButton.type = 'button';
        
        // Add Google icon (SVG)
        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-5 h-5 flex-shrink-0';
        
        // Different icon styles based on variant
        let iconColor = '#4285F4';
        if (variant === 'minimal') {
          iconColor = '#5F6368';
        }
        
        iconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="${iconColor}" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        `;
        
        // Add text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textSpan.className = 'flex-grow text-center';
        
        customButton.appendChild(iconContainer);
        customButton.appendChild(textSpan);
        
        // Add click handler
        customButton.addEventListener('click', () => {
          (window as any).google.accounts.id.prompt();
        });
        
        buttonRef.current.appendChild(customButton);
      }
    };

    loadGoogleScript();

    // Cleanup - copy ref value to avoid warning
    const currentRef = buttonRef.current;
    return () => {
      if (currentRef) {
        currentRef.innerHTML = '';
      }
    };
  }, [onSuccess, onError, text, variant]);

  return <div ref={buttonRef} className="w-full" />;
};

export default GoogleSignInButton;