import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

interface ChatMessage {
    id: string;
    role: 'user' | 'mentor';
    content: string;
    timestamp: string;
}

const AIMentor: React.FC = () => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSuggestions = useCallback(async () => {
        try {
            const res = await axios.post('/api/mentor/suggest-topics',
                { subject: selectedSubject || undefined },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuggestions(res.data.suggestions || []);
        } catch {
            setSuggestions([
                'Explain a difficult concept to me',
                'Help me solve a math problem',
                'What study techniques work best?',
                'Quiz me on a topic',
                'Explain something in simple terms',
                'Help me prepare for an exam'
            ]);
        }
    }, [token, selectedSubject]);

    useEffect(() => {
        if (token) {
            fetchSuggestions();
        }
    }, [token, fetchSuggestions]);

    const sendMessage = async (messageText?: string) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const conversationHistory = [...messages, userMsg].map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));

            const res = await axios.post('/api/mentor/chat',
                {
                    message: text,
                    conversationHistory,
                    subject: selectedSubject || undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const mentorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mentor',
                content: res.data.reply,
                timestamp: res.data.timestamp
            };

            setMessages(prev => [...prev, mentorMsg]);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to get response. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError('');
    };

    // Simple markdown-like rendering
    const renderContent = (text: string) => {
        // Process markdown-like formatting
        let html = text
            // Code blocks
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
            // Headers
            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
            // Bullet points
            .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
            // Numbered lists
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p class="mb-2">')
            .replace(/\n/g, '<br/>');

        // Wrap consecutive list items
        html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*(?:<br\/>)?\s*)+)/g, '<ul class="my-2 space-y-1">$1</ul>');

        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }} />;
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-xl p-5 mb-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                            🧠
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">AI Mentor</h1>
                            <p className="text-purple-100 text-sm">Your personal study companion — ask anything!</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Subject filter */}
                        {user?.subjects && user.subjects.length > 0 && (
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            >
                                <option value="" className="text-gray-800">All Subjects</option>
                                {user.subjects.map((subj, idx) => (
                                    <option key={idx} value={subj} className="text-gray-800">{subj}</option>
                                ))}
                            </select>
                        )}
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="text-white text-opacity-80 hover:text-opacity-100 text-sm bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1.5 rounded-lg transition-all"
                            >
                                Clear Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
                    {/* Welcome message when empty */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="text-6xl mb-4">👋</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Hey{user?.name ? `, ${user.name}` : ''}! I'm your AI Mentor
                            </h2>
                            <p className="text-gray-500 mb-6 max-w-md">
                                I'm here to help you understand concepts, solve problems, and guide your learning journey. Ask me anything!
                            </p>

                            {/* Suggestion chips */}
                            {suggestions.length > 0 && (
                                <div className="w-full max-w-xl">
                                    <p className="text-sm text-gray-400 mb-3">Try asking:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {suggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(suggestion)}
                                                className="text-left px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-lg text-sm transition-all border border-indigo-100 hover:border-indigo-200 hover:shadow-sm"
                                            >
                                                💡 {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                <div className="flex items-end gap-2">
                                    {msg.role === 'mentor' && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md">
                                            🧠
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                                                : 'bg-gray-50 text-gray-800 rounded-bl-md border border-gray-100'
                                            }`}
                                    >
                                        {msg.role === 'mentor' ? renderContent(msg.content) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md">
                                            {user?.name?.[0]?.toUpperCase() || '👤'}
                                        </div>
                                    )}
                                </div>
                                <div className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right mr-10' : 'ml-10'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex items-end gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md">
                                    🧠
                                </div>
                                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                                    <div className="flex space-x-1.5">
                                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex justify-center">
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold ml-2">×</button>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="flex gap-3 items-end">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your mentor anything... (Shift+Enter for new line)"
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm bg-white shadow-sm"
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = '44px';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                            disabled={loading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIMentor;
