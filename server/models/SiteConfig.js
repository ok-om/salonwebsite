import mongoose from 'mongoose';

const siteConfigSchema = new mongoose.Schema(
  {
    salonName: {
      type: String,
      default: 'The Classic Cut Salon',
      required: true,
    },
    tagline: {
      type: String,
      default: 'Where Vintage Craftsmanship Meets Modern Luxury',
    },
    aboutStory: {
      type: String,
      default: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    whatsapp: {
      type: String,
      default: '+919876543210',
    },
    email: {
      type: String,
      default: 'contact@classiccutsalon.com',
    },
    address: {
      type: String,
      default: 'Shop 14, Royal Heritage Arcade, High Street Boulevard, New Delhi, India',
    },
    mapEmbedUrl: {
      type: String,
      default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.482084055276!2d77.2195022!3d28.6152436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd37b9277f97%3A0x6b8f36c4b2ffb39c!2sConnaught%20Place!5e0!3m2!1sen!2sin!4v1700000000000',
    },
    openingHours: {
      weekday: {
        type: String,
        default: 'Mon - Fri: 9:00 AM - 9:30 PM',
      },
      weekend: {
        type: String,
        default: 'Sat - Sun: 8:30 AM - 10:00 PM',
      },
    },
    ownerName: {
      type: String,
      default: 'Master Barber Alex Thorne',
    },
    ownerTitle: {
      type: String,
      default: 'Founder & Chief Barber',
    },
    ownerBio: {
      type: String,
      default: 'With over 15 years mastering British and Italian scissor sculpting and straight-razor artistry, Alex founded The Classic Cut Salon to bring authentic gentleman luxury and personalized grooming back to the modern man.',
    },
    ownerImage: {
      type: String,
      default: '',
    },
    heroVideoUrl: {
      type: String,
      default: '/video/backgroundvideo.mp4',
    },
    defaultOfferTitle: {
      type: String,
      default: 'Complimentary Royal Haircut & Beard Sculpting',
    },
    defaultOfferDiscount: {
      type: String,
      default: '100% OFF / FREE SERVICE',
    },
  },
  { timestamps: true }
);

export const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);
