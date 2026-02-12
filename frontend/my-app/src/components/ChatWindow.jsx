'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatWindow({
  messages,
  currentUser,
  onSendMessage,
  room,
  typingUsers,
  onTyping,
  onMarkAsRead
}) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!messages.length || !onMarkAsRead) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const senderId = entry.target.getAttribute('data-sender-id');
            if (messageId && senderId !== currentUser) {
              onMarkAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [messages, currentUser, onMarkAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    let fileUrl = null;
    let fileType = 'text';

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          'http://localhost:5001/api/chatfiles/upload',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        fileUrl = res.data.url;
        fileType = selectedFile.type.startsWith('image/')
          ? 'image'
          : 'file';
      } catch (error) {
        console.error('Upload failed:', error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSendMessage(input, fileUrl, fileType);
    setInput('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-sky-200 via-pink-100 to-orange-100 flex justify-center items-center p-4">
      <div className="w-full max-w-4xl h-[95vh] bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/30">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((msg) => {
            if (!msg || !msg.sender || !msg.sender._id) return null;
            const isOwn = msg.sender._id === currentUser;

            return (
              <div
                key={msg._id}
                data-message-id={msg._id}
                data-sender-id={msg.sender._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className="max-w-[70%] flex flex-col">

                  {!isOwn && (
                    <span className="text-xs font-semibold text-gray-500 mb-1 ml-2">
                      {msg.sender.name}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md transition-all duration-300 hover:scale-[1.02] ${
                      isOwn
                        ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-700 rounded-bl-sm border border-pink-100'
                    }`}
                  >
                    {msg.fileType === 'image' && msg.fileUrl && (
                      <img
                        src={msg.fileUrl}
                        alt="attachment"
                        className="max-w-xs rounded-xl mb-2"
                      />
                    )}

                    {msg.fileType === 'file' && msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mb-2 bg-pink-50 px-3 py-2 rounded-lg hover:bg-pink-100 transition"
                      >
                        <svg className="w-5 h-5"color='gray' fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l8.49-8.49a3 3 0 114.24 4.24L10.34 16.5a1 1 0 01-1.41-1.41l7.07-7.07" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">Download File</span>
                      </a>
                    )}

                    {msg.content && (
                      <p className="text-[15px] break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}

                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      isOwn ? 'text-white/80' : 'text-gray-400'
                    }`}>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>

                      {isOwn && msg.readBy && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing */}
          {typingUsers && typingUsers.size > 0 && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-md border border-pink-100 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-300"></span>
                </div>
                <span className="text-sm text-gray-500">
                  {Array.from(typingUsers.values()).join(', ')} typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="px-6 py-3 bg-white border-t border-pink-100">
            <div className="flex items-center gap-3 bg-pink-50 p-3 rounded-xl">
              <span className="text-sm font-medium truncate flex-1">
                {selectedFile.name}
              </span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white/70 backdrop-blur-xl border-t border-pink-100">
          <div className="flex items-center gap-3 bg-white rounded-full shadow-lg px-3 py-2 border border-pink-100 focus-within:border-sky-300 transition">

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-br from-sky-400 to-blue-200 text-white p-3 rounded-full hover:scale-105 transition"
              disabled={uploading}
            >
             <svg className="w-5 h-5"color='gray' fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l8.49-8.49a3 3 0 114.24 4.24L10.34 16.5a1 1 0 01-1.41-1.41l7.07-7.07" />
                        </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                onTyping(true);
              }}
              onBlur={() => onTyping(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-3 py-2 focus:outline-none text-gray-700"
              disabled={uploading}
            />

            <button
              onClick={handleSend}
              disabled={uploading || (!input.trim() && !selectedFile)}
              className="bg-gradient-to-r from-orange-400 via-pink-400 to-sky-400 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
