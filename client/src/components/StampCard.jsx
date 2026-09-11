import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import API from '../services/api';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Scissors, Gift, Clock, Sparkles, QrCode as QrIcon, X } from 'lucide-react';

export const StampCard = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const { config } = useSiteConfig();

  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCouponQr, setSelectedCouponQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const fetchLoyalty = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await API.get('/loyalty/my-stamps');
      setLoyaltyData(res.data);

      if (res.data.coupons && res.data.coupons.length > 0 && !res.data.coupons[0].isRedeemed) {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Failed to load loyalty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchLoyalty();
    }
  }, [isOpen, isAuthenticated]);

  const showQrCode = async (coupon) => {
    try {
      const qr = await QRCode.toDataURL(coupon.code, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0b0c10',
          light: '#f4f5f8',
        },
      });
      setQrDataUrl(qr);
      setSelectedCouponQr(coupon);
    } catch (err) {
      console.error('QR Error:', err);
    }
  };

  if (!isOpen) return null;

  const currentStamps = loyaltyData?.currentStamps ?? user?.currentStamps ?? 0;
  const stampsNeeded = 5 - currentStamps;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '0.75rem' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          padding: '1.5rem 1rem',
          border: '1px solid var(--border-glow)',
          background: '#12141c',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.5rem',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--gold-primary)',
              marginBottom: '0.5rem',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Gift size={24} />
          </div>
          <h3 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.55rem)', marginBottom: '0.2rem' }}>
            VIP <span className="gold-text">5-Coupe Card</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            Every visit earns you 1 stamp. Collect 5 to automatically receive 1 Free Offer Coupon!
          </p>
        </div>

        {!isAuthenticated ? (
          <div style={{ textAlign: 'center', padding: '1.25rem 0' }}>
            <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Please login or register to track your salon stamps and claim free offers.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              Sign In / Register With OTP
            </button>
          </div>
        ) : (
          <div>
            {/* Stamp Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1d27 0%, #0f1118 100%)',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 0.85rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                marginBottom: '1.25rem',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px dashed rgba(212, 175, 55, 0.25)',
                  paddingBottom: '0.6rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: '#ffffff', letterSpacing: '0.04em' }}>
                    {user?.name || 'Valued Guest'}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>
                    Total Visits: {loyaltyData?.lifetimeVisits ?? user?.lifetimeVisits ?? 0}
                  </span>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                  {currentStamps}/5 Stamps
                </span>
              </div>

              {/* 5 Fluid Stamp Circles (Fitting seamlessly on 320px) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '1rem',
                }}
              >
                {[1, 2, 3, 4, 5].map((slotNumber) => {
                  const isStamped = slotNumber <= currentStamps;
                  const isFifthSlot = slotNumber === 5;

                  return (
                    <div
                      key={slotNumber}
                      style={{
                        flex: 1,
                        maxWidth: '52px',
                        minWidth: '38px',
                        aspectRatio: '1/1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: isStamped
                          ? 'var(--gold-gradient)'
                          : isFifthSlot
                          ? 'rgba(197, 34, 34, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isStamped
                          ? '1.5px solid #ffffff'
                          : isFifthSlot
                          ? '1.5px dashed var(--crimson-light)'
                          : '1.5px dashed rgba(255, 255, 255, 0.2)',
                        color: isStamped ? '#0b0c10' : isFifthSlot ? 'var(--crimson-light)' : 'var(--text-muted)',
                        boxShadow: isStamped ? '0 0 12px rgba(212, 175, 55, 0.6)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isStamped ? (
                        <Scissors size={16} strokeWidth={2.5} />
                      ) : isFifthSlot ? (
                        <Gift size={16} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>#{slotNumber}</span>
                      )}
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, marginTop: '0.1rem' }}>
                        {isStamped ? 'DONE' : isFifthSlot ? 'FREE' : `#${slotNumber}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Notice */}
              <div
                style={{
                  background: 'rgba(11, 12, 16, 0.75)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                }}
              >
                <Sparkles size={14} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <span style={{ color: '#e2e8f0' }}>
                  {stampsNeeded > 0 ? (
                    <>
                      Just <strong style={{ color: 'var(--gold-primary)' }}>{stampsNeeded} visit{stampsNeeded > 1 ? 's' : ''}</strong> to unlock your next free coupon!
                    </>
                  ) : (
                    <strong style={{ color: '#2ecc71' }}>
                      🎉 5 Stamps Achieved! Offer Coupon generated & stamps reset to 0!
                    </strong>
                  )}
                </span>
              </div>
            </div>

            {/* Unlocked Offer Coupons */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Gift size={16} color="var(--gold-primary)" />
                <span>Unlocked Offer Coupons ({loyaltyData?.coupons?.length || 0})</span>
              </h4>

              {loyaltyData?.coupons?.length === 0 ? (
                <div
                  style={{
                    padding: '1.2rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                  }}
                >
                  No offers yet. Reach 5 visits to earn your free reward!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {loyaltyData?.coupons?.map((coupon) => (
                    <div
                      key={coupon._id}
                      style={{
                        background: coupon.isRedeemed ? 'rgba(255,255,255,0.03)' : 'rgba(212, 175, 55, 0.08)',
                        border: coupon.isRedeemed ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(212, 175, 55, 0.35)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.92rem',
                              color: coupon.isRedeemed ? 'var(--text-muted)' : 'var(--gold-primary)',
                            }}
                          >
                            {coupon.code}
                          </span>
                          <span className={coupon.isRedeemed ? 'badge badge-crimson' : 'badge badge-green'} style={{ fontSize: '0.65rem' }}>
                            {coupon.isRedeemed ? 'REDEEMED' : 'ACTIVE'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
                          {coupon.title || config.defaultOfferTitle}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Valid until {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      </div>

                      {!coupon.isRedeemed && (
                        <button
                          onClick={() => showQrCode(coupon)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <QrIcon size={13} />
                          <span>Show QR</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visit History Log */}
            {loyaltyData?.recentVisits && loyaltyData.recentVisits.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.88rem', marginBottom: '0.45rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} />
                  <span>Recent Visits Log</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {loyaltyData.recentVisits.map((visit) => (
                    <div
                      key={visit._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.65rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ color: '#e2e8f0' }}>{visit.serviceName}</span>
                      <span style={{ color: 'var(--gold-primary)' }}>
                        {new Date(visit.visitedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Code Presentation Modal */}
        {selectedCouponQr && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11, 12, 16, 0.97)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 100,
            }}
          >
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--gold-primary)' }}>
              Counter Redemption QR
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
              Present this QR to the salon receptionist or admin to claim your free reward!
            </p>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Coupon QR"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '10px',
                  border: '2px solid var(--gold-primary)',
                  marginBottom: '0.75rem',
                }}
              />
            )}

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
              }}
            >
              {selectedCouponQr.code}
            </div>

            <button
              onClick={() => setSelectedCouponQr(null)}
              className="btn btn-secondary btn-sm"
            >
              Back to Stamp Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
