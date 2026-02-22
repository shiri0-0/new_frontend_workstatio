'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CreateRoom from '@/components/CreateRoom';
import RoomList from '@/components/RoomList';
import { Html5Qrcode } from 'html5-qrcode';

export default function Home() {
  const [activeRooms, setActiveRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomType, setRoomType] = useState('public');
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchActiveRooms();
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchActiveRooms();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(fetchActiveRooms, 10000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // ✅ Scan QR from uploaded image file only
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanError('');
    setScanSuccess('');

    try {
      const qr = new Html5Qrcode('qr-file-reader');
      const result = await qr.scanFile(file, true);
      setInviteCode(result.trim().toUpperCase());
      setScanSuccess('✅ QR code read from image!');
      await qr.clear();
    } catch (err) {
      setScanError('❌ Could not read QR from this image. Make sure the QR code is clear and try again.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    if (!inviteCode.trim()) {
      alert('Please enter an invite code');
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/rooms/join-by-code",
        { code: inviteCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Request sent to admin!');
      closeJoinModal();
      fetchActiveRooms();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join');
    }
  };

  const closeJoinModal = () => {
    setShowJoinPrivate(false);
    setInviteCode('');
    setScanError('');
    setScanSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Chat Rooms</h1>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setRoomType('public'); setShowCreateRoom(true); }}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Create Public Room
            </button>
            <button
              onClick={() => { setRoomType('private'); setShowCreateRoom(true); }}
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

          <RoomList rooms={activeRooms} onRefresh={fetchActiveRooms} />
        </div>
      </div>

      {showCreateRoom && (
        <CreateRoom
          type={roomType}
          onClose={() => setShowCreateRoom(false)}
          onCreated={fetchActiveRooms}
        />
      )}

      {/* ===== Join Private Room Modal ===== */}
      {showJoinPrivate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Join Private Room</h2>
              <button onClick={closeJoinModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
            </div>

            {/* Manual Code Input */}
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-1 block font-medium">Invite Code</label>
              <input
                type="text"
                placeholder="e.g. AB12CD"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center tracking-widest font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-semibold">OR SCAN QR CODE</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Upload QR Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 transition text-indigo-600 cursor-pointer mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-bold">Upload QR Image</p>
                <p className="text-xs text-gray-400">Pick QR photo from your device</p>
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Hidden div required by html5-qrcode for file scanning */}
            <div id="qr-file-reader" className="hidden" />

            {/* Error Message */}
            {scanError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 text-center">
                {scanError}
              </div>
            )}

            {/* Success Message */}
            {scanSuccess && (
              <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 text-center font-medium">
                {scanSuccess}
              </div>
            )}

            {/* Code Preview */}
            {inviteCode && (
              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-purple-400 mb-1">Code detected</p>
                <p className="font-bold tracking-widest text-purple-800 text-xl">{inviteCode}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={joinPrivateRoom}
                className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 font-semibold transition"
              >
                Join Room
              </button>
              <button
                onClick={closeJoinModal}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
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