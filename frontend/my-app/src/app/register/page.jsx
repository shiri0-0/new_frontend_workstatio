'use client';

import { useState } from 'react';

export default function AuthForm() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    otp: ''
  });
  
  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  });
  const [awaitingResetOTP, setAwaitingResetOTP] = useState(false);
  const [awaitingOTP, setAwaitingOTP] = useState(false);

  const API_URL = 'http://localhost:5001/api/auth';

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (data.message && data.message.toLowerCase().includes('verify')) {
          throw new Error('Please verify your email before logging in. Check your inbox for the OTP.');
        }
        throw new Error(data.message || 'Login failed');
      }
      
      localStorage.setItem('token', data.token);
      setMessage('Login successful! Redirecting...');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Send OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordData.email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      setMessage(data.message);
      setAwaitingResetOTP(true);
      
    } catch (err) {
      setError(err.message);
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          otp: forgotPasswordData.otp,
          newPassword: forgotPasswordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      
      setMessage(data.message + ' Redirecting to login...');
      
      setTimeout(() => {
        setIsForgotPassword(false);
        setAwaitingResetOTP(false);
        setForgotPasswordData({ email: '', otp: '', newPassword: '' });
        setMessage('');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register (Initial)
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setMessage(data.message || 'OTP sent to your email. Please verify.');
      setAwaitingOTP(true);
      
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          otp: registerData.otp
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      setMessage(data.message + ' You can now log in!');
      
      setTimeout(() => {
        setIsActive(false);
        setAwaitingOTP(false);
        setRegisterData({ name: '', email: '', password: '', otp: '' });
        setMessage('');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] p-4">
      <div className="relative w-full max-w-[850px] h-[500px] bg-[#0f0f1e] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
        
        {/* Message/Error Display */}
        {(message || error) && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg max-w-[90%] text-center ${
            error ? 'bg-red-500/90' : 'bg-green-500/90'
          } text-white text-sm font-semibold shadow-lg backdrop-blur-sm`}>
            {error || message}
          </div>
        )}

        {/* Purple Diagonal Background */}
        <div 
          className="absolute top-0 h-full bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] transition-all duration-700 ease-in-out"
          style={{
            left: isActive ? 0 : '45%',
            width: '55%',
            clipPath: isActive 
              ? 'polygon(0 0, 80% 0, 100% 100%, 0 100%)' 
              : 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)'
          }}
        />

        {/* Login Form */}
        {!isForgotPassword && (
          <div 
            className="absolute top-0 w-[45%] h-full flex justify-center flex-col px-12 z-20 transition-all duration-700"
            style={{
              left: isActive ? '-45%' : 0,
              opacity: isActive ? 0 : 1,
              pointerEvents: isActive ? 'none' : 'auto'
            }}
          >
            <form autoComplete="off" onSubmit={handleLogin}>
              <h2 className="text-3xl font-bold text-white mb-8">
                Login
              </h2>
              
              <div className="space-y-5">
                {/* Email Input */}
                <div className="relative w-full">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-[#667eea] transition-colors"
                  />
                </div>

                {/* Password Input */}
                <div className="relative w-full">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-[#667eea] transition-colors"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-sm text-gray-400 hover:text-[#667eea] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold 
                           py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Login'}
                </button>

                {/* Register Link */}
                <div className="text-center text-sm text-gray-400 mt-6">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsActive(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-[#667eea] hover:text-[#764ba2] font-semibold transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Forgot Password Form */}
        {isForgotPassword && (
          <div 
            className="absolute top-0 w-[45%] h-full flex justify-center flex-col px-12 z-20 transition-all duration-700"
            style={{
              left: isActive ? '-45%' : 0
            }}
          >
            <form autoComplete="off" onSubmit={awaitingResetOTP ? handleResetPassword : handleForgotPassword}>
              <h2 className="text-3xl font-bold text-white mb-8">
                {awaitingResetOTP ? 'Reset Password' : 'Forgot Password'}
              </h2>
              
              <div className="space-y-5">
                {!awaitingResetOTP ? (
                  <>
                    {/* Email Input */}
                    <div className="relative w-full">
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotPasswordData.email}
                        onChange={(e) => setForgotPasswordData({...forgotPasswordData, email: e.target.value})}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                                 focus:outline-none focus:border-[#667eea] transition-colors"
                      />
                    </div>

                    {/* Send OTP Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold 
                               py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* OTP Input */}
                    <div className="relative w-full">
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        OTP
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotPasswordData.otp}
                        onChange={(e) => setForgotPasswordData({...forgotPasswordData, otp: e.target.value})}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                                 focus:outline-none focus:border-[#667eea] transition-colors"
                      />
                    </div>

                    {/* New Password Input */}
                    <div className="relative w-full">
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotPasswordData.newPassword}
                        onChange={(e) => setForgotPasswordData({...forgotPasswordData, newPassword: e.target.value})}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                                 focus:outline-none focus:border-[#667eea] transition-colors"
                      />
                    </div>

                    {/* Reset Password Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold 
                               py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </>
                )}

                {/* Back to Login Link */}
                <div className="text-center text-sm text-gray-400 mt-6">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setAwaitingResetOTP(false);
                      setForgotPasswordData({ email: '', otp: '', newPassword: '' });
                      setError('');
                      setMessage('');
                    }}
                    className="text-[#667eea] hover:text-[#764ba2] font-semibold transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Welcome Back Section (Right side when Login is active) */}
        <div 
          className="absolute top-0 w-[55%] h-full flex flex-col justify-center items-start px-16 z-10 transition-all duration-700"
          style={{
            right: isActive ? '100%' : 0,
            opacity: isActive ? 0 : 1
          }}
        >
          <h2 className="text-5xl font-bold text-white mb-4 uppercase tracking-wide">
            Welcome<br />Back!
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed max-w-md">
            We're delighted to have you here. Sign in to continue your journey with us.
          </p>
        </div>

        {/* Register Form */}
        <div 
          className="absolute top-0 w-[45%] h-full flex justify-center flex-col px-12 z-20 transition-all duration-700"
          style={{
            right: isActive ? 0 : '-45%',
            opacity: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none'
          }}
        >
          <form autoComplete="off" onSubmit={awaitingOTP ? handleVerifyOTP : handleRegister}>
            <h2 className="text-3xl font-bold text-white mb-8">
              {awaitingOTP ? 'Verify OTP' : 'Sign Up'}
            </h2>
            
            <div className="space-y-5">
              {!awaitingOTP && (
                <>
                  {/* Username Input */}
                  <div className="relative w-full">
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-[#667eea] transition-colors"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="relative w-full">
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-[#667eea] transition-colors"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative w-full">
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-[#667eea] transition-colors"
                    />
                  </div>
                </>
              )}

              {awaitingOTP && (
                /* OTP Input */
                <div className="relative w-full">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Enter OTP sent to {registerData.email}
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.otp}
                    onChange={(e) => setRegisterData({...registerData, otp: e.target.value})}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-[#667eea] transition-colors"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              )}

              {/* Register/Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold 
                         py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : awaitingOTP ? 'Verify OTP' : 'Sign Up'}
              </button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsActive(false);
                    setAwaitingOTP(false);
                    setError('');
                    setMessage('');
                  }}
                  className="text-[#667eea] hover:text-[#764ba2] font-semibold transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Welcome Section (Left side when Register is active) */}
        <div 
          className="absolute top-0 w-[55%] h-full flex flex-col justify-center items-start px-16 z-10 transition-all duration-700"
          style={{
            left: isActive ? 0 : '-100%',
            opacity: isActive ? 1 : 0
          }}
        >
          <h2 className="text-5xl font-bold text-white mb-4 uppercase tracking-wide">
            Welcome!
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed max-w-md">
            Join us today and discover amazing features. Create your account to get started.
          </p>
        </div>
      </div>
    </div>
  );
}