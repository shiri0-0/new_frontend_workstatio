'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPanel({ room, onClose, onUpdate }) {
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5001/api/rooms/${room._id}/requests`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setPendingRequests(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/rooms/${room._id}/approve/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchPendingRequests();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5001/api/rooms/${room._id}/remove/${userId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5001/api/rooms/${room._id}/toggle-entry`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Entry Control */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Entry Control</h3>
        <button
          onClick={toggleEntry}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            room.isEntryClosed
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {room.isEntryClosed ? 'Open Entry' : 'Close Entry'}
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.user._id} className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium">{req.user.username}</p>
                <p className="text-xs text-gray-500">{req.user.email}</p>
                <button
                  onClick={() => handleApprove(req.user._id)}
                  className="mt-2 w-full bg-green-500 text-white py-1 rounded hover:bg-green-600"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="font-semibold mb-2">Members ({room.members.length})</h3>
        <div className="space-y-2">
          {room.members.map((member) => (
            <div key={member._id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.username}</p>
                  {member._id === room.admin._id && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                {member._id !== room.admin._id && (
                  <button
                    onClick={() => handleRemove(member._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}