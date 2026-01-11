import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Truck,
  IndianRupee,
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  Wallet
} from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color }) => (
  <div className="glass carousel-item">
    <div className="kpi-card">
      <div className={`icon-wrapper ${color}`}>
        <Icon size={20} />
      </div>
      <div className="kpi-info">
        <span className="kpi-title">{title}</span>
        <h3 className="kpi-value">{value}</h3>
      </div>
    </div>
    <style jsx>{`
      .kpi-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
      }
      .icon-wrapper {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .blue { background: rgba(88, 166, 255, 0.15); color: #58a6ff; }
      .green { background: rgba(35, 134, 54, 0.15); color: #3fb950; }
      .yellow { background: rgba(210, 153, 34, 0.15); color: #d29922; }
      .red { background: rgba(218, 54, 51, 0.15); color: #f85149; }
      .purple { background: rgba(137, 87, 229, 0.15); color: #bc8cff; }
      
      .kpi-info {
        display: flex;
        flex-direction: column;
      }
      .kpi-title {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
      .kpi-value {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
      }
    `}</style>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalFreight: 0,
    totalBhada: 0,
    pendingPOD: 0,
    pendingPayments: 0,
    balanceDue: 0,
    payable: 0,
    monthlyProfit: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totals = trips.reduce((acc, trip) => {
        const tripDate = new Date(trip.loading_date);
        const isCurrentMonth = tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;

        acc.totalTrips += 1;
        acc.totalFreight += Number(trip.party_freight || 0);
        acc.totalBhada += Number(trip.gaadi_freight || 0);
        if (trip.pod_status !== 'Received') acc.pendingPOD += 1;
        if (trip.payment_status !== 'Paid') acc.pendingPayments += 1;
        acc.balanceDue += Number(trip.party_balance || 0);
        acc.payable += Number(trip.gaadi_balance || 0);
        if (isCurrentMonth) acc.monthlyProfit += Number(trip.profit || 0);

        return acc;
      }, {
        totalTrips: 0,
        totalFreight: 0,
        totalBhada: 0,
        pendingPOD: 0,
        pendingPayments: 0,
        balanceDue: 0,
        payable: 0,
        monthlyProfit: 0
      });

      setStats(totals);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh on real-time changes
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const kpis = [
    { title: 'Total Trips', value: stats.totalTrips, icon: Truck, color: 'blue' },
    { title: 'Total Freight', value: `₹${stats.totalFreight.toLocaleString()}`, icon: IndianRupee, color: 'green' },
    { title: 'Total Bhada', value: `₹${stats.totalBhada.toLocaleString()}`, icon: IndianRupee, color: 'yellow' },
    { title: 'Pending POD', value: stats.pendingPOD, icon: FileText, color: 'red' },
    { title: 'Pending Payments', value: stats.pendingPayments, icon: AlertCircle, color: 'purple' },
    { title: 'Balance Due', value: `₹${stats.balanceDue.toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { title: 'Payable', value: `₹${stats.payable.toLocaleString()}`, icon: Clock, color: 'yellow' },
    { title: 'Monthly Profit', value: `₹${stats.monthlyProfit.toLocaleString()}`, icon: TrendingUp, color: 'blue' },
  ];

  return (
    <div className="dashboard-page">
      <div className="section-header">
        <h2>Overview</h2>
        <span className="date-display">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="carousel-container">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="glass action-btn" onClick={() => window.location.href = '/trips'}>
            <Truck size={24} />
            <span>Add Trip</span>
          </button>
          <button className="glass action-btn" onClick={() => window.location.href = '/expenses'}>
            <Wallet size={24} />
            <span>Expenses</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding-top: 0.5rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .date-display {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .quick-actions {
          margin-top: 2rem;
        }
        .quick-actions h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        .actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          border: none;
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
