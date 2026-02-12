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
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto mark as read
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
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, currentUser, onMarkAsRead]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
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
        fileType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
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
    <div className="flex flex-col h-full bg-gradient-to-br from-sky-100 via-blue-50 to-orange-50">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto'
        }}
      >
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
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && (
                  <span className="text-xs font-semibold text-gray-600 mb-1 ml-3">
                    {msg.sender.name}
                  </span>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
                    isOwn
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                      : 'bg-white/90 text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {msg.fileType === 'image' && msg.fileUrl && (
                    <img
                      src={msg.fileUrl}
                      alt="attachment"
                      className="max-w-xs rounded-lg mb-2 hover:opacity-95 transition-opacity"
                    />
                  )}

                  {msg.fileType === 'file' && msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 mb-2 p-3 rounded-lg transition-colors ${
                        isOwn
                          ? 'bg-white/20 hover:bg-white/30'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-2xl">📎</span>
                      <span className="text-sm font-medium">Download File</span>
                    </a>
                  )}

                  {msg.content && (
                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}

                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    {isOwn && msg.readBy && (
                      <span className={msg.readBy.length > 1 ? 'text-blue-200' : 'text-blue-100'}>
                        {msg.readBy.length === 1 ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>

                {isOwn && msg.readBy && msg.readBy.length > 1 && (
                  <span className="text-[11px] text-gray-500 mt-1 mr-3">
                    Read by {msg.readBy.length - 1} {msg.readBy.length === 2 ? 'person' : 'people'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers && typingUsers.size > 0 && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-600">
                  {Array.from(typingUsers.values()).join(', ')}{' '}
                  {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-white/50 backdrop-blur-sm border-t border-gray-200">
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <span className="text-2xl">📎</span>
            <span className="text-sm font-medium text-gray-700 flex-1 truncate">
              {selectedFile.name}
            </span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="flex items-center gap-3 bg-white rounded-full shadow-lg p-2 transition-all duration-200 focus-within:shadow-xl">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-br from-sky-400 to-blue-500 text-white p-3 rounded-full hover:from-sky-500 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            disabled={uploading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
            className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-gray-700 placeholder-gray-400"
            disabled={uploading}
          />

          <button
            onClick={handleSend}
            disabled={uploading || (!input.trim() && !selectedFile)}
            className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-medium hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
