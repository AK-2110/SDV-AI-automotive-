'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, FileText, Layout, Code, CheckCircle, Loader2, FlaskConical } from 'lucide-react';

export default function GenAIStudio() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('req');

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-6">
            <header className="flex items-center gap-4 pb-6 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="font-bold">AI</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold">GenAI Code Studio</h1>
                    <p className="text-zinc-400 text-sm">Automotive Service Generator</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                {/* Input Panel */}
                <div className="col-span-1 bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Send size={18} className="text-blue-400" /> Input Requirement
                    </h2>
                    <textarea
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 resize-none focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                        placeholder="Describe the vehicle service (e.g., 'Battery Management System monitoring SoC and Range')"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className="mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Generate Solution'}
                    </button>
                </div>

                {/* Output Panel */}
                <div className="col-span-1 lg:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-zinc-800 bg-zinc-950/50">
                        <button
                            onClick={() => setActiveTab('req')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'req' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <FileText size={16} /> Requirements
                        </button>
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Layout size={16} /> SoA Design
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'code' ? 'text-green-400 border-b-2 border-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Code size={16} /> Generated Code
                        </button>
                        <button
                            onClick={() => setActiveTab('test')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'test' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <FlaskConical size={16} /> Test Cases
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-auto bg-[#0d0d0d]">
                        {!result && !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Layout size={48} className="mb-4 opacity-20" />
                                <p>Enter a prompt to generate artifacts</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-full flex flex-col items-center justify-center text-blue-400">
                                <Loader2 size={48} className="animate-spin mb-4" />
                                <p className="animate-pulse">Analyzing Requirements...</p>
                            </div>
                        )}

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {activeTab === 'req' && (
                                    <div className="space-y-2">
                                        {result.requirements.map((req: string, i: number) => (
                                            <div key={i} className="p-3 bg-zinc-800/50 rounded border border-zinc-800 flex gap-3">
                                                <CheckCircle size={16} className="text-green-500 mt-1 shrink-0" />
                                                <span className="text-zinc-300 text-sm">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'design' && (
                                    <div className="p-4 rounded border border-zinc-800 bg-zinc-900 font-mono text-sm text-purple-300">
                                        <pre>{JSON.stringify(result.design, null, 2)}</pre>
                                    </div>
                                )}

                                {activeTab === 'code' && (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 text-xs text-zinc-500">C++ / Rust</div>
                                        <pre className="p-4 rounded border border-zinc-800 bg-[#000] text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed">
                                            {result.code}
                                        </pre>
                                    </div>
                                )}

                                {activeTab === 'test' && (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 text-xs text-zinc-500">GoogleTest / FDA</div>
                                        <pre className="p-4 rounded border border-zinc-800 bg-[#000] text-green-300/80 font-mono text-xs overflow-x-auto leading-relaxed">
                                            {result.test_cases}
                                        </pre>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
