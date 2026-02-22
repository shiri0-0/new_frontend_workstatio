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
  const [addingId, setAddingId] = useState(null); // ✅ track which user is being added
  const qrRef = useRef(null);

  useEffect(() => { fetchPendingRequests(); }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/rooms/${room._id}/requests`, { headers: { Authorization: `Bearer ${token}` } });
      setPendingRequests(res.data);
    } catch (e) { console.error(e); }
  };

  const handleApprove = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/rooms/${room._id}/approve/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPendingRequests(); onUpdate();
    } catch (e) { console.error(e); }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/rooms/${room._id}/remove/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const toggleEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/rooms/${room._id}/toggle-entry`, {}, { headers: { Authorization: `Bearer ${token}` } });
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const copyCode = () => { navigator.clipboard.writeText(room.inviteCode); alert('Invite code copied!'); };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${room.name}-invite-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleEdit = async () => {
    if (!editName.trim()) { alert('Room name cannot be empty'); return; }
    const membersCount = editMaxMembers === '' ? room.maxMembers : editMaxMembers;
    if (membersCount < room.members.length) { alert(`Cannot set below current count (${room.members.length})`); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/rooms/${room._id}/edit`, { name: editName, maxMembers: membersCount }, { headers: { Authorization: `Bearer ${token}` } });
      setIsEditing(false); onUpdate(); alert('Room updated!');
    } catch (e) { alert(e.response?.data?.message || 'Failed to update room'); }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) { alert('Please enter an email'); return; }
    setSearching(true);
    setSearchResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5001/api/rooms/${room._id}/search-users?email=${encodeURIComponent(searchEmail.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Search failed');
      setSearchResults([]);
    } finally { setSearching(false); }
  };

  // ✅ FIXED: Add member with proper loading state and error handling
  const addMember = async (userId) => {
    setAddingId(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/rooms/${room._id}/add-member/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Close panel, clear state, refresh room
      setShowAddMember(false);
      setSearchEmail('');
      setSearchResults([]);
      onUpdate();
      alert('Member added successfully!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add member. Try again.');
    } finally {
      setAddingId(null);
    }
  };

  const Label = ({ children }) => (
    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{children}</p>
  );

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition";

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-pink-100 bg-gradient-to-r from-sky-50 to-pink-50">
        <div>
          <h2 className="text-base font-bold text-gray-800">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-0.5">{room.name}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-500 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>

        {/* Room Settings */}
        <div>
          <Label>Room Settings</Label>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
            {!isEditing ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Name</span>
                  <span className="text-sm font-semibold text-gray-700">{room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Max Members</span>
                  <span className="text-sm font-semibold text-gray-700">{room.maxMembers}</span>
                </div>
                <button onClick={() => setIsEditing(true)} className="mt-2 w-full py-2 rounded-xl bg-sky-400 text-white text-sm font-semibold hover:bg-sky-500 transition shadow-sm">
                  Edit Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} placeholder="Room Name" />
                <input type="number" value={editMaxMembers} onChange={(e) => { const v = e.target.value; setEditMaxMembers(v === '' ? '' : (isNaN(parseInt(v)) ? room.maxMembers : parseInt(v))); }} min={room.members.length} className={inputCls} placeholder="Max Members" />
                <p className="text-xs text-gray-400">Min: {room.members.length} (current members)</p>
                <div className="flex gap-2">
                  <button onClick={handleEdit} className="flex-1 py-2 rounded-xl bg-emerald-400 text-white text-sm font-semibold hover:bg-emerald-500 transition">Save</button>
                  <button onClick={() => { setIsEditing(false); setEditName(room.name); setEditMaxMembers(room.maxMembers); }} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invite Code + QR (private rooms only) */}
        {room.type === "private" && room.inviteCode && (
          <div>
            <Label>Invite Code</Label>
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 space-y-3">
              <div className="bg-white rounded-xl py-3 text-center font-mono font-bold text-2xl text-pink-500 tracking-[0.3em] border border-pink-100">
                {room.inviteCode}
              </div>
              <button onClick={copyCode} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-pink-400 text-white text-sm font-semibold hover:bg-pink-500 transition shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy Code
              </button>
              <div ref={qrRef} className="flex justify-center bg-white rounded-xl p-3 border border-pink-100">
                <QRCodeCanvas value={room.inviteCode} size={140} />
              </div>
              <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download QR
              </button>
            </div>
          </div>
        )}

        {/* Entry Control */}
        <div>
          <Label>Entry Control</Label>
          <button
            onClick={toggleEntry}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
              room.isEntryClosed
                ? 'bg-emerald-400 text-white hover:bg-emerald-500'
                : 'bg-red-400 text-white hover:bg-red-500'
            }`}
          >
            {room.isEntryClosed ? '🔓 Open Entry' : '🔒 Close Entry'}
          </button>
        </div>

        {/* ✅ FIXED: Add Member Section */}
        <div>
          <Label>Add Member</Label>
          {!showAddMember ? (
            <button
              onClick={() => { setShowAddMember(true); setSearchEmail(''); setSearchResults([]); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-400 text-white text-sm font-semibold hover:bg-teal-500 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Add Member
            </button>
          ) : (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 space-y-3">
              {/* Search input */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Search by email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={searchUsers}
                  disabled={searching || !searchEmail.trim()}
                  className="flex-1 py-2 rounded-xl bg-teal-400 text-white text-sm font-semibold hover:bg-teal-500 transition disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => { setShowAddMember(false); setSearchEmail(''); setSearchResults([]); }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 mt-1">
                  <p className="text-xs text-gray-400 font-semibold">Results ({searchResults.length})</p>
                  {searchResults.map((user) => (
                    <div key={user._id} className="bg-white border border-teal-100 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-300 to-sky-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addMember(user._id)}
                        disabled={addingId === user._id}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-400 text-white text-xs font-semibold hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {addingId === user._id ? '...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchEmail && !searching && (
                <p className="text-xs text-gray-400 text-center py-2">No users found</p>
              )}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <Label>Pending Requests ({pendingRequests.length})</Label>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.user._id} className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {req.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{req.user.name}</p>
                      <p className="text-xs text-gray-400">{req.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleApprove(req.user._id)} className="w-full py-1.5 rounded-lg bg-emerald-400 text-white text-xs font-semibold hover:bg-emerald-500 transition">
                    ✓ Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members List */}
        <div>
          <Label>Members ({room.members.length})</Label>
          <div className="space-y-2">
            {room.members.map((member) => (
              <div key={member._id} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{member.name}</p>
                    {member._id === room.admin._id && (
                      <span className="text-[10px] font-bold text-sky-500 bg-sky-100 px-2 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                </div>
                {member._id !== room.admin._id && (
                  <button
                    onClick={() => handleRemove(member._id)}
                    className="flex-shrink-0 text-xs text-red-400 hover:text-white hover:bg-red-400 font-semibold px-2.5 py-1 rounded-lg border border-red-200 hover:border-red-400 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}