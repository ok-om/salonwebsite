import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Scissors, User as UserIcon, Menu, X, Phone, MessageSquare, ShieldCheck, MapPin, Clock, LogOut } from 'lucide-react';

export const Navbar = ({ onOpenAuth, onOpenAdmin, onOpenLoyalty }) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { config } = useSiteConfig();
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const isPast = window.scrollY > 25;
          setScrolled((prev) => (prev !== isPast ? isPast : prev));
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileDrawerOpen]);

  const scrollToSection = (id) => {
    setMobileDrawerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 65;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: scrolled ? '62px' : '68px',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: scrolled ? 'rgba(9, 10, 14, 0.95)' : 'rgba(9, 10, 14, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: scrolled ? '0 8px 30px rgba(0, 0, 0, 0.7)' : 'none',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            gap: '0.5rem',
          }}
        >
          {/* Brand Logo & Name */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              textDecoration: 'none',
              minWidth: 0, // prevents flex item blowout on 320px
            }}
          >
            <img
              src="/logo/logo.jpg"
              alt="Logo"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '2px solid var(--gold-primary)',
                objectFit: 'cover',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.35)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.1,
                }}
              >
                {config.salonName || 'The Classic Cut Salon'}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--gold-primary)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Luxury Barber
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu (hidden on screens <= 860px) */}
          <nav className="desktop-nav-menu" style={{ display: 'none', alignItems: 'center', gap: '1.75rem' }}>
            <button onClick={() => scrollToSection('haircuts')} style={desktopLinkStyle}>
              Haircut Collection
            </button>
            <button onClick={onOpenLoyalty} style={desktopLinkStyle}>
              5-Coupe Card
            </button>
            <button onClick={() => scrollToSection('contact')} style={desktopLinkStyle}>
              Location & Hours
            </button>
          </nav>

          {/* Desktop Right Action Pill Group */}
          <div className="desktop-actions" style={{ display: 'none', alignItems: 'center', gap: '0.6rem' }}>
            {config.whatsapp && (
              <a
                href={`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </a>
            )}

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="btn btn-crimson btn-sm"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                <ShieldCheck size={15} />
                <span>Admin CMS</span>
              </button>
            )}

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={onOpenLoyalty}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  <Scissors size={14} />
                  <span>{user?.currentStamps || 0}/5 Stamps</span>
                </button>
                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                <UserIcon size={14} />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Right: Single Sleek Hamburger Menu Button (Handberg) */}
          <div className="mobile-only-header">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '8px',
                color: 'var(--gold-primary)',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER (Optimized down to 320px) */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '88%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: '#11131a',
              borderLeft: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.9)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(20, 23, 32, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img
                  src="/logo/logo.jpg"
                  alt="Logo"
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid var(--gold-primary)' }}
                />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  The Classic Cut
                </span>
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* VIP Status / Account Card inside Drawer */}
            <div style={{ padding: '1rem' }}>
              {isAuthenticated ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 23, 32, 0.9) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                      {user?.name}
                    </span>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                      {user?.currentStamps || 0}/5 Stamps
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenLoyalty();
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.4rem' }}
                  >
                    <Scissors size={14} />
                    <span>View 5-Coupe Card</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      logout();
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.65rem' }}>
                    Log in to track your 5 visits and claim free grooming offers!
                  </p>
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenAuth();
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem' }}
                  >
                    <UserIcon size={14} />
                    <span>Login / Register (Email OTP)</span>
                  </button>
                </div>
              )}

              {/* Navigation Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button onClick={() => scrollToSection('haircuts')} style={mobileMenuItemStyle}>
                  <span>✂️</span> The Master Haircut Gallery
                </button>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenLoyalty();
                  }}
                  style={{
                    ...mobileMenuItemStyle,
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: 'var(--gold-primary)',
                  }}
                >
                  <span>🎟️</span> 5-Coupe Stamp Card
                </button>
                <button onClick={() => scrollToSection('contact')} style={mobileMenuItemStyle}>
                  <span>📍</span> Location & Timings
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenAdmin();
                    }}
                    style={{
                      ...mobileMenuItemStyle,
                      color: '#ff8080',
                      borderColor: 'rgba(229, 62, 62, 0.4)',
                      background: 'rgba(229, 62, 62, 0.1)',
                      marginTop: '0.5rem',
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Admin CMS & Stamp Manager</span>
                  </button>
                )}
              </div>

              {/* Fast Contact Actions */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <a
                    href={`tel:${config.phone}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                    <Clock size={12} color="var(--gold-primary)" />
                    <span>{config.openingHours?.weekday || '9:00 AM - 9:30 PM'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} color="var(--gold-primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {config.address || 'Royal Heritage Boulevard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Breakpoint CSS Injection */}
      <style>{`
        @media (min-width: 861px) {
          .desktop-nav-menu {
            display: flex !important;
          }
          .desktop-actions {
            display: flex !important;
          }
          .mobile-only-header {
            display: none !important;
          }
        }
        @media (max-width: 860px) {
          .desktop-nav-menu {
            display: none !important;
          }
          .desktop-actions {
            display: none !important;
          }
          .mobile-only-header {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};

const desktopLinkStyle = {
  background: 'none',
  border: 'none',
  color: '#e2e8f0',
  fontSize: '0.92rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: '0.3rem 0',
  transition: 'color 0.2s ease',
  fontFamily: 'var(--font-sans)',
};

const mobileMenuItemStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'var(--radius-sm)',
  color: '#ffffff',
  fontSize: '0.88rem',
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontFamily: 'var(--font-sans)',
  transition: 'background 0.2s ease, border-color 0.2s ease',
};
