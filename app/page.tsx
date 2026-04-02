"use client" 
import { useState } from "react";

export default function Home() {
  return (

      <HelloDemoClient />
 
  );
}

function HelloDemoClient() {
  'use client';
  const [resp, setResp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function callGet() {
    setLoading(true);
    try {
      const r = await fetch('/api/user');
      const j = await r.json();
      setResp(JSON.stringify(j, null, 2));
    } catch (e) {
      setResp('Error: ' + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <button
        onClick={callGet}
        className="rounded bg-blue-600 px-4 py-2 text-white"
        disabled={loading}
      >
        {loading ? 'Calling...' : 'Call /api/user'}
      </button>
      <pre className="max-w-md break-words bg-gray-100 text-black p-3">{resp ?? 'No response yet'}</pre>
    </div>
  );
}
