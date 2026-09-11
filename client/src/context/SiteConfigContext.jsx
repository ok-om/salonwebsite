import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const SiteConfigContext = createContext();

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    salonName: 'The Classic Cut Salon',
    tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
    aboutStory: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
    phone: '+91 98765 43210',
    whatsapp: '+919876543210',
    email: 'contact@classiccutsalon.com',
    address: 'Shop 14, Royal Heritage Arcade, High Street Boulevard, New Delhi, India',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.482084055276!2d77.2195022!3d28.6152436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd37b9277f97%3A0x6b8f36c4b2ffb39c!2sConnaught%20Place!5e0!3m2!1sen!2sin!4v1700000000000',
    openingHours: {
      weekday: 'Mon - Fri: 9:00 AM - 9:30 PM',
      weekend: 'Sat - Sun: 8:30 AM - 10:00 PM',
    },
    ownerName: 'Master Barber Alex Thorne',
    ownerTitle: 'Founder & Chief Barber',
    ownerBio: 'With over 15 years mastering British and Italian scissor sculpting and straight-razor artistry, Alex founded The Classic Cut Salon to bring authentic gentleman luxury and personalized grooming back to the modern man.',
    ownerImage: '',
    heroVideoUrl: '/video/backgroundvideo.mp4',
    defaultOfferTitle: 'Complimentary Royal Haircut & Beard Sculpting',
    defaultOfferDiscount: '100% OFF / FREE SERVICE',
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await API.get('/cms/config');
      if (res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch remote CMS config, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfigData) => {
    const res = await API.put('/cms/config', newConfigData);
    setConfig(res.data.config);
    return res.data;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        loading,
        updateConfig,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
