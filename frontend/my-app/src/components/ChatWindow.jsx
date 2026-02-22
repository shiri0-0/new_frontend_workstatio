'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatWindow({ messages, currentUser, onSendMessage, room, typingUsers, onTyping, onMarkAsRead }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!messages.length || !onMarkAsRead) return;
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          const senderId = entry.target.getAttribute('data-sender-id');
          if (messageId && senderId !== currentUser) onMarkAsRead(messageId);
        }
      }),
      { threshold: 0.5 }
    );
    document.querySelectorAll('[data-message-id]').forEach(el => observerRef.current.observe(el));
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [messages, currentUser, onMarkAsRead]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    let fileUrl = null, fileType = 'text';
    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:5001/api/chatfiles/upload', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = res.data.url;
        fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      } catch (e) { console.error(e); setUploading(false); return; }
      setUploading(false);
    }
    await onSendMessage(input, fileUrl, fileType);
    setInput(''); setSelectedFile(null);
  };

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
        {messages.map((msg) => {
          if (!msg?.sender?._id) return null;
          const isOwn = msg.sender._id === currentUser;
          return (
            <div
              key={msg._id}
              data-message-id={msg._id}
              data-sender-id={msg.sender._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'msgIn 0.2s ease-out' }}
            >
              <div className={`flex flex-col max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-[11px] font-bold text-rose-500 mb-1 ml-1">{msg.sender.name}</span>
                )}
                <div className={`rounded-2xl px-4 py-2.5 shadow-md ${
                  isOwn
                    ? 'text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-rose-200 shadow-sm'
                }`}
                  style={isOwn ? { background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' } : {}}
                >
                  {msg.fileType === 'image' && msg.fileUrl && (
                    <img src={msg.fileUrl} alt="attachment" className="max-w-xs rounded-xl mb-2 shadow" />
                  )}
                  {msg.fileType === 'file' && msg.fileUrl && (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl transition ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-sky-50 hover:bg-sky-100 text-sky-600'}`}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm font-medium">Download File</span>
                    </a>
                  )}
                  {msg.content && <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>}
                  <div className={`flex items-center gap-1 mt-1 text-[11px] ${isOwn ? 'text-white/60 justify-end' : 'text-gray-400'}`}>
                    <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    {isOwn && msg.readBy?.length > 0 && (
                      <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers?.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-white border border-rose-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 shadow-sm">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="text-xs text-gray-500 ml-1">{Array.from(typingUsers.values()).join(', ')} typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {selectedFile && (
        <div className="mx-4 mb-2 flex items-center gap-3 bg-orange-100 border border-orange-300 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm text-orange-700 font-semibold truncate flex-1">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="text-orange-400 hover:text-red-500 transition">✕</button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(244,114,182,0.3)' }}>
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-lg px-3 py-2 border-2 border-rose-200 focus-within:border-sky-400 transition">
          <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files[0]; if (f) setSelectedFile(f); }} className="hidden" />

          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-500 transition flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text" value={input}
            onChange={(e) => { setInput(e.target.value); onTyping(true); }}
            onBlur={() => onTyping(false)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 bg-transparent px-2 py-1.5 text-[14.5px] text-gray-800 placeholder-gray-400 focus:outline-none"
          />

          <button
            onClick={handleSend}
            disabled={uploading || (!input.trim() && !selectedFile)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #e8508a)' }}
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}