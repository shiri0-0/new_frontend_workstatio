'use client';
import { useState, useEffect } from 'react';

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const Icons = {
  Copy: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  ),
  Expand: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
    </svg>
  ),
  Shrink: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  Save: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Type: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  Rows: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

export default function Home() {
  const [text, setText]               = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textareaSize, setTextareaSize] = useState('medium');
  const [fontSize, setFontSize]       = useState('medium');
  const [copied, setCopied]           = useState(false);
  const [wordCount, setWordCount]     = useState(0);
  const [charCount, setCharCount]     = useState(0);

  useEffect(() => { loadText(); }, []);

  const loadText = async () => {
    try {
      const res  = await fetch('http://localhost:5001/api/text');
      const data = await res.json();
      if (data.text) {
        setText(data.text);
        updateCounts(data.text);
      }
    } catch (e) { console.error(e); }
    finally    { setLoading(false); }
  };

  const saveText = async (val) => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5001/api/text', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: val }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally    { setSaving(false); }
  };

  const updateCounts = (val) => {
    setCharCount(val.length);
    setWordCount(val.trim() === '' ? 0 : val.trim().split(/\s+/).length);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    updateCounts(val);
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => saveText(val), 600));
  };

  const handleClear = async () => {
    if (!confirm('Clear all text?')) return;
    setText('');
    updateCounts('');
    await saveText('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { alert('Copy failed'); }
  };

  const fontSizeMap = { small: '13px', medium: '15px', large: '17px', xlarge: '20px' };
  const heightMap   = { small: '180px', medium: '280px', large: '420px' };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#64748b', fontSize:'15px', fontFamily:'Georgia, serif' }}>
        <div style={{ width:'18px', height:'18px', border:'2px solid #cbd5e1', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        Loading…
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .pad-textarea:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
        .pad-textarea::placeholder { color: #94a3b8; }
        .tool-btn { transition: all 0.15s; }
        .tool-btn:hover { transform: translateY(-1px); }
        .tool-btn:active { transform: translateY(0); }
        .seg-btn { transition: all 0.15s; border: none; cursor: pointer; font-family: 'Lora', serif; font-size: 12px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 50%, #e8eef5 100%)',
        padding: isFullscreen ? '0' : '40px 24px',
        display: isFullscreen ? 'flex' : 'block',
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{
          maxWidth: isFullscreen ? '100%' : '720px',
          width: '100%',
          margin: isFullscreen ? '0' : '0 0 0 40px',
          flex: isFullscreen ? '1' : undefined,
        }}>
          {/* Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: isFullscreen ? '0' : '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: isFullscreen ? '100vh' : 'auto',
          }}>

            {/* Top accent */}
            <div style={{ height:'3px', background:'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)' }} />

            {/* Header */}
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
                  <Icons.FileText />
                </div>
                <div>
                  <h1 style={{ margin:0, fontSize:'17px', fontWeight:700, color:'#0f172a', fontFamily:'Lora, serif', letterSpacing:'-0.3px' }}>Notepad</h1>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'1px', fontFamily:'Lora, serif' }}>Auto-saved · Persistent</div>
                </div>
              </div>

              {/* Right controls */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>

                {/* Save indicator */}
                <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontFamily:'Lora,serif', color: saving ? '#f59e0b' : saved ? '#10b981' : '#cbd5e1', transition:'color 0.3s', minWidth:'70px' }}>
                  {saving ? <><div style={{ width:'10px', height:'10px', border:'1.5px solid #f59e0b', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Saving</> : saved ? <><Icons.CheckCircle /> Saved</> : null}
                </div>

                {/* Font size */}
                <div style={{ display:'flex', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'3px', gap:'2px', alignItems:'center' }}>
                  <span style={{ padding:'0 6px', color:'#94a3b8' }}><Icons.Type /></span>
                  {['small','medium','large','xlarge'].map(s => (
                    <button key={s} onClick={() => setFontSize(s)} className="seg-btn" style={{
                      padding:'4px 8px', borderRadius:'6px', fontWeight: fontSize===s ? 700 : 400,
                      background: fontSize===s ? '#3b82f6' : 'transparent',
                      color: fontSize===s ? '#fff' : '#64748b',
                    }}>
                      {s==='small'?'S':s==='medium'?'M':s==='large'?'L':'XL'}
                    </button>
                  ))}
                </div>

                {/* Height */}
                {!isFullscreen && (
                  <div style={{ display:'flex', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'3px', gap:'2px', alignItems:'center' }}>
                    <span style={{ padding:'0 6px', color:'#94a3b8' }}><Icons.Rows /></span>
                    {['small','medium','large'].map(s => (
                      <button key={s} onClick={() => setTextareaSize(s)} className="seg-btn" style={{
                        padding:'4px 8px', borderRadius:'6px',
                        background: textareaSize===s ? '#6366f1' : 'transparent',
                        color: textareaSize===s ? '#fff' : '#64748b',
                        fontWeight: textareaSize===s ? 700 : 400,
                      }}>
                        {s==='small'?'S':s==='medium'?'M':'L'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {[
                  { label: copied ? 'Copied!' : 'Copy',  icon: <Icons.Copy />,   onClick: handleCopy,       bg: copied ? '#10b981' : '#3b82f6', hover:'#2563eb' },
                  { label: isFullscreen ? 'Exit' : 'Full', icon: isFullscreen ? <Icons.Shrink /> : <Icons.Expand />, onClick: () => setIsFullscreen(!isFullscreen), bg:'#6366f1', hover:'#4f46e5' },
                  { label: 'Clear', icon: <Icons.Trash />, onClick: handleClear,  bg:'#ef4444', hover:'#dc2626' },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} className="tool-btn" style={{
                    display:'flex', alignItems:'center', gap:'6px',
                    padding:'7px 14px', borderRadius:'8px', border:'none', cursor:'pointer',
                    background: btn.bg, color:'#fff',
                    fontSize:'13px', fontWeight:600, fontFamily:'Lora,serif',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.12)',
                  }}>
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div style={{ padding:'20px 24px', flex: isFullscreen ? 1 : undefined, display:'flex', flexDirection:'column' }}>
              <textarea
                value={text}
                onChange={handleChange}
                placeholder="Start writing… your notes are saved automatically."
                className="pad-textarea"
                style={{
                  width:'100%',
                  height: isFullscreen ? 'calc(100vh - 200px)' : heightMap[textareaSize],
                  resize: isFullscreen ? 'none' : 'vertical',
                  border:'1.5px solid #e2e8f0',
                  borderRadius:'10px',
                  padding:'16px',
                  fontSize: fontSizeMap[fontSize],
                  fontFamily:'JetBrains Mono, monospace',
                  lineHeight:'1.7',
                  color:'#1e293b',
                  background:'#fafbfc',
                  transition:'border-color 0.2s, box-shadow 0.2s',
                  boxSizing:'border-box',
                  flex: isFullscreen ? 1 : undefined,
                }}
              />
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 24px 16px', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:'16px' }}>
                {[
                  { label:`${wordCount} words` },
                  { label:`${charCount} chars` },
                ].map(s => (
                  <span key={s.label} style={{ fontSize:'12px', color:'#94a3b8', fontFamily:'Lora,serif' }}>{s.label}</span>
                ))}
              </div>
              <span style={{ fontSize:'11px', color:'#cbd5e1', fontFamily:'Lora,serif' }}>Stored in MongoDB</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}