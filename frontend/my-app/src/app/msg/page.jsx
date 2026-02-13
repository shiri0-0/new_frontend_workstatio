'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateRoom from '@/components/CreateRoom';
import RoomList from '@/components/RoomList';

export default function Home() {
  const [activeRooms, setActiveRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomType, setRoomType] = useState('public'); // Track room type
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchActiveRooms();

    // ✅ AUTO-REFRESH when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActiveRooms();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ✅ REFRESH every 10 seconds
    const interval = setInterval(fetchActiveRooms, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const fetchActiveRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/rooms/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveRooms(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const joinPrivateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/rooms/join-by-code",
        { code: inviteCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Request sent to admin!');
      setShowJoinPrivate(false);
      setInviteCode('');
      fetchActiveRooms();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Chat Rooms</h1>
          
          {/* Create Room Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setRoomType('public');
                setShowCreateRoom(true);
              }}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Create Public Room
            </button>
            <button
              onClick={() => {
                setRoomType('private');
                setShowCreateRoom(true);
              }}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Private Room
            </button>
            <button
              onClick={() => setShowJoinPrivate(true)}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
            >
              Join Private Room
            </button>
          </div>

          {/* Active Rooms */}
          <RoomList rooms={activeRooms} onRefresh={fetchActiveRooms} />
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoom 
          type={roomType}
          onClose={() => setShowCreateRoom(false)} 
          onCreated={fetchActiveRooms}
        />
      )}

      {/* Join Private Room Modal */}
      {showJoinPrivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Join Private Room</h2>
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={joinPrivateRoom}
                className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
              >
                Join
              </button>
              <button
                onClick={() => {
                  setShowJoinPrivate(false);
                  setInviteCode('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}