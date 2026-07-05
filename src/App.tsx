/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gemini' | 'openai'>('gemini');

  const generateWebsite = async (isFollowUp = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: isFollowUp ? followUpPrompt : prompt, 
            existingCode: isFollowUp ? generatedCode : null,
            model 
        }),
      });
      const data = await response.json();
      if (isFollowUp) {
          setGeneratedCode(data.code);
          setFollowUpPrompt('');
      } else {
          setGeneratedCode(data.code);
      }
    } catch (error) {
      console.error('Error generating website:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">AI Website Generator</h1>
      <div className="flex gap-4 mb-6">
        <select value={model} onChange={(e) => setModel(e.target.value as 'gemini' | 'openai')} className="p-3 border border-gray-300 rounded-lg">
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
        </select>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your website..."
          className="flex-grow p-3 border border-gray-300 rounded-lg"
        />
        <button
          onClick={() => generateWebsite()}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {generatedCode && (
        <div className="mb-6">
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    placeholder="Follow-up prompt (e.g., Change hero to blue)..."
                    className="flex-grow p-3 border border-gray-300 rounded-lg"
                />
                <button
                    onClick={() => generateWebsite(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300"
                >
                    Update
                </button>
            </div>
            <iframe
                srcDoc={generatedCode}
                title="Generated Website"
                className="w-full h-[600px] border border-gray-200 rounded-lg bg-white"
            />
        </div>
      )}
    </div>
  );
}
