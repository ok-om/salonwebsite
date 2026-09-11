import React from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Scissors, ShieldCheck, Heart } from 'lucide-react';

export const Footer = ({ onOpenAdminLogin }) => {
  const { config } = useSiteConfig();

  return (
    <footer
      style={{
        background: '#07080b',
        position: 'relative',
        zIndex: 50,
        borderTop: '1px solid rgba(212, 175, 55, 0.2)',
        padding: '4rem 0 5rem', // extra padding bottom for mobile bottom nav
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}
        >
          {/* Col 1: Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img
                src="/logo/logo.jpg"
                alt="Logo"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid var(--gold-primary)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                {config.salonName || 'The Classic Cut Salon'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
              {config.tagline || 'Where Vintage Craftsmanship Meets Modern Luxury'}. Premier gentleman barber specializing in precision taper fades, traditional hot-towel straight-razor cuts, and exclusive loyalty rewards.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <a href="#experience" style={{ color: 'inherit', textDecoration: 'none' }}>
                  ✂️ Barber Journey (Scroll Animation)
                </a>
              </li>
              <li>
                <a href="#services" style={{ color: 'inherit', textDecoration: 'none' }}>
                  💈 Services Menu & Rates
                </a>
              </li>
              <li>
                <a href="#owner" style={{ color: 'inherit', textDecoration: 'none' }}>
                  🧔 Master Barber & Story
                </a>
              </li>
              <li>
                <a href="#contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                  📍 Salon Location & Google Map
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Booking */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Salon Hours
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
              {config.openingHours?.weekday || 'Mon - Fri: 9:00 AM - 9:30 PM'}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.2rem' }}>
              {config.openingHours?.weekend || 'Sat - Sun: 8:30 AM - 10:00 PM'}
            </p>
            <a
              href={`tel:${config.phone}`}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.4rem 0.9rem' }}
            >
              📞 Call {config.phone}
            </a>
          </div>

          {/* Col 4: Salon Admin Portal */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
              Staff & Salon Admin
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Salon operators can access the Coupe Stamp registry, visit audit logs, and live CMS editor.
            </p>
            <button
              onClick={onOpenAdminLogin}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', gap: '0.4rem' }}
            >
              <ShieldCheck size={14} color="var(--gold-primary)" />
              <span>Staff / Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} {config.salonName || 'The Classic Cut Salon'}. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Built with MERN Stack & Handcrafted GSAP Animation
          </div>
        </div>
      </div>
    </footer>
  );
};
