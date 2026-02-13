'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from "qrcode.react";

export default function AdminPanel({ room, onClose, onUpdate }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editMaxMembers, setEditMaxMembers] = useState(room.maxMembers);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const qrRef = useRef(null);

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

  // ✅ COPY INVITE CODE
  const copyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    alert('Invite code copied to clipboard!');
  };

  // ✅ DOWNLOAD QR CODE
  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${room.name}-invite-qr.png`;
    link.href = url;
    link.click();
  };

  // ✅ EDIT ROOM
  const handleEdit = async () => {
    if (!editName.trim()) {
      alert('Room name cannot be empty');
      return;
    }

    const membersCount = editMaxMembers === '' ? room.maxMembers : editMaxMembers;

    if (membersCount < room.members.length) {
      alert(`Cannot set max members below current member count (${room.members.length})`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5001/api/rooms/${room._id}/edit`,
        { name: editName, maxMembers: membersCount },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsEditing(false);
      onUpdate();
      alert('Room updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update room');
    }
  };

  const handleMaxMembersChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setEditMaxMembers('');
    } else {
      const num = parseInt(value);
      setEditMaxMembers(isNaN(num) ? room.maxMembers : num);
    }
  };

  // ✅ SEARCH USERS
  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      alert('Please enter an email');
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5001/api/rooms/${room._id}/search-users?email=${searchEmail}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSearchResults(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // ✅ ADD MEMBER DIRECTLY
  const addMember = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/rooms/${room._id}/add-member/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowAddMember(false);
      setSearchEmail('');
      setSearchResults([]);
      onUpdate();
      alert('Member added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* ✅ EDIT ROOM SECTION */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Room Settings</h3>
        {!isEditing ? (
          <div>
            <p className="text-sm mb-1"><span className="font-medium">Name:</span> {room.name}</p>
            <p className="text-sm mb-3"><span className="font-medium">Max Members:</span> {room.maxMembers}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Edit Room
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Room Name"
            />
            <input
              type="number"
              value={editMaxMembers}
              onChange={handleMaxMembersChange}
              min={room.members.length}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Max Members"
            />
            <p className="text-xs text-gray-500">
              Minimum: {room.members.length} (current members)
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(room.name);
                  setEditMaxMembers(room.maxMembers);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ INVITE CODE + QR */}
      {room.type === "private" && room.inviteCode && (
        <div className="mb-6 bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Invite Code</h3>
          
          <div className="bg-white p-3 rounded border border-purple-200 text-center font-bold tracking-widest text-lg mb-3">
            {room.inviteCode}
          </div>

          <button
            onClick={copyCode}
            className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 mb-3 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            Copy Code
          </button>

          <div ref={qrRef} className="flex justify-center mb-3">
            <QRCodeCanvas value={room.inviteCode} size={150} />
          </div>

          <button
            onClick={downloadQR}
            className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download QR
          </button>
        </div>
      )}

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

      {/* ✅ ADD MEMBER SECTION */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Add Member</h3>
        {!showAddMember ? (
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full bg-teal-500 text-white py-2 rounded hover:bg-teal-600 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Add Member
          </button>
        ) : (
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
            <div className="mb-3">
              <input
                type="email"
                placeholder="Enter user email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={searchUsers}
                  disabled={searching}
                  className="flex-1 bg-teal-500 text-white py-2 rounded hover:bg-teal-600 text-sm"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSearchEmail('');
                    setSearchResults([]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-semibold">Search Results:</p>
                {searchResults.map((user) => (
                  <div key={user._id} className="bg-white p-2 rounded border border-teal-300">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <button
                      onClick={() => addMember(user._id)}
                      className="mt-2 w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-xs"
                    >
                      Add to Room
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchEmail && !searching && (
              <p className="text-xs text-gray-500 text-center">No users found</p>
            )}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.user._id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="font-medium">{req.user.name}</p>
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
                  <p className="font-medium">{member.name}</p>
                  {member._id === room.admin._id && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>

                {member._id !== room.admin._id && (
                  <button
                    onClick={() => handleRemove(member._id)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove
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