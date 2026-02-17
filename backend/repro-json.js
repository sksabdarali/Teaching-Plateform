require('dotenv').config();
const { extractJsonFromResponse } = require('./utils/geminiService');

const problemResponse = `\`\`\`json
{
  "title": "Study Materials: Queue in Data Structures",
  "content": "A Queue is a linear data structure that follows the First-In, First-Out (FIFO) principle. This means the first element added to the queue will be the first one to be removed. It's an Abstract Data Type (ADT) defined by its behavior rather than its specific implementation. Elements are added at the 'rear' (or 'tail') and removed from the 'front' (or 'head').\\n\\nKey operations include:\\n*   **Enqueue**: Adds an element..."
}
\`\`\``;

console.log("Testing extraction...");
try {
    const data = extractJsonFromResponse(problemResponse);
    console.log("✅ Success:", data);
} catch (e) {
    console.log("❌ Failed:", e.message);
}
