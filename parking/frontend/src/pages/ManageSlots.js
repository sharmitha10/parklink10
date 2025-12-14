import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parkingAPI } from '../utils/api';
import { MapPin, Edit, Trash2, PlusCircle } from 'lucide-react';
import './ManageSlots.css';
import { useAutoTranslate } from '../components/LanguageSwitcher';

const ManageSlots = () => {
  const navigate = useNavigate();
  const { tAsync, tSync, currentLanguage } = useAutoTranslate();
  const [t, setT] = useState({
    manageSlots: tSync('Manage Parking Slots'),
    manageDesc: tSync('Add, edit, or remove your parking areas'),
    addNewSlot: tSync('Add New Slot'),
    noSlots: tSync('No parking slots yet'),
    createFirst: tSync('Create your first parking slot to start managing bookings'),
    addFirstSlot: tSync('Add Your First Slot'),
    nameLocation: tSync('Name & Location'),
    totalSlots: tSync('Total Slots'),
    available: tSync('Available'),
    priceHour: tSync('Price/Hour'),
    status: tSync('Status'),
    actions: tSync('Actions'),
    edit: tSync('Edit'),
    delete: tSync('Delete'),
    active: tSync('Active'),
    inactive: tSync('Inactive'),
  });

  useEffect(() => {
    let mounted = true;
    const translateAll = async () => {
      const keys = Object.keys(t);
      const translations = {};
      for (const k of keys) {
        translations[k] = await tAsync(t[k]);
      }
      if (mounted) setT(translations);
    };
    if (currentLanguage !== 'en') translateAll();
    return () => { mounted = false; };
  }, [currentLanguage]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await parkingAPI.getMySlots();
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this parking slot?')) {
      try {
        await parkingAPI.delete(slotId);
        alert('Parking slot deleted successfully');
        fetchSlots();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete parking slot');
      }
    }
  };

  const handleEditSlot = (slot) => {
    navigate(`/admin/edit-parking-slot/${slot._id}`);
  };

  const handleAddNewSlot = () => {
    navigate('/admin/add-parking-slot');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-slots">
      <div className="manage-container">
        <div className="manage-header">
          <div>
            <h1>{t.manageSlots}</h1>
            <p>{t.manageDesc}</p>
          </div>
          <button className="btn btn-primary" onClick={handleAddNewSlot}>
            <PlusCircle size={20} />
            {t.addNewSlot}
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="empty-state">
            <MapPin size={64} color="#d1d5db" />
            <h3>{t.noSlots}</h3>
            <p>{t.createFirst}</p>
            <button className="btn btn-primary" onClick={handleAddNewSlot}>
              <PlusCircle size={20} />
              {t.addFirstSlot}
            </button>
          </div>
        ) : (
          <div className="slots-table">
            <table>
              <thead>
                <tr>
                  <th>{t.nameLocation}</th>
                  <th>{t.totalSlots}</th>
                  <th>{t.available}</th>
                  <th>{t.priceHour}</th>
                  <th>{t.status}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id}>
                    <td>
                      <div className="slot-info">
                        <h4>{slot.name}</h4>
                        <p>
                          <MapPin size={14} />
                          {slot.address}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{slot.totalSlots}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            slot.availableSlots > slot.totalSlots / 2
                              ? '#10b981'
                              : slot.availableSlots > 0
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {slot.availableSlots}
                      </span>
                    </td>
                    <td>
                      <span className="price-tag">₹{slot.pricePerHour}</span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          slot.isActive ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        {slot.isActive ? t.active : t.inactive}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditSlot(slot)}
                          title={t.edit}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteSlot(slot._id)}
                          title={t.delete}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSlots;
