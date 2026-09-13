import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, KeyRound, Sparkles, X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { requestOtp, registerWithOtp, login, googleLogin, updateProfile } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState(1); // 1: form, 2: otp verification, 3: mobile number

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Reset states when modal is reopened/closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setError('');
      setSuccessMsg('');
      setResendCooldown(0);
      setResendLoading(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setOtp('');
    }
  }, [isOpen]);

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

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
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (phone && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number (numbers only).');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(email);
      setSuccessMsg('6-Digit OTP has been dispatched to your email address!');
      setResendCooldown(30);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      await requestOtp(email);
      setSuccessMsg('A fresh 6-digit OTP code has been sent to your email!');
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Confirm OTP and Complete Registration
  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = String(otp || '').trim().replace(/[^0-9]/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    setLoading(true);
    try {
      await registerWithOtp({
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone ? '+91 ' + cleanPhone : '',
        password,
        otp: cleanOtp,
      });
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Mobile Number (Step 3)
  const handleSavePhoneNumber = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await updateProfile({ phone: '+91 ' + cleanPhone });
      setSuccessMsg('Mobile number saved successfully!');
      setTimeout(() => {
        onAuthSuccess?.();
        onClose();
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '520418077500-r7aao8hd4o3dgjlmte6dn6fcfa9k9gav.apps.googleusercontent.com';
  const googleBtnRef = useRef(null);
  const googleAuthCallbackRef = useRef();

  // Dynamic ref always holding the current mounted modal's callbacks and handlers
  googleAuthCallbackRef.current = async (response) => {
    if (response?.credential) {
      setLoading(true);
      setError('');
      try {
        const res = await googleLogin(response.credential);
        const isNewUser = Boolean(res?.isNewUser || res?.user?.isNewUser);
        const needsPhone = Boolean(res?.user?.needsPhone && !res?.user?.phone);

        // ONLY brand-new users that don't have a phone yet are prompted for step 3
        if (isNewUser && needsPhone) {
          setStep(3);
        } else {
          // Existing users (or users with phone) ALWAYS CLOSE THE MODAL IMMEDIATELY!
          onAuthSuccess?.(res?.user);
          onClose();
        }
      } catch (err) {
        setError('Google Sign-In failed: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !googleClientId) return;

    // Attach global dispatcher so Google GSI always executes the active mounted modal's callback
    window.__googleAuthDispatcher = (res) => {
      googleAuthCallbackRef.current?.(res);
    };

    let checkTimer;
    const initGoogleGSI = () => {
      if (!window.google?.accounts?.id) return false;

      try {
        // Initialize once globally to prevent multiple initialize() warnings
        if (!window.__googleGSIInitialized) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (response) => {
              if (window.__googleAuthDispatcher) {
                window.__googleAuthDispatcher(response);
              }
            },
          });
          window.__googleGSIInitialized = true;
        }

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'pill',
            width: 320,
          });
        }
        return true;
      } catch (err) {
        console.warn('Google GSI render error:', err);
        return false;
      }
    };

    // Dynamically inject script if not yet loaded
    if (!window.google?.accounts?.id && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleGSI();
      document.head.appendChild(script);
    }

    if (!initGoogleGSI()) {
      checkTimer = setInterval(() => {
        if (initGoogleGSI()) {
          clearInterval(checkTimer);
        }
      }, 300);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [googleClientId, isOpen, mode]);

  // Fallback trigger if user clicks manual Google button
  const handleGoogleAuth = () => {
    setError('');
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.prompt((notification) => {
          // If user cancels, closes, or skips, DO NOTHING! Strictly preserve security!
          if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
            console.log('Google Sign-In prompt dismissed by user. No login executed.');
          }
        });
      } catch (err) {
        setError('Please click the Google button directly or use Email OTP.');
      }
    } else {
      setError('Google Sign-In service is connecting. Please use Email OTP or try again.');
    }
  };

  return (
    <div
      className="modal-overlay"
      data-lenis-prevent="true"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="modal-content"
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '6px',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/logo/logo.webp"
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
            {step === 3
              ? 'Enter Your Mobile Number'
              : mode === 'login'
              ? 'Welcome Back'
              : 'Join VIP Grooming Club'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {step === 3
              ? 'Link your phone number to receive appointment confirmations & loyalty stamps'
              : mode === 'login'
              ? 'Access your 5-Coupon Card, appointment history & 30% to 40% OFF rewards'
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


        {/* ========================================================================= */}
        {/* STEP 3: PHONE NUMBER INPUT (AFTER GOOGLE LOGIN) */}
        {/* ========================================================================= */}
        {step === 3 ? (
          <form onSubmit={handleSavePhoneNumber}>
            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--gold-primary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98765 43210"
                  className="input-field"
                  style={{ flex: 1, letterSpacing: '0.08em', fontSize: '1.05rem' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                Your phone number is used for appointment reminders & 5-Coupon loyalty stamps.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem' }}
            >
              {loading ? 'Saving Profile...' : 'Save & Complete Setup'}
            </button>

            <button
              type="button"
              onClick={() => {
                onAuthSuccess?.();
                onClose();
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              Skip for now
            </button>
          </form>
        ) : mode === 'login' ? (
          /* ========================================================================= */
          /* LOGIN FORM */
          /* ========================================================================= */
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
                <label className="input-label">Mobile Number (10 Digits)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div
                    style={{
                      padding: '0.75rem 0.9rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--gold-primary)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    className="input-field"
                    style={{ flex: 1, letterSpacing: '0.08em', fontSize: '1.05rem' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  Numbers only (10 digits). Alphabets are blocked.
                </span>
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
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(val);
                    if (error) setError('');
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(pasted);
                    if (error) setError('');
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  Code sent to {email}
                </span>
              </div>

              {/* Resend OTP Button with Countdown */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '0.75rem 0 1.25rem',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Didn't receive OTP?</span>
                {resendCooldown > 0 ? (
                  <span
                    style={{
                      color: 'var(--gold-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    <RotateCcw size={13} />
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.4rem',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>{resendLoading ? 'Resending...' : 'Resend OTP'}</span>
                  </button>
                )}
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

        {/* ========================================================================= */}
        {/* GOOGLE SIGN-IN & FOOTER (HIDDEN DURING STEP 3) */}
        {/* ========================================================================= */}
        {step !== 3 && (
          <>
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

            {/* Google OAuth Official Button Container */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                minHeight: '44px',
                width: '100%',
              }}
            >
              <div
                ref={googleBtnRef}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                <button
                  onClick={handleGoogleAuth}
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
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
};
