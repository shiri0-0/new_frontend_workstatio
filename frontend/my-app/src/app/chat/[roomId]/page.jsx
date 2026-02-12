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
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // ✅ Online users
  const [typingUsers, setTypingUsers] = useState(new Map()); // ✅ Typing users
  
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token) {
      router.push('/login');
      return;
    }

    setCurrentUser(userId);
    fetchRoomData();
    fetchMessages();
    initSocket(userId);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [params.roomId]);

  const initSocket = (userId) => {
    socketRef.current = io('http://localhost:5001');
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join-room', params.roomId);
      
      // ✅ Announce user is online
      socketRef.current.emit('user-online', {
        userId,
        roomId: params.roomId
      });
    });

    // ✅ New message
    socketRef.current.on('new-message', (data) => {
      const message = data.message || data;
      
      if (message && message._id && message.sender && message.sender._id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    // ✅ User online/offline status
    socketRef.current.on('user-status-change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // ✅ Typing indicators
    socketRef.current.on('user-typing', ({ userId, userName }) => {
      setTypingUsers(prev => new Map(prev).set(userId, userName));
    });

    socketRef.current.on('user-stopped-typing', ({ userId }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    });

    // ✅ Message read update
    socketRef.current.on('message-read-update', ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId && !msg.readBy.some(u => u._id === userId)) {
          return {
            ...msg,
            readBy: [...msg.readBy, { _id: userId }]
          };
        }
        return msg;
      }));
    });

    socketRef.current.on('user-removed', (data) => {
      if (data.userId === currentUser) {
        alert('You have been removed from this room');
        router.push('/');
      }
    });

    socketRef.current.on('room-updated', () => {
      fetchRoomData();
    });
  };

  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/rooms/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentRoom = res.data.find(r => r._id === params.roomId);
      setRoom(currentRoom);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/messages/${params.roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (content, fileUrl = null, fileType = 'text', replyTo = null) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/messages/send', {
        roomId: params.roomId,
        content,
        fileUrl,
        fileType,
        replyTo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, res.data]);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send-message', {
          roomId: params.roomId,
          message: res.data
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (!socketRef.current) return;

    if (isTyping) {
      socketRef.current.emit('typing-start', {
        roomId: params.roomId,
        userId: currentUser,
        userName: room?.members.find(m => m._id === currentUser)?.name || 'User'
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing-stop', {
          roomId: params.roomId,
          userId: currentUser
        });
      }, 2000);
    } else {
      socketRef.current.emit('typing-stop', {
        roomId: params.roomId,
        userId: currentUser
      });
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (socketRef.current) {
        socketRef.current.emit('message-read', {
          roomId: params.roomId,
          messageId,
          userId: currentUser
        });
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  if (!room) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const isAdmin = room.admin._id === currentUser;
return (
  <div className="h-screen w-full bg-gradient-to-br from-sky-200 via-pink-100 to-orange-100 flex flex-col">

    {/* HEADER */}
    <div className="backdrop-blur-xl bg-white/40 border-b border-white/30 shadow-md">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">

        <div className="flex items-center gap-4">

          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full bg-white/50 hover:bg-white transition shadow"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Room Info */}
          <div>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {room.name}

              {/* Online Indicator */}
              {onlineUsers.size > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </h1>

            <p className="text-xs text-gray-600">
              {room.members.length} members • {onlineUsers.size} online
            </p>
          </div>
        </div>

        {/* Admin Button */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="bg-gradient-to-r from-sky-400 to-pink-400 text-white px-4 py-2 rounded-full text-sm font-medium shadow hover:scale-105 transition"
          >
            Admin Panel
          </button>
        )}
      </div>
    </div>

    {/* MAIN AREA */}
    <div className="flex-1 flex justify-center items-center p-4 overflow-hidden">

      <div className="w-full max-w-6xl h-full bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl flex overflow-hidden border border-white/40">

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          <ChatWindow 
            messages={messages}
            currentUser={currentUser}
            onSendMessage={sendMessage}
            room={room}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            onTyping={handleTyping}
            onMarkAsRead={markAsRead}
          />
        </div>

        {/* Admin Panel */}
        {showAdminPanel && isAdmin && (
          <div className="w-80 bg-white/70 backdrop-blur-xl border-l border-pink-100 shadow-inner">
            <AdminPanel 
              room={room}
              onClose={() => setShowAdminPanel(false)}
              onUpdate={fetchRoomData}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);
}