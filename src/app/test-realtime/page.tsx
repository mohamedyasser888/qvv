'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestRealtimePage() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<string>('Not connected')
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const channel = supabase.channel('test-channel', {
      config: { broadcast: { self: true } },
    })

    channel
      .on('broadcast', { event: 'test' }, ({ payload }) => {
        console.log('📡 Received:', payload)
        setMessages(prev => [...prev, `Received: ${JSON.stringify(payload)}`])
      })
      .subscribe((status) => {
        console.log('📊 Channel status:', status)
        setStatus(status)
        if (status === 'SUBSCRIBED') {
          setMessages(prev => [...prev, '✅ Successfully connected to realtime'])
        }
      })

    return () => {
      console.log('🔌 Cleaning up channel')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const sendMessage = () => {
    if (!input.trim()) return
    const message = { text: input, timestamp: Date.now() }
    console.log('📤 Sending:', message)
    supabase.channel('test-channel').send({
      type: 'broadcast',
      event: 'test',
      payload: message,
    })
    setMessages(prev => [...prev, `Sent: ${input}`])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Realtime Test Page</h1>
        
        <div className="mb-4 p-4 bg-slate-900 rounded">
          <p className="text-sm">
            <strong>Status:</strong>{' '}
            <span className={status === 'SUBSCRIBED' ? 'text-green-400' : 'text-yellow-400'}>
              {status}
            </span>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">
            Open this page in two different browsers (Chrome & Edge) and send messages.
            If realtime is working, you'll see messages appear in both browsers.
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold"
          >
            Send
          </button>
        </div>

        <div className="bg-slate-900 rounded p-4 max-h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Messages:</h2>
          {messages.length === 0 ? (
            <p className="text-slate-500 italic">No messages yet</p>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, idx) => (
                <div key={idx} className="text-sm font-mono">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-slate-900 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
            <li>Open this page in Chrome: <code className="bg-slate-800 px-1">http://localhost:3000/test-realtime</code></li>
            <li>Open this page in Edge: <code className="bg-slate-800 px-1">http://localhost:3000/test-realtime</code></li>
            <li>Type a message in one browser and click Send</li>
            <li>You should see it appear in BOTH browsers</li>
            <li>Check the browser console (F12) for detailed logs</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
            <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ If messages don't appear:</p>
            <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
              <li>Realtime may not be enabled in Supabase Dashboard</li>
              <li>Run migration 024_enable_realtime.sql</li>
              <li>Check Supabase Dashboard → Database → Replication</li>
              <li>Make sure you're logged in (auth is required)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
