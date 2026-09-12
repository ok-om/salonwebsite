import { User } from '../models/User.js';
import { SiteConfig } from '../models/SiteConfig.js';
import { Service } from '../models/Service.js';

export const seedInitialData = async () => {
  try {
    if (User.db.readyState !== 1) {
      console.log('ℹ️ MongoDB not connected yet. Seeder will run when database connection is established.');
      return;
    }
    // 1. Seed or promote Admin User
    const targetAdminEmail = (process.env.ADMIN_EMAIL || 'ok8023361@gmail.com').toLowerCase().trim();
    let adminUser = await User.findOne({ email: targetAdminEmail });
    if (!adminUser) {
      console.log(`⚡ Seeding Admin account: ${targetAdminEmail}...`);
      await User.create({
        name: 'Master Barber (Salon Admin)',
        email: targetAdminEmail,
        phone: '+919322188848',
        password: process.env.ADMIN_PASSWORD || 'admin12345',
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Admin account created: ${targetAdminEmail}`);
    } else if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`✅ Admin role granted to: ${targetAdminEmail}`);
    }

    // 2. Seed Site Config if none exists
    const configExists = await SiteConfig.findOne();
    if (!configExists) {
      console.log('⚡ Seeding default Site CMS configuration...');
      await SiteConfig.create({
        salonName: 'The Classic Cut Salon',
        tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
        aboutStory: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
        phone: '+91 93221 88848',
        whatsapp: '+919322188848',
        email: 'sraut7285@gmail.com',
        address: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
        mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
        mapEmbedUrl: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
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
