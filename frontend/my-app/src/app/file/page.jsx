'use client';
import { useState, useEffect } from 'react';

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const Icons = {
  Upload: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  Folder: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  Storage: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Files: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  CloudUp: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  ),
};

// File type → icon emoji map
const fileIcon = (mime) => {
  if (mime.startsWith('image/'))          return { icon:'🖼️', color:'#f59e0b', bg:'#fef3c7' };
  if (mime.startsWith('video/'))          return { icon:'🎬', color:'#ef4444', bg:'#fee2e2' };
  if (mime.startsWith('audio/'))          return { icon:'🎵', color:'#8b5cf6', bg:'#ede9fe' };
  if (mime.includes('pdf'))               return { icon:'📄', color:'#ef4444', bg:'#fee2e2' };
  if (mime.includes('word')||mime.includes('document')) return { icon:'📝', color:'#3b82f6', bg:'#dbeafe' };
  if (mime.includes('sheet')||mime.includes('excel'))   return { icon:'📊', color:'#10b981', bg:'#d1fae5' };
  if (mime.includes('zip')||mime.includes('rar'))       return { icon:'📦', color:'#f59e0b', bg:'#fef3c7' };
  return { icon:'📁', color:'#64748b', bg:'#f1f5f9' };
};

const fmtSize = (b) => {
  if (b === 0) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'], i = Math.floor(Math.log(b)/Math.log(k));
  return (b/Math.pow(k,i)).toFixed(1)+' '+s[i];
};

export default function FileUpload() {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag]           = useState(false);
  const [progress, setProgress]   = useState(0);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const res  = await fetch('http://localhost:5001/api/files');
      const data = await res.json();
      if (data.success) setFiles(data.files);
    } catch (e) { console.error(e); }
    finally    { setLoading(false); }
  };

  const handleUpload = async (selected) => {
    if (!selected?.length) return;
    setUploading(true); setProgress(0);
    try {
      for (let i = 0; i < selected.length; i++) {
        const f    = selected[i];
        const b64  = await toBase64(f);
        const res  = await fetch('http://localhost:5001/api/files', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ filename:f.name, mimetype:f.type, size:f.size, data:b64 }),
        });
        if (!res.ok) throw new Error('Upload failed');
        setProgress(Math.round(((i+1)/selected.length)*100));
      }
      await loadFiles();
    } catch (e) { alert('Upload error. Is the backend running?'); }
    finally    { setUploading(false); setProgress(0); }
  };

  const toBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
  });

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(e.type==='dragenter'||e.type==='dragover'); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); handleUpload(Array.from(e.dataTransfer.files)); };

  const handleDownload = async (id, name) => {
    try {
      const res  = await fetch(`http://localhost:5001/api/files/${id}`);
      const data = await res.json();
      if (data.success) {
        const bytes = atob(data.file.data), arr = new Uint8Array(bytes.length);
        for (let i=0;i<bytes.length;i++) arr[i]=bytes.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([arr],{type:data.file.mimetype}));
        const a   = Object.assign(document.createElement('a'),{href:url,download:name});
        document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); document.body.removeChild(a);
      }
    } catch { alert('Download failed'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await fetch(`http://localhost:5001/api/files/${id}`,{method:'DELETE'});
      await loadFiles();
    } catch { alert('Delete failed'); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#64748b', fontSize:'15px', fontFamily:"'Lora', serif" }}>
        <div style={{ width:'18px', height:'18px', border:'2px solid #cbd5e1', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        Loading files…
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .file-row:hover   { background:#f8fafc !important; }
        .action-btn       { transition: all 0.15s; border: none; cursor: pointer; }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .action-btn:active { transform: translateY(0); }
        .drop-zone        { transition: all 0.2s; }
        .drop-zone:hover  { border-color: #3b82f6 !important; background: rgba(59,130,246,0.03) !important; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f8fafc 0%,#f0f4f8 50%,#e8eef5 100%)', padding:'40px 24px', animation:'fadeIn 0.3s ease' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>

          {/* Card */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)', overflow:'hidden', display:'flex', flexDirection:'column', height:'calc(100vh - 80px)' }}>

            {/* Top accent */}
            <div style={{ height:'3px', background:'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)' }} />

            {/* Header */}
            <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
                  <Icons.Storage />
                </div>
                <div>
                  <h1 style={{ margin:0, fontSize:'18px', fontWeight:700, color:'#0f172a', fontFamily:"'Lora',serif", letterSpacing:'-0.3px' }}>File Storage</h1>
                  <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontFamily:"'Lora',serif", marginTop:'2px' }}>Persistent · MongoDB backed</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'20px', padding:'6px 14px' }}>
                <Icons.Files />
                <span style={{ fontSize:'13px', color:'#475569', fontFamily:"'Lora',serif", fontWeight:600 }}>{files.length} {files.length===1?'file':'files'}</span>
              </div>
            </div>

            {/* Drop zone + file list — flex column fill */}
            <div style={{ padding:'24px 28px 0', display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
              <div
                className="drop-zone"
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                style={{
                  border:`2px dashed ${drag?'#3b82f6':'#e2e8f0'}`,
                  borderRadius:'12px',
                  padding:'36px 24px',
                  textAlign:'center',
                  background: drag ? 'rgba(59,130,246,0.04)' : '#fafbfc',
                  marginBottom:'24px',
                }}
              >
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <div style={{ color: drag?'#3b82f6':'#94a3b8', transition:'color 0.2s' }}>
                    <Icons.CloudUp />
                  </div>
                  <div>
                    <p style={{ margin:'0 0 4px', fontSize:'15px', fontWeight:600, color:'#1e293b', fontFamily:"'Lora',serif" }}>
                      {uploading ? 'Uploading…' : 'Drop files here'}
                    </p>
                    <p style={{ margin:0, fontSize:'12px', color:'#94a3b8', fontFamily:"'Lora',serif" }}>
                      Any format · Multiple files supported
                    </p>
                  </div>

                  {/* Progress bar */}
                  {uploading && (
                    <div style={{ width:'200px', height:'4px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius:'4px', transition:'width 0.3s' }} />
                    </div>
                  )}

                  <label style={{ cursor: uploading?'not-allowed':'pointer' }}>
                    <input type="file" multiple onChange={e => handleUpload(Array.from(e.target.files))} style={{ display:'none' }} disabled={uploading} />
                    <div style={{
                      display:'flex', alignItems:'center', gap:'8px',
                      padding:'9px 20px', borderRadius:'9px',
                      background: uploading ? '#e2e8f0' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                      color: uploading ? '#94a3b8' : '#fff',
                      fontSize:'13px', fontWeight:600, fontFamily:"'Lora',serif",
                      boxShadow: uploading ? 'none' : '0 2px 8px rgba(59,130,246,0.35)',
                      transition:'all 0.2s',
                    }}>
                      <Icons.Upload />
                      {uploading ? `Uploading ${progress}%…` : 'Select Files'}
                    </div>
                  </label>
                </div>
              </div>

              {/* File list — scrollable */}
              <div style={{ flex:1, overflowY:'auto', paddingBottom:'24px' }}>
              {files.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>
                  <div style={{ color:'#cbd5e1', marginBottom:'12px' }}><Icons.Folder /></div>
                  <p style={{ margin:0, fontSize:'15px', fontWeight:600, color:'#475569', fontFamily:"'Lora',serif" }}>No files yet</p>
                  <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#94a3b8', fontFamily:"'Lora',serif" }}>Upload your first file above</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {files.map((f) => {
                    const { icon, color, bg } = fileIcon(f.mimetype);
                    return (
                      <div key={f._id} className="file-row" style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'10px', border:'1px solid #f1f5f9', background:'#fff', transition:'background 0.15s' }}>

                        {/* Icon badge */}
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                          {icon}
                        </div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#1e293b', fontFamily:"'Lora',serif", whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.filename}</p>
                          <div style={{ display:'flex', gap:'12px', marginTop:'3px', flexWrap:'wrap' }}>
                            {[fmtSize(f.size), new Date(f.uploadedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}), f.mimetype.split('/')[1]?.toUpperCase()].map((s,i) => (
                              <span key={i} style={{ fontSize:'11px', color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>{s}</span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                          <button onClick={() => handleDownload(f._id, f.filename)} className="action-btn" style={{
                            display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px',
                            borderRadius:'8px', background:'#f0fdf4', color:'#16a34a',
                            fontSize:'12px', fontWeight:600, fontFamily:"'Lora',serif",
                            border:'1px solid #bbf7d0',
                          }}>
                            <Icons.Download /> Download
                          </button>
                          <button onClick={() => handleDelete(f._id, f.filename)} className="action-btn" style={{
                            display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px',
                            borderRadius:'8px', background:'#fff1f2', color:'#dc2626',
                            fontSize:'12px', fontWeight:600, fontFamily:"'Lora',serif",
                            border:'1px solid #fecdd3',
                          }}>
                            <Icons.Trash /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>{/* end scrollable */}
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 28px', borderTop:'1px solid #f1f5f9', display:'flex', gap:'20px', flexWrap:'wrap' }}>
              {['Auto-saved to MongoDB','Persists after refresh','Secure download anytime'].map(s => (
                <span key={s} style={{ fontSize:'11px', color:'#94a3b8', fontFamily:"'Lora',serif" }}>✦ {s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}