import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Wallet,
    Calendar,
    Truck,
    FileText,
    Search,
    X,
    Save,
    Edit2
} from 'lucide-react';
import { format } from 'date-fns';

const ExpenseCard = ({ expense, onEdit }) => (
    <div className="glass glass-card expense-card">
        <div className="card-top">
            <div className="category-info">
                <span className="category-label">{expense.category}</span>
                <span className="date-label">{expense.date ? format(new Date(expense.date), 'dd MMM yyyy') : '-'}</span>
            </div>
            <div className="expense-amount">
                <span>₹{Number(expense.amount || 0).toLocaleString()}</span>
            </div>
            <button className="edit-mini-btn" onClick={() => onEdit(expense)}>
                <Edit2 size={16} />
            </button>
        </div>

        <div className="expense-details">
            {expense.vehicle_number && (
                <div className="e-detail">
                    <Truck size={14} className="text-secondary" />
                    <span>{expense.vehicle_number}</span>
                </div>
            )}
            {expense.notes && (
                <div className="e-detail notes">
                    <FileText size={14} className="text-secondary" />
                    <span>{expense.notes}</span>
                </div>
            )}
        </div>

        <style jsx>{`
      .expense-card {
        padding: 1.25rem;
        position: relative;
      }
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .category-info {
        display: flex;
        flex-direction: column;
      }
      .category-label {
        font-weight: 700;
        font-size: 1rem;
      }
      .date-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .expense-amount {
        font-weight: 800;
        font-size: 1.25rem;
        color: #f85149;
        margin-left: auto;
        margin-right: 12px;
      }
      .edit-mini-btn {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--accent-color);
        padding: 6px;
        border-radius: 8px;
        cursor: pointer;
      }

      .expense-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--glass-border);
      }
      .e-detail {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
      .notes {
        font-style: italic;
      }
    `}</style>
    </div>
);

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        amount: '',
        vehicle_number: '',
        notes: ''
    });

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('daily_expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleEdit = (expense) => {
        setFormData({
            date: expense.date,
            category: expense.category,
            amount: expense.amount,
            vehicle_number: expense.vehicle_number || '',
            notes: expense.notes || ''
        });
        setEditingId(expense.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('daily_expenses')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('daily_expenses')
                    .insert([formData]);
                if (error) throw error;
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                category: '',
                amount: '',
                vehicle_number: '',
                notes: ''
            });
            fetchExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        !search ||
        e.category?.toLowerCase().includes(search.toLowerCase()) ||
        e.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
        e.notes?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="expenses-page">
            <div className="page-header">
                <h2>Daily Expenses</h2>
                <button className="btn btn-primary add-btn" onClick={() => setShowForm(true)}>
                    <Plus size={20} />
                    <span>Add</span>
                </button>
            </div>

            <div className="search-bar glass">
                <Search size={18} className="text-secondary" />
                <input
                    type="text"
                    placeholder="Search expenses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {showForm && (
                <div className="glass expense-form-panel">
                    <div className="form-header">
                        <h3>{editingId ? 'Edit Expense' : 'New Expense'}</h3>
                        <button className="close-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="expense-form">
                        <div className="input-field">
                            <label>Date</label>
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                        </div>
                        <div className="input-field">
                            <label>Category</label>
                            <input type="text" placeholder="Ex: Fuel, Maintenance" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                        </div>
                        <div className="input-field">
                            <label>Amount</label>
                            <input type="text" placeholder="Ex: 1500" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                        </div>
                        <div className="input-field">
                            <label>Vehicle Number (Optional)</label>
                            <input type="text" placeholder="Ex: HR 55" value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} />
                        </div>
                        <div className="input-field">
                            <label>Notes</label>
                            <textarea placeholder="Any additional details..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                        </div>
                        <button type="submit" className="btn btn-primary save-btn" disabled={loading}>
                            <Save size={18} />
                            <span>{loading ? 'Saving...' : 'Save Expense'}</span>
                        </button>
                    </form>
                </div>
            )}

            <div className="expenses-list">
                {loading && !showForm ? (
                    <p className="text-center py-4">Loading expenses...</p>
                ) : filteredExpenses.length > 0 ? (
                    filteredExpenses.map(expense => (
                        <ExpenseCard key={expense.id} expense={expense} onEdit={handleEdit} />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No expenses recorded</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        .expenses-page { padding-top: 0.5rem; }
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
          margin-bottom: 1.5rem;
        }
        .search-bar input {
          background: transparent;
          border: none;
          padding: 10px 0;
        }

        .expense-form-panel {
          padding: 1.25rem;
          margin-bottom: 2rem;
          border-color: var(--accent-color);
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
        }
        .expense-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-field label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .save-btn {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
        }

        .expenses-list {
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

export default Expenses;
