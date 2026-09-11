import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, KeyRound, Sparkles, X, CheckCircle, AlertCircle } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { requestOtp, registerWithOtp, login, googleLogin } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState(1); // 1: form, 2: otp verification

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [devOtpHint, setDevOtpHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP for Registration
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!name || !email || !password) {
      setError('Please fill in Name, Email and Password.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(email);
      setSuccessMsg('6-Digit OTP has been dispatched to your email address!');
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP and Complete Registration
  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 6) {
      setError('Please enter the valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await registerWithOtp({
        name,
        email,
        phone,
        password,
        otp,
      });
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Mock / One-Tap Google Auth Simulation
  const handleGoogleSimulatedLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Create lightweight simulated OAuth payload for testing
      const fakeGoogleToken = btoa(JSON.stringify({
        email: email || 'guest.gentleman@gmail.com',
        name: name || 'Gentleman Guest',
        sub: 'google_' + Date.now(),
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      }));

      await googleLogin(fakeGoogleToken);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError('Google Sign-In failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/logo/logo.jpg"
            alt="Logo"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid var(--gold-primary)',
              margin: '0 auto 0.75rem',
              display: 'block',
            }}
          />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join VIP Grooming Club'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mode === 'login'
              ? 'Access your 5-Coupe Card, appointment history & rewards'
              : 'Register to unlock automated visit stamps & complimentary offers'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(197, 34, 34, 0.15)',
              border: '1px solid rgba(197, 34, 34, 0.4)',
              color: '#ff8080',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(46, 204, 113, 0.15)',
              border: '1px solid rgba(46, 204, 113, 0.4)',
              color: '#2ecc71',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {devOtpHint && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              color: 'var(--gold-primary)',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            💡 Dev Mode OTP: <strong>{devOtpHint}</strong> (Auto-detected from server)
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOGIN FORM */}
        {/* ========================================================================= */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In To Account'}
            </button>
          </form>
        ) : (
          /* ========================================================================= */
          /* REGISTER WITH OTP FORM */
          /* ========================================================================= */
          step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Gentleman's Name"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address (For OTP)</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Choose Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1.25rem' }}
              >
                {loading ? 'Sending OTP...' : 'Send 6-Digit Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyRegister}>
              <div className="input-group" style={{ textAlign: 'center' }}>
                <label className="input-label">Enter 6-Digit Email OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="input-field"
                  style={{
                    letterSpacing: '0.4em',
                    fontSize: '1.6rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  Code sent to {email}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Registration'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginBottom: '1.25rem' }}
              >
                Change Email / Back
              </button>
            </form>
          )
        )}

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1rem 0 1.25rem',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span>OR SIGN IN WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSimulatedLogin}
          type="button"
          disabled={loading}
          style={{
            width: '100%',
            background: '#ffffff',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '0.75rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            marginBottom: '1.5rem',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setStep(1);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Register with Email OTP
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
