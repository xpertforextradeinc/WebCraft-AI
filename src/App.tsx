/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { templates } from './templates';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gemini' | 'openai'>('gemini');
  const [iframeSize, setIframeSize] = useState<'desktop' | 'mobile'>('desktop');

  const generateWebsite = async (isFollowUp = false, inputPrompt = '') => {
    setLoading(true);
    const finalPrompt = inputPrompt || (isFollowUp ? followUpPrompt : prompt);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: finalPrompt, 
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
          if (inputPrompt) setPrompt(inputPrompt);
      }
    } catch (error) {
      console.error('Error generating website:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = () => {
    // @ts-ignore
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, 
      email: 'user@example.com',
      amount: 100000, 
      plan: 'PLN_kh753o3e43u2fa3',
      onSuccess: (transaction: any) => {
        alert('Subscribed successfully! Publishing to Vercel...');
      },
      onCancel: () => {
        alert('Subscription cancelled.');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">WebCraft AI</h1>
      
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
        <button
          onClick={handlePublish}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
        >
          Publish
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Start with a template</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {templates.map((template) => (
                <button
                    key={template.name}
                    onClick={() => generateWebsite(false, template.prompt)}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 text-sm"
                >
                    {template.name}
                </button>
            ))}
        </div>
      </div>

      {generatedCode && (
        <div className="mb-6">
            <div className="flex gap-4 mb-4 items-center flex-wrap">
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
                <button onClick={() => setIframeSize('desktop')} className={`px-4 py-2 rounded-lg ${iframeSize === 'desktop' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Desktop</button>
                <button onClick={() => setIframeSize('mobile')} className={`px-4 py-2 rounded-lg ${iframeSize === 'mobile' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Mobile</button>
                <button onClick={downloadCode} className="px-4 py-2 bg-green-600 text-white rounded-lg">Download HTML</button>
                <button onClick={() => navigator.clipboard.writeText(generatedCode).then(() => alert('Code copied!'))} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Copy Code</button>
            </div>
            <iframe
                srcDoc={generatedCode}
                title="Generated Website"
                className={`w-full h-[600px] border border-gray-200 rounded-lg bg-white transition-all duration-300 ${iframeSize === 'mobile' ? 'max-w-[375px] mx-auto' : 'max-w-full'}`}
            />
        </div>
      )}
    </div>
  );
}
