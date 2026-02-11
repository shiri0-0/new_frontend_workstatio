'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textareaSize, setTextareaSize] = useState('medium'); // small, medium, large
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large

  // Load text on component mount
  useEffect(() => {
    loadText();
  }, []);

  // Load text from database
  const loadText = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/text');
      const data = await response.json();
      if (data.text) {
        setText(data.text);
      }
    } catch (error) {
      console.error('Error loading text:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save text to database with debounce
  const saveText = async (newText) => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:5001/api/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      const data = await response.json();
      console.log('Saved successfully:', data);
    } catch (error) {
      console.error('Error saving text:', error);
      alert('Error saving text. Please check if backend is running.');
    } finally {
      setSaving(false);
    }
  };

  // Handle text change with debounce
  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Clear previous timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout to save after 500ms of no typing
    const timeout = setTimeout(() => {
      saveText(newText);
    }, 500);
    
    setSaveTimeout(timeout);
  };

  // Handle clear button
  const handleClear = async () => {
    setText('');
    await saveText('');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Copy text to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Text copied to clipboard! ✅');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy text');
    }
  };

  // Get textarea height based on size
  const getTextareaHeight = () => {
    if (isFullscreen) return 'calc(100vh - 12rem)';
    switch (textareaSize) {
      case 'small':
        return 'h-48';
      case 'medium':
        return 'h-64';
      case 'large':
        return 'h-96';
      default:
        return 'h-64';
    }
  };

  // Get font size class
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      case 'xlarge':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Left aligned with reduced width */}
      <div className={`${isFullscreen ? 'max-w-full h-full' : 'max-w-2xl ml-4 md:ml-8'}`}>
        <div className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 md:p-6 border border-white/20 ${isFullscreen ? 'h-full' : ''}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white">Persistent Text Area</h1>
            
            <div className="flex items-center gap-2 flex-wrap">
              {saving && (
                <span className="text-green-400 text-xs animate-pulse">Saving...</span>
              )}
              
              {/* Font Size buttons */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    fontSize === 'small' 
                      ? 'bg-green-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Small Font"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-2 py-1 text-sm rounded transition-colors ${
                    fontSize === 'medium' 
                      ? 'bg-green-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Medium Font"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 text-base rounded transition-colors ${
                    fontSize === 'large' 
                      ? 'bg-green-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Large Font"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-2 py-1 text-lg rounded transition-colors ${
                    fontSize === 'xlarge' 
                      ? 'bg-green-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Extra Large Font"
                >
                  A
                </button>
              </div>
              
              {/* Size buttons */}
              {!isFullscreen && (
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setTextareaSize('small')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      textareaSize === 'small' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Small Size"
                  >
                    S
                  </button>
                  <button
                    onClick={() => setTextareaSize('medium')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      textareaSize === 'medium' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Medium Size"
                  >
                    M
                  </button>
                  <button
                    onClick={() => setTextareaSize('large')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      textareaSize === 'large' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                    title="Large Size"
                  >
                    L
                  </button>
                </div>
              )}
              
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center gap-1"
                title="Copy Text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              
              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center gap-1"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exit
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                    </svg>
                    Full
                  </>
                )}
              </button>
              
              {/* Clear button */}
              <button
                onClick={handleClear}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={handleChange}
            placeholder="Type something here... It will be saved automatically!"
            className={`w-full ${isFullscreen ? '' : getTextareaHeight()} ${isFullscreen ? 'flex-1' : ''} bg-white/5 text-white placeholder-white/40 border-2 border-white/20 rounded-xl p-4 focus:outline-none focus:border-purple-400 transition-colors duration-200 resize-none font-mono ${getFontSizeClass()}`}
            style={isFullscreen ? { height: 'calc(100vh - 12rem)' } : {}}
          />

          {/* Footer info */}
          <div className="mt-4 text-white/60 text-xs space-y-1">
            <p>✨ Auto-saved • 🔒 Persistent • 🗑️ Clear • 📐 S/M/L size • 🔤 Font size • 📋 Copy • ⛶ Fullscreen</p>
          </div>
        </div>
      </div>
    </div>
  );
}