"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`h-screen bg-gray-900 text-white transition-all duration-300
      ${open ? "w-64" : "w-16"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-4 w-full text-left hover:bg-gray-800"
      >
        {open ? "☰ Collapse" : "☰"}
      </button>

      {/* Menu */}
      <nav className="mt-4 space-y-2">
        <Link href="/" className="block px-4 py-2 hover:bg-gray-800">
          {open && "Home"}
        </Link>

        <Link href="/notes" className="block px-4 py-2 hover:bg-gray-800">
          {open && "All Notes"}
        </Link>

        <Link href="/room" className="block px-4 py-2 hover:bg-gray-800">
          {open && "Make Room"}
        </Link>

        <Link href="/info" className="block px-4 py-2 hover:bg-gray-800">
          {open && "Info"}
        </Link>

        <Link href="/register" className="block px-4 py-2 hover:bg-gray-800">
          {open && "Login"}
        </Link>
      </nav>
    </div>
  );
}
