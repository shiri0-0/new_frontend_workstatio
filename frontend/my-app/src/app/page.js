'use client';
import { useState, useEffect } from 'react';

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  // Load all files from database
  const loadFiles = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/files');
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Convert file to base64
        const base64 = await fileToBase64(file);
        
        const response = await fetch('http://localhost:5001/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            mimetype: file.type,
            size: file.size,
            data: base64,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
      }

      // Reload files after upload
      await loadFiles();
      alert('Files uploaded successfully! ✅');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFileUpload(selectedFiles);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  // Download file
  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`http://localhost:5001/api/files/${fileId}`);
      const data = await response.json();

      if (data.success) {
        // Convert base64 to blob
        const byteCharacters = atob(data.file.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.file.mimetype });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  // Delete file
  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      const response = await fetch(`http://localhost:5001/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFiles();
        alert('File deleted successfully! 🗑️');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
    return '📁';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Persistent File Storage</h1>
              <p className="text-white/60 text-sm">Upload files and they'll stay forever until you delete them</p>
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-semibold">{files.length}</span> files stored
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-white/30 bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl">📤</div>
              <div>
                <p className="text-white text-lg font-semibold mb-2">
                  {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </p>
                <p className="text-white/60 text-sm">
                  Any file type • Any size • Multiple files supported
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
                  {uploading ? 'Uploading...' : 'Select Files'}
                </div>
              </label>
            </div>
          </div>

          {/* Files List */}
          {files.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-lg">No files uploaded yet</p>
              <p className="text-sm mt-2">Upload your first file to get started!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-3xl flex-shrink-0">
                        {getFileIcon(file.mimetype)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-3 text-white/60 text-sm mt-1">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="truncate">{file.mimetype}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(file._id, file.filename)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(file._id, file.filename)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-white/60 text-sm space-y-1">
              <p>✨ Files are automatically saved to MongoDB</p>
              <p>🔒 Files persist even after refresh or browser close</p>
              <p>📥 Download any file anytime</p>
              <p>🗑️ Only you can delete your files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}