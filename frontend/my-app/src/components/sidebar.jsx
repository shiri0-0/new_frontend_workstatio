"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home, BookOpen, DoorOpen, File,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",      href: "/",        icon: Home,     color: "#0284c7", bg: "rgba(2,132,199,0.1)"    },
  { label: "All Notes", href: "/notepad", icon: BookOpen, color: "#e8508a", bg: "rgba(232,80,138,0.1)"   },
  { label: "Make Room", href: "/msg",     icon: DoorOpen, color: "#ea6c1a", bg: "rgba(234,108,26,0.1)"   },
  { label: "File",      href: "/file",    icon: File,     color: "#7c3aed", bg: "rgba(124,58,237,0.1)"   },
];

export default function Sidebar() {
  const [open, setOpen]                       = useState(true);
  const [active, setActive]                   = useState("/");
  const [name, setName]                       = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    const token      = localStorage.getItem("token");
    const storedName = localStorage.getItem("name");
    if (token && storedName) {
      setIsAuthenticated(true);
      setName(storedName);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const firstLetter = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      style={{
        width: open ? "220px" : "64px",
        minHeight: "100vh",
        background: "#f8fafc",                         // light background
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 24px 0",
        transition: "width 0.25s",
        overflow: "hidden",
        position: "relative",
        boxShadow: "2px 0 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: "3px", background: "linear-gradient(90deg,#0284c7,#7c3aed,#e8508a)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          padding: "18px 12px 10px",
        }}
      >
        {open && (
          <span
            style={{
              color: "#0f172a",
              fontWeight: 700,
              fontSize: "16px",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
            }}
          >  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            ShareVault
          </span>
        )}
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: "rgba(2,132,199,0.08)",
            border: "1.5px solid rgba(2,132,199,0.25)",
            borderRadius: "8px",
            color: "#0284c7",
            cursor: "pointer",
            padding: "5px 7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 8px" }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon, color, bg }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setActive(href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: open ? "10px 12px" : "10px 0",
                justifyContent: open ? "flex-start" : "center",
                borderRadius: "12px",
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s",
                color: isActive ? color : "#64748b",
                background: isActive ? bg : "transparent",
                borderLeft: isActive && open ? `3px solid ${color}` : "3px solid transparent",
                paddingLeft: open ? (isActive ? "9px" : "12px") : "0",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = bg;
                  e.currentTarget.style.color = color;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
              title={!open ? label : ""}
            >
              <Icon size={18} />
              {open && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg,transparent,#cbd5e1,transparent)",
          margin: "16px 12px",
        }}
      />

      {/* Bottom User (Dynamic) */}
      {!loading && isAuthenticated && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 12px",
            marginTop: "auto",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#0284c7,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              flexShrink: 0,
            }}
          >
            {firstLetter}
          </div>

          {open && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  color: "#0f172a",                    // dark text on light bg
                  fontWeight: 600,
                  fontSize: "13px",
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  color: "#16a34a",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ● Online
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}