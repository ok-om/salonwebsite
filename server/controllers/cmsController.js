import { SiteConfig } from '../models/SiteConfig.js';

// 1. Public: Get Active Site Configuration
export const getSiteConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({
        salonName: 'The Classic Cut Salon',
        tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
        phone: '+91 98765 43210',
        whatsapp: '+919876543210',
        email: 'contact@classiccutsalon.com',
        address: 'Shop 14, Royal Heritage Arcade, High Street Boulevard, New Delhi, India',
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
    }
    res.status(200).json(config);
  } catch (error) {
    console.error('Get Site Config Error:', error);
    res.status(500).json({ message: 'Failed to retrieve site configuration' });
  }
};

// 2. Admin: Update Site Configuration
export const updateSiteConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig();
    }

    const fieldsToUpdate = [
      'salonName',
      'tagline',
      'aboutStory',
      'phone',
      'whatsapp',
      'email',
      'address',
      'mapEmbedUrl',
      'openingHours',
      'ownerName',
      'ownerTitle',
      'ownerBio',
      'ownerImage',
      'heroVideoUrl',
      'defaultOfferTitle',
      'defaultOfferDiscount',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });

    const updatedConfig = await config.save();

    res.status(200).json({
      message: 'Site configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Update Site Config Error:', error);
    res.status(500).json({ message: 'Failed to update site configuration. ' + error.message });
  }
};
