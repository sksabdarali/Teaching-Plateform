# Google Gemini API Setup Guide

This document explains how to set up and configure the Google Gemini API for the Teaching Platform application.

## Prerequisites

- Google Account
- Access to Google AI Studio or Google Cloud Console
- Node.js and npm installed

## Getting Started

### 1. Obtain Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google Account
3. Click on "Get API Key" or navigate to "API Keys" section
4. Create a new API key or use an existing one
5. Copy your API key (format: `AIzaSy...`)

### 2. Configure Environment Variables

Create or update your `.env` file in the backend directory:

```bash
GEMINI_API_KEY=your_actual_api_key_here
MONGODB_URI=mongodb://localhost:27017/teaching-platform
JWT_SECRET=your_jwt_secret
PORT=5000
```

Replace `your_actual_api_key_here` with your actual Gemini API key.

### 3. Install Dependencies

In your project root directory:

```bash
npm install @google/generative-ai
```

### 4. Enable the Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Gemini API" or "Generative Language API"
5. Click "Enable" to enable the API for your project

## API Models Available

The application uses the following models in order of preference:

1. `gemini-2.0-flash` (Default, fastest response)
2. `gemini-2.5-pro`
3. `gemini-2.0-flash-exp`
4. `gemini-1.5-flash`
5. `gemini-1.5-pro`
6. `gemini-2.5-flash`
7. `gemini-pro`

## Free Tier Limitations

The free tier of the Gemini API has the following limitations:

- **Rate Limits**: Limited requests per minute and per day
- **Token Limits**: Limited input tokens per request and per minute
- **Model Availability**: Some advanced models may not be available in the free tier

## Enabling Billing for Higher Limits

If you encounter rate limiting errors (`429 Too Many Requests`), you may need to enable billing:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "Billing" in the left sidebar
3. Set up a payment method
4. Link your billing account to your project
5. Enable billing for the Generative Language API

With billing enabled, you get higher quotas and access to more models.

## Troubleshooting Common Issues

### 1. "429 Too Many Requests" Error
- **Cause**: API quota exceeded
- **Solution**: Wait for quota to reset (typically 1-24 hours for free tier) or enable billing

### 2. "404 Model Not Found" Error
- **Cause**: Model not available with your API key or billing not enabled
- **Solution**: Verify the model name and check if billing is enabled for your project

### 3. "403 Forbidden" Error
- **Cause**: Invalid API key or API not enabled
- **Solution**: Verify your API key and ensure the Generative Language API is enabled

### 4. JSON Parsing Errors
- **Cause**: AI response format issues
- **Solution**: The application has built-in JSON parsing with error recovery for common formatting issues

## Monitoring Usage

Monitor your current usage at: https://ai.dev/usage?tab=rate-limit

## API Key Security

- Never commit your API key to version control
- Store it securely in environment variables
- Rotate your API key periodically for security
- Restrict API key usage to specific IP addresses if possible

## Testing the API

You can test your API key with the following command:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "contents": [{
    "parts": [{
      "text": "Hello, world!"
    }]
  }]
}'
```

## Application Integration

The application integrates with Gemini API in the following ways:

- **Quiz Generation**: Creates multiple-choice questions based on topics
- **Learning Content**: Generates educational material for subjects and topics
- **Study Materials**: Creates comprehensive study guides from syllabus content
- **Personalized Timetables**: Builds customized study schedules
- **Motivational Content**: Generates encouraging messages for students
- **Concept Explanations**: Provides detailed explanations for difficult topics

All these features use the same Gemini API key configured in your environment.

## Error Handling

The application provides detailed error messages for different scenarios:

- **API quota exceeded**: Shows "API quota exceeded. Please check your Google AI Studio usage limits and try again later."
- **Service unavailable**: Shows "Service temporarily unavailable. The AI model may be overloaded. Please try again later."
- **General errors**: Shows the underlying error message for debugging

## Support

For issues with the API itself, visit the [Google AI documentation](https://ai.google.dev/docs).

For application-specific issues, refer to the project documentation or contact the development team.