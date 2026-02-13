'use client';
import { useState } from 'react';
import axios from 'axios';

export default function CreateRoom({ type, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);

  const handleMaxMembersChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setMaxMembers('');
    } else {
      const num = parseInt(value);
      setMaxMembers(isNaN(num) ? 10 : num);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a room name');
      return;
    }

    const membersCount = maxMembers === '' ? 10 : maxMembers;

    if (membersCount < 2) {
      alert('Maximum members must be at least 2');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/rooms/create',
        { name, type, maxMembers: membersCount },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      onCreated();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create room');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">
          Create {type === 'private' ? 'Private' : 'Public'} Room
        </h2>
        
        <input
          type="text"
          placeholder="Room Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
        />
        
        <input
          type="number"
          placeholder="Max Members (default: 10)"
          value={maxMembers}
          onChange={handleMaxMembersChange}
          min="2"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
        />

        {type === 'private' && (
          <p className="text-sm text-gray-600 mb-4">
            You can create up to 10 private rooms. An invite code will be generated.
          </p>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}