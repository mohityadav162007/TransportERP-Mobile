import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Edit3,
  Upload,
  Truck,
  User,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
  Weight,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const InfoSection = ({ title, icon: Icon, children }) => (
  <div className="info-section">
    <div className="section-title">
      <Icon size={18} className="text-secondary" />
      <h3>{title}</h3>
    </div>
    <div className="glass section-content">
      {children}
    </div>
    <style jsx>{`
      .info-section {
        margin-bottom: 2rem;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 1rem;
        padding-left: 4px;
      }
      .section-title h3 {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
      }
      .section-content {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
    `}</style>
  </div>
);

const DetailRow = ({ label, value, isCurrency }) => (
  <div className="detail-row">
    <label>{label}</label>
    <div className="value-group">
      {isCurrency && <IndianRupee size={16} />}
      <span>{value || '-'}</span>
    </div>
    <style jsx>{`
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .detail-row label {
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
      .value-group {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        max-width: 60%;
        text-align: right;
      }
    `}</style>
  </div>
);

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTrip(data);
    } catch (err) {
      console.error('Error fetching trip:', err);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('trips')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      navigate('/trips');
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading trip details...</div>;
  if (!trip) return null;

  return (
    <div className="details-page">
      <div className="details-header">
        <button className="back-btn" onClick={() => navigate('/trips')}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title">
          <h2>{trip.trip_code}</h2>
          <span className="subtitle">{trip.vehicle_number}</span>
        </div>
      </div>

      <div className="details-actions">
        <button className="btn btn-secondary flex-1" onClick={() => navigate(`/trips/edit/${trip.id}`)}>
          <Edit3 size={18} />
          <span>Edit Trip</span>
        </button>
        <button className="btn btn-primary flex-1" onClick={() => navigate(`/trips/${trip.id}/pod`)}>
          <Upload size={18} />
          <span>Upload POD</span>
        </button>
        <button className="btn btn-danger flex-1" onClick={handleDelete} style={{ background: 'rgba(248, 81, 73, 0.15)', color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.2)' }}>
          <Trash2 size={18} />
          <span>Delete</span>
        </button>
      </div>

      <InfoSection title="Basic Info" icon={FileText}>
        <DetailRow label="Trip Code" value={trip.trip_code} />
        <DetailRow label="Loading Date" value={trip.loading_date ? format(new Date(trip.loading_date), 'dd MMM yyyy') : '-'} />
        <DetailRow label="Unloading Date" value={trip.unloading_date ? format(new Date(trip.unloading_date), 'dd MMM yyyy') : '-'} />
        <DetailRow label="Route" value={`${trip.from_location} → ${trip.to_location}`} />
        <DetailRow label="Weight" value={trip.weight ? `${trip.weight} MT` : '-'} />
      </InfoSection>

      <InfoSection title="Vehicle & Owner" icon={Truck}>
        <DetailRow label="Vehicle Number" value={trip.vehicle_number} />
        <DetailRow label="Motor Owner" value={trip.motor_owner_name} />
        <DetailRow label="Owner Number" value={trip.motor_owner_number} />
        <DetailRow label="Driver Number" value={trip.driver_number} />
      </InfoSection>

      <InfoSection title="Party Info" icon={User}>
        <DetailRow label="Party Name" value={trip.party_name} />
        <DetailRow label="Party Number" value={trip.party_number} />
      </InfoSection>

      <InfoSection title="Financial Summary" icon={IndianRupee}>
        <div className="financial-grid">
          <div className="financial-group owner">
            <h4>Motor Owner Payout</h4>
            <DetailRow label="Freight" value={trip.gaadi_freight} isCurrency />
            <DetailRow label="Advance" value={trip.gaadi_advance} isCurrency />
            <div className="total-row">
              <label>Balance</label>
              <div className="total-value">
                <IndianRupee size={16} />
                <span>{trip.gaadi_balance}</span>
              </div>
            </div>
          </div>
          <div className="financial-group party">
            <h4>Party Billing</h4>
            <DetailRow label="Freight" value={trip.party_freight} isCurrency />
            <DetailRow label="Advance" value={trip.party_advance} isCurrency />
            <DetailRow label="TDS" value={trip.tds} isCurrency />
            <DetailRow label="Himmali" value={trip.himmali} isCurrency />
            <div className="total-row">
              <label>Balance</label>
              <div className="total-value">
                <IndianRupee size={16} />
                <span>{trip.party_balance}</span>
              </div>
            </div>
          </div>
          <div className="glass profit-section">
            <label>Estimated Profit</label>
            <div className="profit-value">
              <IndianRupee size={20} />
              <span>{trip.profit}</span>
            </div>
          </div>
        </div>
      </InfoSection>

      {trip.remark && (
        <InfoSection title="Remark" icon={FileText}>
          <p className="remark-text">{trip.remark}</p>
        </InfoSection>
      )}

      <style jsx>{`
        .details-page {
          padding-top: 0.5rem;
          padding-bottom: 2rem;
        }
        .details-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
        }
        .header-title h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .details-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .flex-1 {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .financial-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .financial-group h4 {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 4px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--glass-border);
        }
        .total-value {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 800;
          font-size: 1.1rem;
          color: var(--accent-color);
        }
        .profit-section {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          border-color: #3fb950;
        }
        .profit-value {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 900;
          font-size: 1.5rem;
          color: #3fb950;
        }
        .remark-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default TripDetails;
