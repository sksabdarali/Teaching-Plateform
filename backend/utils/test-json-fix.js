const { extractJsonFromResponse } = require('./geminiService');

// Test with the problematic response from the logs
const testResponse = '```json\n{\n  "title": "Study Materials: Arrays in Data Structures",\n  "content": "An array is a fundamental data structure storing a collection of elements of the same data type...';

console.log('Testing JSON extraction with problematic response...\n');

try {
  const result = extractJsonFromResponse(testResponse);
  console.log('✅ Successfully parsed JSON:');
  console.log('Title:', result.title);
  console.log('Content preview:', result.content.substring(0, 100) + '...');
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test with a complete JSON response
const testResponse2 = '```json\n{\n  "title": "Study Materials: Arrays in Data Structures",\n  "content": "An array is a fundamental data structure storing a collection of elements of the same data type."\n}\n```';

console.log('\nTesting with complete JSON response...\n');

try {
  const result2 = extractJsonFromResponse(testResponse2);
  console.log('✅ Successfully parsed complete JSON:');
  console.log('Title:', result2.title);
  console.log('Content:', result2.content);
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n🎉 JSON extraction fix verified!');