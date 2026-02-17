# Loading Animation Implementation

## Overview
I've implemented a comprehensive loading animation system for your teaching platform with both global and component-level loading states.

## Features Implemented

### 1. Global Loading Context
- **File**: `frontend/src/context/LoadingContext.tsx`
- Provides application-wide loading state management
- Shows fullscreen loading overlay when `showLoading()` is called
- Automatically hides when `hideLoading()` is called

### 2. Reusable Loading Spinner Component
- **File**: `frontend/src/components/LoadingSpinner.tsx`
- Customizable spinner with different sizes (sm, md, lg)
- Can be used as fullscreen overlay or inline component
- Configurable message text

### 3. Integration with Existing Pages
- Updated Dashboard, Syllabus, and Quiz pages to use the new loading system
- Removed individual loading states in favor of global loading context
- Consistent loading experience across the application

### 4. Demo Page
- **File**: `frontend/src/pages/LoadingDemo.tsx`
- Demonstrates the loading animation in action
- Accessible at `/loading-demo` route (requires authentication)

## How to Use

### Using Global Loading (Recommended)
```javascript
import { useLoading } from '../context/LoadingContext';

const MyComponent = () => {
  const { showLoading, hideLoading } = useLoading();

  const handleAsyncOperation = async () => {
    showLoading();
    try {
      // Your async operation here
      await someApiCall();
    } finally {
      hideLoading();
    }
  };

  return (
    <button onClick={handleAsyncOperation}>
      Perform Action
    </button>
  );
};
```

### Using Loading Spinner Component Directly
```javascript
import LoadingSpinner from '../components/LoadingSpinner';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {loading && <LoadingSpinner message="Processing..." />}
      <button onClick={() => setLoading(true)}>
        Show Loading
      </button>
    </div>
  );
};
```

## Customization Options

### LoadingSpinner Props
- `fullScreen`: boolean - Cover entire screen (default: false)
- `message`: string - Loading message text (default: "Loading...")
- `size`: 'sm' | 'md' | 'lg' - Spinner size (default: 'md')

### Styling
The loading spinner uses Tailwind CSS classes and can be easily customized by modifying the component:
- Color: Change `border-t-blue-500` and `border-r-blue-500` to your preferred colors
- Size: Modify the height and width classes
- Animation: The `animate-spin` class provides the rotation animation

## Testing
1. Start your frontend application
2. Navigate to `/loading-demo` (requires login)
3. Click "Show Global Loading" to see the fullscreen animation
4. The loading overlay will automatically disappear after 3 seconds

## Benefits
- **Consistent UX**: Uniform loading experience across all pages
- **Easy Integration**: Simple hook-based API
- **Flexible**: Can be used globally or per-component
- **Customizable**: Easy to modify appearance and behavior
- **Performance**: No unnecessary re-renders when loading state changes

The loading animation will now appear whenever any page performs async operations, providing visual feedback to users during data fetching and processing.