'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import io from 'socket.io-client';
import ChatWindow from '@/components/ChatWindow';
import AdminPanel from '@/components/AdminPanel';

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) { router.push('/login'); return; }
    setCurrentUser(userId);
    fetchRoomData();
    fetchMessages();
    initSocket(userId);
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [params.roomId]);

  const initSocket = (userId) => {
    socketRef.current = io('http://localhost:5001');
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', params.roomId);
      socketRef.current.emit('user-online', { userId, roomId: params.roomId });
    });
    socketRef.current.on('new-message', (data) => {
      const message = data.message || data;
      if (message?._id && message?.sender?._id)
        setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, message]);
    });
    socketRef.current.on('user-status-change', ({ userId, status }) => {
      setOnlineUsers(prev => { const s = new Set(prev); status === 'online' ? s.add(userId) : s.delete(userId); return s; });
    });
    socketRef.current.on('user-typing', ({ userId, userName }) => setTypingUsers(prev => new Map(prev).set(userId, userName)));
    socketRef.current.on('user-stopped-typing', ({ userId }) => setTypingUsers(prev => { const m = new Map(prev); m.delete(userId); return m; }));
    socketRef.current.on('message-read-update', ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId && !msg.readBy.some(u => u._id === userId)
          ? { ...msg, readBy: [...msg.readBy, { _id: userId }] } : msg
      ));
    });
    socketRef.current.on('user-removed', (data) => { if (data.userId === currentUser) { alert('You have been removed'); router.push('/'); } });
    socketRef.current.on('room-updated', fetchRoomData);
  };

  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/rooms/active`, { headers: { Authorization: `Bearer ${token}` } });
      setRoom(res.data.find(r => r._id === params.roomId));
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/messages/${params.roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (content, fileUrl = null, fileType = 'text') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/messages/send',
        { roomId: params.roomId, content, fileUrl, fileType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data]);
      if (socketRef.current?.connected)
        socketRef.current.emit('send-message', { roomId: params.roomId, message: res.data });
    } catch (e) { console.error(e); }
  };

  const handleTyping = (isTyping) => {
    if (!socketRef.current) return;
    if (isTyping) {
      socketRef.current.emit('typing-start', { roomId: params.roomId, userId: currentUser, userName: room?.members.find(m => m._id === currentUser)?.name || 'User' });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socketRef.current.emit('typing-stop', { roomId: params.roomId, userId: currentUser }), 2000);
    } else socketRef.current.emit('typing-stop', { roomId: params.roomId, userId: currentUser });
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/messages/${messageId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (socketRef.current) socketRef.current.emit('message-read', { roomId: params.roomId, messageId, userId: currentUser });
    } catch (e) { console.error(e); }
  };

  if (!room) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #e879a0 50%, #fb923c 100%)' }}>
      <div className="flex flex-col items-center gap-3 bg-white/20 backdrop-blur-xl rounded-2xl px-10 py-8">
        <div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
        <p className="text-white font-semibold">Joining room...</p>
      </div>
    </div>
  );

  const isAdmin = room.admin._id === currentUser;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #bae6fd 0%, #fbcfe8 50%, #fed7aa 100%)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div className="flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #e8508a 60%, #f97316 100%)' }}>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-white font-bold text-sm shadow">
              {room.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-[15px] drop-shadow">{room.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                  {room.type}
                </span>
              </div>
              <p className="text-[12px] text-white/80 flex items-center gap-1.5 mt-0.5">
                {onlineUsers.size > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse" />}
                {room.members.length} members • {onlineUsers.size} online
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${
                showAdminPanel ? 'bg-white text-pink-500 border-white' : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
              }`}
            >
              ⚙️ Admin
            </button>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} currentUser={currentUser} onSendMessage={sendMessage} room={room} onlineUsers={onlineUsers} typingUsers={typingUsers} onTyping={handleTyping} onMarkAsRead={markAsRead} />
        </div>
        {showAdminPanel && isAdmin && (
          <div className="w-80 flex-shrink-0 border-l-2 border-pink-300 overflow-y-auto shadow-xl" style={{ background: 'white' }}>
            <AdminPanel room={room} onClose={() => setShowAdminPanel(false)} onUpdate={fetchRoomData} />
          </div>
        )}
      </div>
    </div>
  );
}