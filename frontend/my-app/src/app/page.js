"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Welcome</h1>
          <p className="text-gray-600">Secure Authentication System</p>
        </div>

        <div className="space-y-3">
          <Link href="/register">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md">
              Register
            </button>
          </Link>

          <Link href="/login">
            <button className="w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg border-2 border-indigo-600 transition duration-200">
              Login
            </button>
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ✅ Email Verification<br />
            ✅ Secure Password Reset<br />
            ✅ OTP Authentication
          </p>
        </div>
      </div>
    </div>
  );
}