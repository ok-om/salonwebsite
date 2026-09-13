import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { SmoothScrollProvider, useSmoothScroll } from './context/SmoothScrollContext';
import { Navbar } from './components/Navbar';
import { HeroVideo } from './components/HeroVideo';
import { HairCutScrollShowcase } from './components/HairCutScrollShowcase';
import { ModernServicesExperience } from './components/ModernServicesExperience';
import { LocationContact } from './components/LocationContact';
import { Footer } from './components/Footer';
import { Home, Scissors, Gift, Phone, User, ShieldCheck } from 'lucide-react';

// Code-split interactive modals on-demand to reduce initial JS payload
const StampCard = React.lazy(() => import('./components/StampCard').then(m => ({ default: m.StampCard })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AdminDashboard = React.lazy(() => import('./components/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const MainContent = ({ isLoading }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { config } = useSiteConfig();
  const { scrollTo, stopScroll, startScroll } = useSmoothScroll();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [stampCardOpen, setStampCardOpen] = useState(false);
  const [stampCardTab, setStampCardTab] = useState('profile');
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);

  const handleOpenLoyalty = (tab = 'stamps') => {
    setStampCardTab(tab);
    setStampCardOpen(true);
  };

  const handleOpenProfile = (tab = 'profile') => {
    setStampCardTab(tab);
    setStampCardOpen(true);
  };

  // Lock smooth scroll when any modal dialog is active
  React.useEffect(() => {
    if (authModalOpen || stampCardOpen || adminDashboardOpen) {
      stopScroll();
    } else {
      startScroll();
    }
  }, [authModalOpen, stampCardOpen, adminDashboardOpen]);

  const scrollToHaircuts = () => {
    scrollTo('#haircuts', { offset: -65 });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Glassmorphic Navigation Bar (320px responsive with gold Hamburger menu) */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onOpenLoyalty={() => handleOpenLoyalty('stamps')}
        onOpenProfile={(tab) => handleOpenProfile(tab || 'profile')}
      />

      {/* 2. Hero Section with Crystal Clear Video Directly Under Navbar */}
      <HeroVideo
        onOpenLoyalty={() => handleOpenLoyalty('stamps')}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onScrollToExperience={scrollToHaircuts}
        isReady={!isLoading}
      />

      {/* 3. The Centerpiece Master Haircut Scroll Experience */}
      <HairCutScrollShowcase
        onOpenLoyalty={() => handleOpenLoyalty('stamps')}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
      />

      {/* 4. Modern Services Experience (Scalloped canopy, Scissor ribbon headline, 8 Pop Shapes, 3 Vibrant Cards, and Extra Atelier Art) */}
      <ModernServicesExperience />

      {/* 5. Salon Location, Hours & WhatsApp Desk */}
      <LocationContact />

      {/* 5. Footer */}
      <Footer
        onOpenAdminLogin={() => {
          if (isAdmin) {
            setAdminDashboardOpen(true);
          } else {
            setAuthModalOpen(true);
          }
        }}
      />

      {/* Mobile-First Floating Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mobile-nav-item"
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button onClick={scrollToHaircuts} className="mobile-nav-item">
          <Scissors size={18} />
          <span>Haircuts</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => setAdminDashboardOpen(true)}
            className="mobile-nav-item"
            style={{ color: '#ff8080' }}
          >
            <ShieldCheck size={20} />
            <span style={{ fontWeight: 700 }}>Admin CMS</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenLoyalty('stamps')}
            className="mobile-nav-item"
            style={{ color: 'var(--gold-primary)' }}
          >
            <Gift size={20} />
            <span style={{ fontWeight: 700 }}>5-Coupon</span>
          </button>
        )}

        <button
          onClick={() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mobile-nav-item"
        >
          <Phone size={18} />
          <span>Location</span>
        </button>

        <button
          onClick={() => {
            if (isAdmin) {
              setAdminDashboardOpen(true);
            } else if (isAuthenticated) {
              handleOpenProfile('profile');
            } else {
              setAuthModalOpen(true);
            }
          }}
          className="mobile-nav-item"
        >
          {isAdmin ? <ShieldCheck size={18} color="#ff6b6b" /> : <User size={18} />}
          <span>{isAdmin ? 'Admin' : isAuthenticated ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>

      {/* Interactive Modals (Code-split on demand) */}
      <React.Suspense fallback={null}>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onAuthSuccess={(authResultUser) => {
              setAuthModalOpen(false);
              const activeUser = authResultUser || user;
              if (activeUser?.role === 'admin' || activeUser?.email === 'ok8023361@gmail.com') {
                setAdminDashboardOpen(true);
              }
            }}
          />
        )}

        {stampCardOpen && (
          <StampCard
            isOpen={stampCardOpen}
            initialTab={stampCardTab}
            onClose={() => setStampCardOpen(false)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenAdmin={() => {
              setStampCardOpen(false);
              setAdminDashboardOpen(true);
            }}
          />
        )}

        {adminDashboardOpen && (
          <AdminDashboard
            isOpen={adminDashboardOpen}
            onClose={() => setAdminDashboardOpen(false)}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <SmoothScrollProvider>
          <MainContent isLoading={false} />
        </SmoothScrollProvider>
      </SiteConfigProvider>
    </AuthProvider>
  );
}
