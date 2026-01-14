import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  IndianRupee,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

const PaymentCard = ({ payment }) => (
  <div className="glass glass-card payment-card">
    <div className="card-top">
      <div className="payment-type">
        <span className={`type-icon ${payment.transaction_type === 'Credit' ? 'credit' : 'debit'}`}>
          {payment.transaction_type === 'Credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
        </span>
        <div className="type-info">
          <span className="type-label">{payment.payment_type}</span>
          <span className="transaction-label">{payment.transaction_type}</span>
        </div>
      </div>
      <div className={`payment-amount ${payment.transaction_type === 'Credit' ? 'credit-text' : 'debit-text'}`}>
        <IndianRupee size={20} />
        <span>{Number(payment.amount || 0).toLocaleString()}</span>
      </div>
    </div>

    <div className="payment-details">
      <div className="p-detail">
        <Truck size={14} className="text-secondary" />
        <span>{payment.vehicle_number} {payment.trip?.trip_code && `(${payment.trip.trip_code})`}</span>
      </div>
      {payment.trip && (
        <div className="p-detail">
          <MapPin size={14} className="text-secondary" />
          <span>{payment.trip.from_location} → {payment.trip.to_location}</span>
        </div>
      )}
      <div className="p-detail date-main">
        <span>Paid on: {payment.transaction_date ? format(new Date(payment.transaction_date), 'dd MMM yyyy') : '-'}</span>
      </div>
    </div>

    <style jsx>{`
      .payment-card {
        padding: 1.25rem;
      }
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
      }
      .payment-type {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .type-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .credit { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
      .debit { background: rgba(248, 81, 73, 0.15); color: #f85149; }
      .credit-text { color: #3fb950; }
      .debit-text { color: #f85149; }
      
      .type-info {
        display: flex;
        flex-direction: column;
      }
      .type-label {
        font-weight: 700;
        font-size: 0.95rem;
      }
      .transaction-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .payment-amount {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 800;
        font-size: 1.25rem;
      }

      .payment-details {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--glass-border);
      }
      .p-detail {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      .date-main {
        margin-left: auto;
        font-weight: 600;
        color: var(--text-primary);
      }
    `}</style>
  </div>
);

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_history')
        .select(`
                    *,
                    trip:trips (
                        trip_code,
                        from_location,
                        to_location
                    )
                `)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p =>
    !search ||
    p.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.trip_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.payment_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>Payment History</h2>
      </div>

      <div className="search-bar glass">
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="payments-list">
        {loading ? (
          <p className="text-center py-4">Loading history...</p>
        ) : filteredPayments.length > 0 ? (
          filteredPayments.map(payment => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        ) : (
          <div className="empty-state">
            <p>No payment records found</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .payments-page { padding-top: 0.5rem; }
        .page-header {
          margin-bottom: 1.5rem;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 12px;
          margin-bottom: 1.5rem;
        }
        .search-bar input {
          background: transparent;
          border: none;
          padding: 10px 0;
        }
        .payments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 2rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default Payments;
