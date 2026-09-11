import React from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { MapPin, Phone, MessageSquare, Clock, ExternalLink } from 'lucide-react';

export const LocationContact = () => {
  const { config } = useSiteConfig();

  return (
    <section
      id="contact"
      style={{
        padding: '5rem 0',
        background: '#090a0e',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div className="section-tagline">
            <MapPin size={13} />
            <span>Visit The Salon</span>
          </div>
          <h2 className="section-title">
            Prime Location & <span className="gold-text">Timings</span>
          </h2>
          <p className="section-subtitle">
            Walk into luxury or schedule your private grooming consultation directly.
          </p>
        </div>

        <div className="contact-grid">
          {/* Contact & Hours Card */}
          <div
            className="glass-card contact-card"
            style={{
              padding: '2rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: '#ffffff' }}>
                Salon Address & Reservations
              </h3>

              {/* Physical Address */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <MapPin size={18} color="var(--gold-primary)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={infoLabelStyle}>Physical Address</span>
                  <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {config.address || 'Shop 14, Royal Heritage Arcade, High Street Boulevard, New Delhi, India'}
                  </p>
                </div>
              </div>

              {/* Phone Calling */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <Phone size={18} color="var(--gold-primary)" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Telephone / Reservations</span>
                  <a
                    href={`tel:${config.phone}`}
                    style={{ color: 'var(--gold-primary)', fontSize: '0.98rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {config.phone || '+91 98765 43210'}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <MessageSquare size={18} color="#2ecc71" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Direct WhatsApp Desk</span>
                  <a
                    href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}?text=Hello%20The%20Classic%20Cut%20Salon!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <Clock size={18} color="var(--gold-primary)" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Working Hours</span>
                  <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: '0.1rem 0' }}>
                    {config.openingHours?.weekday || 'Mon - Fri: 9:00 AM - 9:30 PM'}
                  </p>
                  <p style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                    {config.openingHours?.weekend || 'Sat - Sun: 8:30 AM - 10:00 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Call & WhatsApp Action Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <a
                href={`tel:${config.phone}`}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '120px', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
              >
                <Phone size={15} />
                <span>Call Salon</span>
              </a>
              <a
                href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ flex: 1, minWidth: '120px', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
              >
                <MessageSquare size={15} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed */}
          <div
            className="glass-card"
            style={{
              overflow: 'hidden',
              padding: 0,
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <iframe
              title="Salon Google Maps Location"
              src={config.mapEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.482084055276!2d77.2195022!3d28.6152436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd37b9277f97%3A0x6b8f36c4b2ffb39c!2sConnaught%20Place!5e0!3m2!1sen!2sin!4v1700000000000'}
              width="100%"
              height="100%"
              style={{
                border: 0,
                flex: 1,
                minHeight: '280px',
                filter: 'invert(90%) hue-rotate(180deg) contrast(1.1) brightness(0.85)',
              }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }
        @media (min-width: 769px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
          }
        }
        @media (max-width: 480px) {
          .contact-card {
            padding: 1.4rem 0.9rem !important;
          }
        }
      `}</style>
    </section>
  );
};

const infoItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.85rem',
  marginBottom: '1.1rem',
};

const iconBoxStyle = {
  width: '38px',
  height: '38px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const infoLabelStyle = {
  display: 'block',
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  fontWeight: 600,
  marginBottom: '0.15rem',
};
