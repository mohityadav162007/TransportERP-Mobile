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
        <Icon size={22} strokeWidth={2.5} />
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
        gap: 1.25rem;
        padding: 1.25rem;
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
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
        gap: 2px;
      }
      .kpi-title {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .kpi-value {
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0;
        color: #ffffff;
      }
    `}</style>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="section-card-wrapper">
    <h3 className="section-title">{title}</h3>
    <div className="glass glass-card">
      {children}
    </div>
    <style jsx>{`
      .section-card-wrapper {
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 0.95rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
        color: var(--text-secondary);
        padding-left: 4px;
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
    monthlyProfit: 0,
    recentTrips: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

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
        if (trip.pod_status?.toLowerCase() !== 'received') acc.pendingPOD += 1;
        if (trip.payment_status?.toLowerCase() !== 'paid') acc.pendingPayments += 1;
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

      setStats({ ...totals, recentTrips: trips.slice(0, 5) });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

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
        <h2>Dashboard</h2>
        <span className="date-display">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="carousel-container">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      <div className="dashboard-sections">
        <SectionCard title="Profit Graph">
          <div className="chart-placeholder">
            <div className="bar-container">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="chart-bar" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="chart-labels">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </SectionCard>

        <div className="grid-sections">
          <SectionCard title="POD Status">
            <div className="status-summary">
              <div className="status-item">
                <span className="status-label">Received</span>
                <span className="status-count text-green">{stats.totalTrips - stats.pendingPOD}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Pending</span>
                <span className="status-count text-red">{stats.pendingPOD}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Payment Status">
            <div className="status-summary">
              <div className="status-item">
                <span className="status-label">Paid</span>
                <span className="status-count text-green">{stats.totalTrips - stats.pendingPayments}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Pending</span>
                <span className="status-count text-yellow">{stats.pendingPayments}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Weekly Trips">
          <div className="trip-metrics">
            <div className="metric">
              <span className="m-val">{Math.round(stats.totalTrips / 4)}</span>
              <span className="m-lbl">Avg / Week</span>
            </div>
            <div className="metric">
              <span className="m-val">{stats.totalTrips}</span>
              <span className="m-lbl">This Month</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recent Trips">
          <div className="trips-mini-list">
            {stats.recentTrips.map(trip => (
              <div key={trip.id} className="trip-mini-item">
                <div className="t-info">
                  <span className="t-code">{trip.trip_code}</span>
                  <span className="t-route">{trip.from_location} → {trip.to_location}</span>
                </div>
                <div className="t-status">
                  <span className={`dot ${trip.pod_status?.toLowerCase() === 'received' ? 'bg-green' : 'bg-red'}`}></span>
                </div>
              </div>
            ))}
            <button className="view-all-btn" onClick={() => window.location.href = '/trips'}>View All Trips</button>
          </div>
        </SectionCard>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding-top: 0.5rem;
          padding-bottom: 2rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
        }
        .date-display {
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .dashboard-sections {
          margin-top: 1.5rem;
        }

        .grid-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .chart-placeholder {
          height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0.5rem;
        }
        .bar-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 80%;
          gap: 8px;
        }
        .chart-bar {
          flex: 1;
          background: var(--accent-color);
          border-radius: 4px 4px 0 0;
          opacity: 0.7;
          min-width: 12px;
        }
        .chart-labels {
          display: flex;
          justify-content: space-around;
          margin-top: 8px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .status-summary {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .status-count {
          font-weight: 700;
          font-size: 1rem;
        }
        .text-green { color: #3fb950; }
        .text-red { color: #f85149; }
        .text-yellow { color: #d29922; }

        .trip-metrics {
          display: flex;
          justify-content: space-around;
          padding: 0.5rem 0;
        }
        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .m-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }
        .m-lbl {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .trips-mini-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .trip-mini-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .trip-mini-item:last-of-type {
          border-bottom: none;
        }
        .t-info {
          display: flex;
          flex-direction: column;
        }
        .t-code {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-color);
        }
        .t-route {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: block;
        }
        .bg-green { background: #3fb950; }
        .bg-red { background: #f85149; }

        .view-all-btn {
          margin-top: 8px;
          background: transparent;
          border: none;
          color: var(--accent-color);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
