import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    Phone,
    User,
    ShieldCheck
} from 'lucide-react';

const MasterCard = ({ item, type }) => (
    <div className="glass glass-card master-card">
        <div className="card-content">
            <div className={`avatar ${type}`}>
                {type === 'party' ? <Users size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div className="item-info">
                <span className="item-name">{item.name}</span>
                <div className="item-mobile">
                    <Phone size={14} className="text-secondary" />
                    <span>{item.mobile || 'No number'}</span>
                </div>
            </div>
        </div>
        <style jsx>{`
      .master-card {
        padding: 1rem;
      }
      .card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .party { background: rgba(88, 166, 255, 0.15); color: #58a6ff; }
      .owner { background: rgba(35, 134, 54, 0.15); color: #3fb950; }
      
      .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .item-name {
        font-weight: 700;
        font-size: 1rem;
      }
      .item-mobile {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    `}</style>
    </div>
);

const Masters = () => {
    const [parties, setParties] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('parties');

    const fetchMasters = async () => {
        try {
            setLoading(true);
            const [pRes, oRes] = await Promise.all([
                supabase.from('parties').select('*').order('name'),
                supabase.from('motor_owners').select('*').order('name')
            ]);

            setParties(pRes.data || []);
            setOwners(oRes.data || []);
        } catch (err) {
            console.error('Error fetching masters:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasters();
    }, []);

    const filteredParties = parties.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.mobile?.includes(search));
    const filteredOwners = owners.filter(o => !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.mobile?.includes(search));

    return (
        <div className="masters-page">
            <div className="page-header">
                <h2>Masters</h2>
            </div>

            <div className="search-bar glass">
                <Search size={18} className="text-secondary" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="tabs glass">
                <button
                    className={`tab-btn ${activeTab === 'parties' ? 'active' : ''}`}
                    onClick={() => setActiveTab('parties')}
                >
                    Parties ({parties.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'owners' ? 'active' : ''}`}
                    onClick={() => setActiveTab('owners')}
                >
                    Motor Owners ({owners.length})
                </button>
            </div>

            <div className="masters-list">
                {loading ? (
                    <p className="text-center py-4">Loading masters...</p>
                ) : (
                    <>
                        {activeTab === 'parties' && (
                            filteredParties.length > 0 ? (
                                filteredParties.map(p => <MasterCard key={p.id} item={p} type="party" />)
                            ) : <p className="empty-text">No parties found</p>
                        )}
                        {activeTab === 'owners' && (
                            filteredOwners.length > 0 ? (
                                filteredOwners.map(o => <MasterCard key={o.id} item={o} type="owner" />)
                            ) : <p className="empty-text">No motor owners found</p>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
        .masters-page { padding-top: 0.5rem; }
        .page-header { margin-bottom: 1.5rem; }
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
        .tabs {
          display: flex;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 8px;
        }
        .tab-btn.active {
          background: var(--accent-color);
          color: white;
        }
        .masters-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 2rem;
        }
        .empty-text {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
          font-style: italic;
        }
      `}</style>
        </div>
    );
};

export default Masters;
