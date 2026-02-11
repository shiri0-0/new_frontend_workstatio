'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatWindow({ messages, currentUser, onSendMessage, room }) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const res = await axios.post('http://localhost:5001/api/chatfiles/upload', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
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
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e5ddd5]">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => {
          // ✅ Validation
          if (!msg || !msg.sender || !msg.sender._id) {
            console.warn('Skipping invalid message:', msg);
            return null;
          }

          const isOwn = msg.sender._id === currentUser;

          return (
            <div
              key={msg._id || idx}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md rounded-lg p-3 shadow ${
                  isOwn 
                    ? 'bg-[#dcf8c6] rounded-br-none' 
                    : 'bg-white rounded-bl-none'
                }`}
              >
                {!isOwn && msg.sender.name && (
                  <p className="text-xs font-semibold text-blue-600 mb-1">
                    {msg.sender.name}
                  </p>
                )}

                {msg.fileType === 'image' && msg.fileUrl && (
                  <img 
                    src={msg.fileUrl} 
                    alt="Uploaded" 
                    className="max-w-full rounded mb-2"
                  />
                )}

                {msg.fileType === 'file' && msg.fileUrl && (
                  <a 
                    href={msg.fileUrl} 
                    target="_blank"
                    className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    Download File
                  </a>
                )}

                {msg.content && (
                  <p className="text-gray-800 break-words">{msg.content}</p>
                )}

                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                  
                  {isOwn && msg.readBy && (
                    <div className="flex">
                      {msg.readBy.length === 1 ? (
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M18.707 3.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 10.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {isOwn && msg.readBy && msg.readBy.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Read by {msg.readBy.length - 1} others
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f0f0] p-4">
        {selectedFile && (
          <div className="bg-white rounded-lg p-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white p-3 rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />

          <button
            onClick={handleSend}
            disabled={uploading}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {uploading ? (
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}