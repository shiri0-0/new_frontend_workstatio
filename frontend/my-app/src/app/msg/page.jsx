'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateRoom from '@/components/CreateRoom';
import RoomList from '@/components/RoomList';

export default function Home() {
  const [activeRooms, setActiveRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    fetchActiveRooms();
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Chat Rooms</h1>
          
          {/* Create Room Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Create Public Room
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
            >
              Create Private Room
            </button>
          </div>

          {/* Active Rooms */}
          <RoomList rooms={activeRooms} onRefresh={fetchActiveRooms} />
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoom 
          onClose={() => setShowCreateRoom(false)} 
          onCreated={fetchActiveRooms}
        />
      )}
    </div>
  );
}