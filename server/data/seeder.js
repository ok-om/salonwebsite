import { User } from '../models/User.js';
import { SiteConfig } from '../models/SiteConfig.js';
import { Service } from '../models/Service.js';

export const seedInitialData = async () => {
  try {
    if (User.db.readyState !== 1) {
      console.log('ℹ️ MongoDB not connected yet. Seeder will run when database connection is established.');
      return;
    }
    // 1. Seed Admin User if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('⚡ Seeding initial default Admin account...');
      await User.create({
        name: 'Master Barber (Salon Admin)',
        email: process.env.ADMIN_EMAIL || 'admin@classiccut.com',
        phone: '+919876543210',
        password: process.env.ADMIN_PASSWORD || 'admin12345',
        role: 'admin',
        isVerified: true,
      });
      console.log('✅ Default Admin seeded: admin@classiccut.com / admin12345');
    }

    // 2. Seed Site Config if none exists
    const configExists = await SiteConfig.findOne();
    if (!configExists) {
      console.log('⚡ Seeding default Site CMS configuration...');
      await SiteConfig.create({
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
      console.log('✅ Default Site CMS config seeded');
    }

    // 3. Seed Services if empty
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
      console.log('⚡ Seeding luxury salon services...');
      const defaultServices = [
        {
          name: 'Signature Gentleman Scissor Cut',
          category: 'Hair Styling',
          price: 499,
          duration: '35 mins',
          description: 'Precision scissor consultation, personalized taper fade or classic gentleman parted cut, wash, and style.',
          popular: true,
        },
        {
          name: 'Royal Straight-Razor Shave & Hot Towel',
          category: 'Beard & Shave',
          price: 399,
          duration: '30 mins',
          description: 'Pre-shave essential oils, botanical warm lather, traditional Japanese feather razor cut, hot eucalyptus towel, and cold soothing compress.',
          popular: true,
        },
        {
          name: 'Master Beard Sculpt & Line Detailing',
          category: 'Beard & Shave',
          price: 299,
          duration: '25 mins',
          description: 'Precision trimmer gradation, razor cheek and neck line styling, finished with organic cedarwood beard oil.',
          popular: false,
        },
        {
          name: 'Revitalizing Deep Nourish Hair Spa',
          category: 'Spa & Therapy',
          price: 699,
          duration: '45 mins',
          description: 'Invigorating scalp acupressure massage, detoxifying clay cleanse, intensive keratin steam therapy, and rinse.',
          popular: true,
        },
        {
          name: 'The Classic Imperial Combo',
          category: 'Royal Combos',
          price: 999,
          duration: '75 mins',
          description: 'Signature haircut, beard sculpting, refreshing hair wash, express charcoal face detox, and styling finish.',
          popular: true,
        },
      ];
      await Service.insertMany(defaultServices);
      console.log('✅ Default Services seeded');
    }
  } catch (error) {
    console.error('Seeding Error:', error.message);
  }
};
