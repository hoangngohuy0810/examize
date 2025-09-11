'use client'

import { saveData } from './actions';
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveData({ message });
    setResponse(res);
    setMessage('');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">Save Data to Firestore</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message
            </label>
            <input
              id="message"
              name="message"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Data
          </button>
        </form>
        {response && (
          <div className="mt-4 p-4 text-sm text-left bg-gray-200 rounded-md">
            <p className={`font-semibold ${response.success ? 'text-green-600' : 'text-red-600'}`}>
              {response.success ? 'Success!' : 'Error'}
            </p>
            <pre className="mt-2 text-gray-800">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
