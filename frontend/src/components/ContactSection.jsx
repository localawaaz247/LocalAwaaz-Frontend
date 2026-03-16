import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react'; // 🟢 Added Loader2 from lucide-react
import Tilt from 'react-parallax-tilt';
import axiosInstance from '../utils/axios';
import { showToast } from '../utils/toast';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'support@localawaaz.in',
    link: 'mailto:support@localawaaz.in'
  },
  {
    icon: Phone,
    title: 'Call Us',
    value: '+91 83185XXXXX',
    link: 'tel:+918318XXXXXX'
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: 'New Delhi, India',
    link: 'https://maps.app.goo.gl/2tNer8JENso2fgV18'
  },
];

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Debugging log to confirm the button works
    console.log("🚀 Form submitted! Data:", formData);

    setIsSubmitting(true);

    try {
      // 2. Making the API Call
      console.log("🌐 Sending request to /inquiry...");
      const response = await axiosInstance.post(`${import.meta.env.VITE_BASE_URL}/inquiry`, formData);

      // 3. Success handler
      console.log("✅ Success Response:", response.data);
      showToast({ icon: 'success', title: 'Message sent successfully! We will get back to you soon.' });
      setFormData({ name: '', email: '', message: '' }); // Clear form

    } catch (error) {
      // 4. Error handler
      console.error('❌ Submission failed:', error);
      showToast({
        icon: 'error',
        title: error.response?.data?.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-24 bg-muted/30 relative overflow-hidden max-sm:px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-texture opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

      <div className="container mx-auto px-2 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 glass-card rounded-full text-sm font-medium text-accent mb-4">
            Contact Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-6">
            Let's Start a{' '}
            <span className="text-gradient">Conversation</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Have questions, suggestions, or want to partner with us? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Contact Info - With Tilt Effect */}
          <div className="lg:col-span-2 space-y-10 relative z-20">
            {contactInfo.map((info, index) => (
              <div key={index} className="w-full">
                <Tilt
                  tiltMaxAngleX={3}
                  tiltMaxAngleY={3}
                  perspective={1000}
                  scale={1.01}
                  transitionSpeed={2000}
                  gyroscope={true}
                  glareEnable={true}
                  glareMaxOpacity={0.15}
                  glareColor="#ffffff"
                  glarePosition="all"
                  glareBorderRadius="1rem"
                  className="w-full rounded-2xl"
                >
                  <a
                    href={info.link}
                    className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:shadow-xl transition-shadow duration-300 group w-full"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <info.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{info.title}</p>
                      <p className="font-semibold text-foreground">{info.value}</p>
                    </div>
                  </a>
                </Tilt>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 animate-fade-in-up relative z-20">
            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                    placeholder="LocalAwaaz"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                    placeholder="localawaaz_team@domain.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-gradient py-3 md:px-8 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 group disabled:opacity-70 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      {/* 🟢 Using guaranteed native lucide spinner to prevent crash */}
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;