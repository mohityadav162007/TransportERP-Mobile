import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search,
    Filter,
    Plus,
    MapPin,
    Calendar,
    Truck,
    User,
    IndianRupee,
    ChevronRight,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status, type }) => {
    const getColors = () => {
        if (type === 'payment') {
            return status === 'Paid'
                ? 'bg-green-soft text-green'
                : 'bg-yellow-soft text-yellow';
        }
        return status === 'Received'
            ? 'bg-green-soft text-green'
            : 'bg-red-soft text-red';
    };

    return (
        <span className={`status-badge ${getColors()}`}>
            {status}
        </span>
    );
};

const TripCard = ({ trip, onClick }) => (
    <div className="glass glass-card trip-card" onClick={onClick}>
        <div className="card-top">
            <span className="trip-code">{trip.trip_code}</span>
            <div className="status-badges">
                <StatusBadge type="payment" status={trip.payment_status} />
                <StatusBadge type="pod" status={trip.pod_status} />
            </div>
        </div>

        <div className="route-info">
            <div className="route-stop">
                <div className="date-loc">
                    <span className="date">{format(new Date(trip.loading_date), 'dd MMM')}</span>
                    <span className="location">{trip.from_location}</span>
                </div>
            </div>
            <div className="route-arrow">
                <div className="line"></div>
                <ChevronRight size={16} />
            </div>
            <div className="route-stop text-right">
                <div className="date-loc">
                    <span className="date">{trip.unloading_date ? format(new Date(trip.unloading_date), 'dd MMM') : '-'}</span>
                    <span className="location">{trip.to_location}</span>
                </div>
            </div>
        </div>

        <div className="card-details">
            <div className="detail-item">
                <Truck size={14} className="text-secondary" />
                <span>{trip.vehicle_number}</span>
            </div>
            <div className="detail-item">
                <User size={14} className="text-secondary" />
                <span>{trip.party_name}</span>
            </div>
            <div className="detail-item balance">
                <IndianRupee size={14} />
                <span>{Number(trip.party_balance || 0).toLocaleString()}</span>
            </div>
        </div>

        <style jsx>{`
      .trip-card {
        cursor: pointer;
        padding: 1rem;
        transition: transform 0.1s;
      }
      .trip-card:active {
        transform: scale(0.98);
      }
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .trip-code {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--accent-color);
      }
      .status-badges {
        display: flex;
        gap: 0.5rem;
      }
      .status-badge {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .bg-green-soft { background: rgba(63, 185, 80, 0.15); }
      .text-green { color: #3fb950; }
      .bg-yellow-soft { background: rgba(210, 153, 34, 0.15); }
      .text-yellow { color: #d29922; }
      .bg-red-soft { background: rgba(248, 81, 73, 0.15); }
      .text-red { color: #f85149; }

      .route-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .route-stop {
        flex: 1;
      }
      .date-loc {
        display: flex;
        flex-direction: column;
      }
      .date {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .location {
        font-weight: 600;
        font-size: 1rem;
      }
      .text-right { text-align: right; }
      .route-arrow {
        flex: 0 0 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
      }

      .card-details {
        display: flex;
        gap: 1rem;
        border-top: 1px solid var(--glass-border);
        padding-top: 0.75rem;
      }
      .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
      }
      .balance {
        margin-left: auto;
        font-weight: 700;
        color: #3fb950;
      }
    `}</style>
    </div>
);

const Trips = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        vehicle: '',
        paymentStatus: '',
        podStatus: ''
    });

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTrips(data || []);
        } catch (err) {
            console.error('Error fetching trips:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const filteredTrips = useMemo(() => {
        return trips.filter(trip => {
            const searchMatch = !search ||
                trip.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
                trip.party_name?.toLowerCase().includes(search.toLowerCase()) ||
                trip.motor_owner_name?.toLowerCase().includes(search.toLowerCase()) ||
                trip.from_location?.toLowerCase().includes(search.toLowerCase()) ||
                trip.to_location?.toLowerCase().includes(search.toLowerCase()) ||
                trip.trip_code?.toLowerCase().includes(search.toLowerCase());

            const vehicleMatch = !filters.vehicle || trip.vehicle_number?.toLowerCase().includes(filters.vehicle.toLowerCase());
            const paymentMatch = !filters.paymentStatus || trip.payment_status === filters.paymentStatus;
            const podMatch = !filters.podStatus || trip.pod_status === filters.podStatus;

            return searchMatch && vehicleMatch && paymentMatch && podMatch;
        });
    }, [trips, search, filters]);

    return (
        <div className="trips-page">
            <div className="page-header">
                <h2>Trips</h2>
                <button className="btn btn-primary add-btn" onClick={() => navigate('/trips/add')}>
                    <Plus size={20} />
                    <span>Add</span>
                </button>
            </div>

            <div className="search-bar glass">
                <Search size={18} className="text-secondary" />
                <input
                    type="text"
                    placeholder="Search trips..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    className={`filter-btn ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={18} />
                </button>
            </div>

            {showFilters && (
                <div className="filters-panel glass">
                    <div className="filter-header">
                        <h3>Filters</h3>
                        <button onClick={() => setShowFilters(false)}><X size={18} /></button>
                    </div>
                    <div className="filter-grid">
                        <div className="filter-item">
                            <label>Vehicle Number</label>
                            <input
                                type="text"
                                placeholder="Ex: HR 55"
                                value={filters.vehicle}
                                onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
                            />
                        </div>
                        <div className="filter-item">
                            <label>Payment Status</label>
                            <div className="chip-group">
                                {['Pending', 'Paid'].map(s => (
                                    <button
                                        key={s}
                                        className={`chip ${filters.paymentStatus === s ? 'active' : ''}`}
                                        onClick={() => setFilters({ ...filters, paymentStatus: filters.paymentStatus === s ? '' : s })}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>POD Status</label>
                            <div className="chip-group">
                                {['Pending', 'Received'].map(s => (
                                    <button
                                        key={s}
                                        className={`chip ${filters.podStatus === s ? 'active' : ''}`}
                                        onClick={() => setFilters({ ...filters, podStatus: filters.podStatus === s ? '' : s })}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-secondary w-full" onClick={() => setFilters({ vehicle: '', paymentStatus: '', podStatus: '' })}>
                        Reset Filters
                    </button>
                </div>
            )}

            <div className="trips-list">
                {loading ? (
                    <p className="text-center py-4">Loading trips...</p>
                ) : filteredTrips.length > 0 ? (
                    filteredTrips.map(trip => (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            onClick={() => navigate(`/trips/${trip.id}`)}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No trips found</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        .trips-page { padding-top: 0.5rem; }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 12px;
          margin-bottom: 1rem;
        }
        .search-bar input {
          background: transparent;
          border: none;
          padding: 10px 0;
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
        }
        .filter-btn.active {
          color: var(--accent-color);
        }

        .filters-panel {
          padding: 1rem;
          margin-bottom: 1rem;
          border-color: var(--accent-color);
        }
        .filter-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .filter-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .filter-item label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .chip-group {
          display: flex;
          gap: 0.5rem;
        }
        .chip {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
        }
        .chip.active {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .trips-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
        }
        .w-full { width: 100%; }
      `}</style>
        </div>
    );
};

export default Trips;
