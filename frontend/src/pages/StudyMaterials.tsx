import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLoading } from '../context/LoadingContext';
import axios from 'axios';

interface Example {
  problem: string;
  solution: string;
}

interface PracticeProblem {
  problem: string;
  solution: string;
}

interface StudyMaterial {
  title: string;
  content: string;
  examples: Example[];
  practiceProblems: PracticeProblem[];
  keyPoints: string[];
  studyTips: string[];
  relatedTopics: string[];
}

const StudyMaterialsPage: React.FC = () => {
  const { token } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [syllabusId, setSyllabusId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<StudyMaterial | null>(null);
  const [syllabi, setSyllabi] = useState<any[]>([]);

  // Fetch user's syllabi on component load
  React.useEffect(() => {
    const fetchSyllabi = async () => {
      try {
        const response = await axios.get('/api/syllabi', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSyllabi(response.data);
      } catch (err) {
        console.error('Error fetching syllabi:', err);
      }
    };

    if (token) {
      fetchSyllabi();
    }
  }, [token]);

  const generateStudyMaterials = async () => {
    if (!subject || !topic) {
      setError('Please enter both subject and topic');
      return;
    }

    setLoading(true);
    setError('');
    showLoading();
    setMaterials(null);

    try {
      const response = await axios.post('/api/ai/generate-study-materials', {
        subject,
        topic,
        syllabusId: syllabusId || undefined
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'json' // Explicitly set response type
      });

      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);

      setMaterials(response.data);
    } catch (err: any) {
      console.error('Error generating study materials:', err);
      setError(err.response?.data?.message || 'Error generating study materials');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const downloadStudyMaterials = (materials: StudyMaterial) => {
    // Create a formatted text content
    let content = `STUDY MATERIALS\n\n`;
    content += `Title: ${materials.title}\n\n`;
    content += `CONTENT:\n${materials.content}\n\n`;

    if (materials.examples && materials.examples.length > 0) {
      content += `EXAMPLES WITH SOLUTIONS:\n\n`;
      materials.examples.forEach((example, index) => {
        content += `Example ${index + 1}:\n`;
        content += `Problem: ${example.problem}\n`;
        content += `Solution: ${example.solution}\n\n`;
      });
    }

    if (materials.practiceProblems && materials.practiceProblems.length > 0) {
      content += `PRACTICE PROBLEMS WITH SOLUTIONS:\n\n`;
      materials.practiceProblems.forEach((problem, index) => {
        content += `Problem ${index + 1}:\n`;
        content += `Question: ${problem.problem}\n`;
        content += `Solution: ${problem.solution}\n\n`;
      });
    }

    if (materials.keyPoints && materials.keyPoints.length > 0) {
      content += `KEY POINTS TO REMEMBER:\n`;
      materials.keyPoints.forEach(point => {
        content += `- ${point}\n`;
      });
      content += '\n';
    }

    if (materials.studyTips && materials.studyTips.length > 0) {
      content += `STUDY TIPS:\n`;
      materials.studyTips.forEach(tip => {
        content += `- ${tip}\n`;
      });
      content += '\n';
    }

    if (materials.relatedTopics && materials.relatedTopics.length > 0) {
      content += `RELATED TOPICS:\n`;
      materials.relatedTopics.forEach(topic => {
        content += `- ${topic}\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${materials.title.replace(/[^a-zA-Z0-9]/g, '_')}_Study_Materials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Study Materials</h1>

      {/* Generate Study Materials Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Study Materials</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              placeholder="e.g., Algebra"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Use Specific Syllabus (Optional)</label>
          <select
            value={syllabusId}
            onChange={(e) => setSyllabusId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            <option value="">Use all my syllabi</option>
            {syllabi.map(syllabus => (
              <option key={syllabus._id} value={syllabus._id}>
                {syllabus.title} ({syllabus.subject})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <button
          onClick={generateStudyMaterials}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="relative w-8 h-6 mr-3">
                {/* Book pages animation */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 h-full bg-white rounded-l-sm"></div>
                  <div className="w-1/2 h-full bg-white rounded-r-sm transform origin-left animate-book-page"></div>
                </div>
                {/* Book spine */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>
              </div>
              Generating Study Materials...
            </>
          ) : (
            'Generate Study Materials'
          )}
        </button>
      </div>

      {/* Display Study Materials */}
      {materials && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{materials.title}</h2>

          <div className="prose max-w-none mb-6">
            {materials.content.split('\n').map((line: string, i: number) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={i} />;
              // Render markdown-style headings
              if (trimmed.startsWith('### ')) return <h4 key={i} className="text-lg font-semibold text-gray-800 mt-3 mb-1">{trimmed.slice(4)}</h4>;
              if (trimmed.startsWith('## ')) return <h3 key={i} className="text-xl font-semibold text-gray-800 mt-4 mb-1">{trimmed.slice(3)}</h3>;
              if (trimmed.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold text-gray-800 mt-4 mb-2">{trimmed.slice(2)}</h2>;
              // Render bold text wrapped in ** **
              const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className="text-gray-700 mb-2">
                  {parts.map((part: string, j: number) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              );
            })}
          </div>

          {materials.examples && materials.examples.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Examples</h3>
              <div className="space-y-4">
                {materials.examples.map((example, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                    <p className="font-medium text-gray-800 mb-1">Example {index + 1}:</p>
                    <p className="text-gray-700 mb-2"><strong>Problem:</strong> {example.problem}</p>
                    <p className="text-gray-700"><strong>Solution:</strong> {example.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {materials.keyPoints && materials.keyPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Key Points to Remember</h3>
              <ul className="list-disc pl-5 space-y-2">
                {materials.keyPoints.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {materials.studyTips && materials.studyTips.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Study Tips</h3>
              <ul className="list-disc pl-5 space-y-2">
                {materials.studyTips.map((tip, index) => (
                  <li key={index} className="text-gray-700">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {materials.practiceProblems && materials.practiceProblems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Practice Problems</h3>
              <div className="space-y-4">
                {materials.practiceProblems.map((problem, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded">
                    <p className="font-medium text-gray-800 mb-1">Problem {index + 1}:</p>
                    <p className="text-gray-700 mb-2"><strong>Question:</strong> {problem.problem}</p>
                    <p className="text-gray-700"><strong>Solution:</strong> {problem.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {materials.relatedTopics && materials.relatedTopics.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {materials.relatedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => downloadStudyMaterials(materials)}
              className="w-full bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Study Materials
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialsPage;