'use client';
import { useRouter } from 'next/navigation';

export default function RoomList({ rooms, onRefresh }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Active Rooms ({rooms.length})</h2>
      
      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active rooms. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              onClick={() => router.push(`/chat/${room._id}`)}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all border border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  room.type === 'public' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-purple-500 text-white'
                }`}>
                  {room.type}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>{room.members.length}/{room.maxMembers} members</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>Admin: {room.admin.name}</span>
                </div>

                {room.isEntryClosed && (
                  <div className="flex items-center gap-2 text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Entry Closed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}