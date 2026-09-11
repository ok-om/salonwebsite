import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import API from '../../services/api';
import {
  ShieldCheck,
  Users,
  Scissors,
  Settings,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Gift,
  QrCode,
  Save,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboard = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { config, updateConfig, refreshConfig } = useSiteConfig();

  const [activeTab, setActiveTab] = useState('stamps'); // 'stamps' | 'cms' | 'services' | 'redeem'
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Visit history modal
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [historyVisits, setHistoryVisits] = useState([]);

  // Coupon redemption code
  const [redeemCode, setRedeemCode] = useState('');

  // CMS Form state
  const [cmsForm, setCmsForm] = useState({ ...config });

  // Services state
  const [servicesList, setServicesList] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    category: 'Hair Styling',
    price: '',
    duration: '30 mins',
    description: '',
  });

  useEffect(() => {
    if (config) {
      setCmsForm({ ...config });
    }
  }, [config]);

  // Load Customers
  const fetchCustomers = async (search = '') => {
    setLoading(true);
    try {
      const res = await API.get(`/loyalty/customers?search=${encodeURIComponent(search)}`);
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Services
  const fetchServices = async () => {
    try {
      const res = await API.get('/services');
      setServicesList(res.data);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchCustomers(searchQuery);
      fetchServices();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen || !isAdmin) return null;

  // 1. Award +1 Stamp to Customer
  const handleAwardStamp = async (customer) => {
    try {
      const serviceName = window.prompt(
        `Enter Service Name for ${customer.name} (or leave blank for standard haircut):`,
        'Gentleman Haircut & Styling'
      );
      if (serviceName === null) return; // User cancelled

      const res = await API.post('/loyalty/add-stamp', {
        userId: customer._id,
        serviceName: serviceName || 'Salon Grooming & Haircut',
        notes: 'Awarded at salon counter by admin',
      });

      setFeedback({
        type: 'success',
        msg: res.data.message,
      });

      // Refresh customer list
      fetchCustomers(searchQuery);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to award stamp',
      });
    }
  };

  // 2. View Customer Visit History
  const handleViewHistory = async (customer) => {
    try {
      const res = await API.get(`/loyalty/visits/${customer._id}`);
      setSelectedCustomerHistory(customer);
      setHistoryVisits(res.data);
    } catch (err) {
      alert('Could not fetch visit history');
    }
  };

  // 3. Redeem Coupon Code
  const handleRedeemCoupon = async (e) => {
    e.preventDefault();
    if (!redeemCode) return;
    try {
      const res = await API.post('/loyalty/redeem-coupon', { code: redeemCode });
      setFeedback({ type: 'success', msg: res.data.message });
      setRedeemCode('');
      fetchCustomers(searchQuery);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to redeem coupon',
      });
    }
  };

  // 4. Save CMS Configuration
  const handleSaveCms = async (e) => {
    e.preventDefault();
    try {
      await updateConfig(cmsForm);
      setFeedback({ type: 'success', msg: 'Salon website configuration updated live!' });
      refreshConfig();
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Failed to update CMS' });
    }
  };

  // 5. Add Service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await API.post('/services', newService);
      setFeedback({ type: 'success', msg: 'New service created!' });
      setNewService({
        name: '',
        category: 'Hair Styling',
        price: '',
        duration: '30 mins',
        description: '',
      });
      fetchServices();
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Failed to create service' });
    }
  };

  // 6. Delete Service
  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service?')) return;
    try {
      await API.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          background: '#11131a',
          border: '1px solid var(--border-glow)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(197, 34, 34, 0.2)',
                color: 'var(--crimson-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(197, 34, 34, 0.4)',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Admin Central Command</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Full control over Coupe Stamps, Customer Visits, Live Website CMS & Services
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.msg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(197, 34, 34, 0.15)',
              border: feedback.type === 'success' ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(197, 34, 34, 0.4)',
              color: feedback.type === 'success' ? '#2ecc71' : '#ff8080',
            }}
          >
            <span>{feedback.msg}</span>
            <button
              onClick={() => setFeedback({ type: '', msg: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Nav Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('stamps')}
            className={`btn btn-sm ${activeTab === 'stamps' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={15} />
            <span>Customer Coupe Stamps ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('redeem')}
            className={`btn btn-sm ${activeTab === 'redeem' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <QrCode size={15} />
            <span>Redeem Counter Coupon</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`btn btn-sm ${activeTab === 'cms' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Settings size={15} />
            <span>Live Website CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`btn btn-sm ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Scissors size={15} />
            <span>Services & Pricing ({servicesList.length})</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER STAMPS & VISITS */}
          {/* ========================================================================= */}
          {activeTab === 'stamps' && (
            <div>
              {/* Search Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search by customer name, mobile or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchCustomers(e.target.value);
                    }}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search
                    size={18}
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              {/* Customers Table */}
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Coupe Stamps</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Last Visit Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Active Rewards</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c._id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ffffff' }}>
                          {c.name}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                          <div>{c.phone || 'No phone'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              background: c.currentStamps === 4 ? 'rgba(197, 34, 34, 0.25)' : 'rgba(212, 175, 55, 0.15)',
                              color: c.currentStamps === 4 ? '#ff8080' : 'var(--gold-primary)',
                              border: '1px solid currentColor',
                            }}
                          >
                            ✂️ {c.currentStamps}/5 Stamps
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Lifetime: {c.lifetimeVisits}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                          {c.lastVisitDate ? (
                            <div>
                              <div>{new Date(c.lastVisitDate).toLocaleDateString()}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(c.lastVisitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>First visit pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {c.activeCouponsCount > 0 ? (
                            <span className="badge badge-green">
                              🎁 {c.activeCouponsCount} Available
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleAwardStamp(c)}
                              className="btn btn-primary btn-sm"
                              title="Award 1 Coupe Stamp for this visit"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              +1 Coupe Stamp
                            </button>
                            <button
                              onClick={() => handleViewHistory(c)}
                              className="btn btn-secondary btn-sm"
                              title="View Visit Dates History"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Clock size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REDEEM COUPON AT COUNTER */}
          {/* ========================================================================= */}
          {activeTab === 'redeem' && (
            <div style={{ maxWidth: '520px', margin: '1.5rem auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <QrCode size={32} />
              </div>
              <h4 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Counter Offer Coupon Redemption</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                When a customer presents their 5-Stamp Reward Coupon or QR code, enter their code below to verify and redeem their free service!
              </p>

              <form onSubmit={handleRedeemCoupon}>
                <div className="input-group">
                  <input
                    type="text"
                    required
                    placeholder="Enter Coupon Code (e.g. CUT-7K9W2X)"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="input-field"
                    style={{
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontSize: '1.3rem',
                      letterSpacing: '0.12em',
                    }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Verify & Redeem Offer Coupon
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LIVE WEBSITE CMS */}
          {/* ========================================================================= */}
          {activeTab === 'cms' && (
            <form onSubmit={handleSaveCms}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Salon Name */}
                <div className="input-group">
                  <label className="input-label">Salon Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={cmsForm.salonName || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, salonName: e.target.value })}
                  />
                </div>

                {/* Tagline */}
                <div className="input-group">
                  <label className="input-label">Tagline</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.tagline || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, tagline: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="input-group">
                  <label className="input-label">Phone Number (Calling)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.phone || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, phone: e.target.value })}
                  />
                </div>

                {/* WhatsApp */}
                <div className="input-group">
                  <label className="input-label">WhatsApp Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.whatsapp || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, whatsapp: e.target.value })}
                  />
                </div>

                {/* Address */}
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Salon Physical Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.address || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, address: e.target.value })}
                  />
                </div>

                {/* Google Maps Embed URL */}
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Google Maps Embed URL</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.mapEmbedUrl || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, mapEmbedUrl: e.target.value })}
                  />
                </div>

                {/* Weekday Hours */}
                <div className="input-group">
                  <label className="input-label">Weekday Hours</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.openingHours?.weekday || ''}
                    onChange={(e) =>
                      setCmsForm({
                        ...cmsForm,
                        openingHours: { ...cmsForm.openingHours, weekday: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Weekend Hours */}
                <div className="input-group">
                  <label className="input-label">Weekend Hours</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.openingHours?.weekend || ''}
                    onChange={(e) =>
                      setCmsForm({
                        ...cmsForm,
                        openingHours: { ...cmsForm.openingHours, weekend: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Owner Photo URL */}
                <div className="input-group">
                  <label className="input-label">Master Barber Photo (URL / Local Path)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.ownerImage || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, ownerImage: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Currently loaded with default realistic placeholder portrait. Replace anytime!
                  </span>
                </div>

                {/* Owner Name */}
                <div className="input-group">
                  <label className="input-label">Master Barber Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.ownerName || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, ownerName: e.target.value })}
                  />
                </div>

                {/* Owner Bio */}
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Master Barber Bio & Story</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    value={cmsForm.ownerBio || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, ownerBio: e.target.value })}
                  />
                </div>

                {/* Default 5-Stamp Reward Title */}
                <div className="input-group">
                  <label className="input-label">Default 5-Stamp Reward Title</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.defaultOfferTitle || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, defaultOfferTitle: e.target.value })}
                  />
                </div>

                {/* Default 5-Stamp Reward Discount */}
                <div className="input-group">
                  <label className="input-label">Default Reward Discount Description</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.defaultOfferDiscount || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, defaultOfferDiscount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Website CMS Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SERVICES CATALOG MANAGER */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div>
              {/* Add New Service Form */}
              <form
                onSubmit={handleAddService}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--gold-primary)' }}>
                  Add New Salon Service
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Service Name (e.g. Royal Beard Fade)"
                    className="input-field"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />

                  <select
                    className="input-field"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="Hair Styling">Hair Styling</option>
                    <option value="Beard & Shave">Beard & Shave</option>
                    <option value="Spa & Therapy">Spa & Therapy</option>
                    <option value="Royal Combos">Royal Combos</option>
                  </select>

                  <input
                    type="number"
                    required
                    placeholder="Price (₹)"
                    className="input-field"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />

                  <input
                    type="text"
                    placeholder="Duration (e.g. 30 mins)"
                    className="input-field"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Short Description of service..."
                    className="input-field"
                    style={{ flex: 1 }}
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />

                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={16} /> Add Service
                  </button>
                </div>
              </form>

              {/* Existing Services List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {servicesList.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{s.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginLeft: '0.75rem' }}>
                        [{s.category}]
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                        ₹{s.price} • {s.duration}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteService(s._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        padding: '0.3rem',
                      }}
                      title="Delete Service"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer Visit History Submodal */}
        {selectedCustomerHistory && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11, 12, 16, 0.97)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.3rem', color: '#ffffff' }}>
                  Visit Logs: {selectedCustomerHistory.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                  Active Stamps: {selectedCustomerHistory.currentStamps}/5 • Lifetime: {selectedCustomerHistory.lifetimeVisits}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {historyVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No visit history recorded yet for this customer.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {historyVisits.map((v) => (
                    <div
                      key={v._id}
                      style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{v.serviceName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.notes}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--gold-primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                          {new Date(v.visitedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(v.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
