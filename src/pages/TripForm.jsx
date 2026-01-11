import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft,
    Save,
    Truck,
    User,
    MapPin,
    Calendar,
    IndianRupee,
    FileText,
    Weight
} from 'lucide-react';
import { format } from 'date-fns';

const FormSection = ({ title, icon: Icon, children }) => (
    <div className="form-section">
        <div className="section-title">
            <Icon size={18} className="text-secondary" />
            <h3>{title}</h3>
        </div>
        <div className="glass section-content">
            {children}
        </div>
        <style jsx>{`
      .form-section {
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

const InputField = ({ label, name, value, onChange, placeholder, type = "text", required = false }) => (
    <div className="input-group">
        <label>{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
        />
        <style jsx>{`
      .input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .input-group label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        padding-left: 4px;
      }
    `}</style>
    </div>
);

const TripForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        trip_code: '',
        loading_date: format(new Date(), 'yyyy-MM-dd'),
        unloading_date: '',
        from_location: '',
        to_location: '',
        vehicle_number: '',
        driver_number: '',
        motor_owner_name: '',
        motor_owner_number: '',
        gaadi_freight: '',
        gaadi_advance: '',
        gaadi_balance: '',
        party_name: '',
        party_number: '',
        party_freight: '',
        party_advance: '',
        party_balance: '',
        tds: '',
        himmali: '',
        payment_status: 'Pending',
        gaadi_balance_status: 'Pending',
        profit: '',
        weight: '',
        remark: '',
        pod_status: 'Pending'
    });

    const [newPayment, setNewPayment] = useState({
        amount: '',
        payment_type: 'Cash',
        transaction_type: 'Debit',
        transaction_date: format(new Date(), 'yyyy-MM-dd')
    });

    const [showPaymentForm, setShowPaymentForm] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchTrip();
        }
    }, [id]);

    const fetchTrip = async () => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setFormData(data);
        } catch (err) {
            console.error('Error fetching trip for edit:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const ensureMasterExists = async (table, nameField, name, mobileField, mobile) => {
        if (!name) return;

        // Check if exists
        const { data: existing } = await supabase
            .from(table)
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (!existing) {
            // Create silently
            await supabase
                .from(table)
                .insert([{ [nameField]: name, [mobileField]: mobile }]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Ensure Masters exist
            await Promise.all([
                ensureMasterExists('parties', 'name', formData.party_name, 'mobile', formData.party_number),
                ensureMasterExists('motor_owners', 'name', formData.motor_owner_name, 'mobile', formData.motor_owner_number)
            ]);

            // 2. Clear fields that might be empty strings but should be null in DB
            const cleanData = { ...formData };
            ['unloading_date', 'weight', 'gaadi_freight', 'gaadi_advance', 'gaadi_balance', 'party_freight', 'party_advance', 'party_balance', 'tds', 'himmali', 'profit'].forEach(field => {
                if (cleanData[field] === '') cleanData[field] = null;
            });

            let tripId = id;
            if (isEdit) {
                const { error } = await supabase
                    .from('trips')
                    .update(cleanData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('trips')
                    .insert([cleanData])
                    .select('id')
                    .single();
                if (error) throw error;
                tripId = data.id;
            }

            // 3. Add Payment if applicable
            if (showPaymentForm && newPayment.amount) {
                const { error: pError } = await supabase
                    .from('payment_history')
                    .insert([{
                        trip_id: tripId,
                        trip_code: formData.trip_code,
                        vehicle_number: formData.vehicle_number,
                        loading_date: formData.loading_date,
                        amount: newPayment.amount,
                        payment_type: newPayment.payment_type,
                        transaction_type: newPayment.transaction_type,
                        transaction_date: newPayment.transaction_date,
                        is_deleted: false
                    }]);
                if (pError) throw pError;
            }

            navigate('/trips');
        } catch (err) {
            console.error('Error saving trip:', err);
            alert('Error saving trip. Please check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page">
            <div className="form-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2>{isEdit ? 'Edit Trip' : 'Add New Trip'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <FormSection title="Basic Details" icon={FileText}>
                    <InputField
                        label="Trip Code"
                        name="trip_code"
                        value={formData.trip_code}
                        onChange={handleInputChange}
                        placeholder="Ex: TRIP-1234"
                        required
                    />
                    <InputField
                        label="Loading Date"
                        name="loading_date"
                        type="date"
                        value={formData.loading_date}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        label="Unloading Date"
                        name="unloading_date"
                        type="date"
                        value={formData.unloading_date}
                        onChange={handleInputChange}
                    />
                    <div className="grid-2">
                        <InputField
                            label="From Location"
                            name="from_location"
                            value={formData.from_location}
                            onChange={handleInputChange}
                            placeholder="Source"
                            required
                        />
                        <InputField
                            label="To Location"
                            name="to_location"
                            value={formData.to_location}
                            onChange={handleInputChange}
                            placeholder="Destination"
                            required
                        />
                    </div>
                    <InputField
                        label="Weight (MT)"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="Ex: 25.5"
                    />
                </FormSection>

                <FormSection title="Vehicle & Owner" icon={Truck}>
                    <InputField
                        label="Vehicle Number"
                        name="vehicle_number"
                        value={formData.vehicle_number}
                        onChange={handleInputChange}
                        placeholder="Ex: HR 55 AB 1234"
                        required
                    />
                    <InputField
                        label="Motor Owner Name"
                        name="motor_owner_name"
                        value={formData.motor_owner_name}
                        onChange={handleInputChange}
                        placeholder="Owner Name"
                    />
                    <InputField
                        label="Motor Owner Number"
                        name="motor_owner_number"
                        value={formData.motor_owner_number}
                        onChange={handleInputChange}
                        placeholder="Mobile Number"
                    />
                    <InputField
                        label="Driver Number"
                        name="driver_number"
                        value={formData.driver_number}
                        onChange={handleInputChange}
                        placeholder="Driver Contact"
                    />
                </FormSection>

                <FormSection title="Party Information" icon={User}>
                    <InputField
                        label="Party Name"
                        name="party_name"
                        value={formData.party_name}
                        onChange={handleInputChange}
                        placeholder="Customer Name"
                        required
                    />
                    <InputField
                        label="Party Number"
                        name="party_number"
                        value={formData.party_number}
                        onChange={handleInputChange}
                        placeholder="Customer Mobile"
                    />
                </FormSection>

                <FormSection title="Motor Owner Payout" icon={IndianRupee}>
                    <InputField
                        label="Agreed Freight"
                        name="gaadi_freight"
                        value={formData.gaadi_freight}
                        onChange={handleInputChange}
                        placeholder="Amount"
                    />
                    <InputField
                        label="Advance Given"
                        name="gaadi_advance"
                        value={formData.gaadi_advance}
                        onChange={handleInputChange}
                        placeholder="Amount"
                    />
                    <InputField
                        label="Balance Payable"
                        name="gaadi_balance"
                        value={formData.gaadi_balance}
                        onChange={handleInputChange}
                        placeholder="Remaining (Manual Input)"
                    />
                </FormSection>

                <FormSection title="Party Billing" icon={IndianRupee}>
                    <InputField
                        label="Total Freight"
                        name="party_freight"
                        value={formData.party_freight}
                        onChange={handleInputChange}
                        placeholder="Amount"
                    />
                    <InputField
                        label="Advance Received"
                        name="party_advance"
                        value={formData.party_advance}
                        onChange={handleInputChange}
                        placeholder="Amount"
                    />
                    <div className="grid-2">
                        <InputField label="TDS" name="tds" value={formData.tds} onChange={handleInputChange} placeholder="Ex: 500" />
                        <InputField label="Himmali" name="himmali" value={formData.himmali} onChange={handleInputChange} placeholder="Ex: 200" />
                    </div>
                    <InputField
                        label="Balance Due"
                        name="party_balance"
                        value={formData.party_balance}
                        onChange={handleInputChange}
                        placeholder="Remaining (Manual Input)"
                    />
                </FormSection>

                <FormSection title="Financial Results" icon={IndianRupee}>
                    <InputField
                        label="Calculated Profit"
                        name="profit"
                        value={formData.profit}
                        onChange={handleInputChange}
                        placeholder="Manual Input"
                    />
                    <InputField
                        label="Remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        placeholder="Additional notes"
                    />
                </FormSection>

                <FormSection title="Status" icon={FileText}>
                    <div className="status-grid">
                        <div className="status-item">
                            <label>Payment Status</label>
                            <input name="payment_status" value={formData.payment_status} onChange={handleInputChange} placeholder="Pending/Paid" />
                        </div>
                        <div className="status-item">
                            <label>POD Status</label>
                            <input name="pod_status" value={formData.pod_status} onChange={handleInputChange} placeholder="Pending/Received" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Add Payment History" icon={IndianRupee}>
                    <div className="payment-toggle">
                        <label>Record a New Payment?</label>
                        <button type="button" className={`toggle-btn ${showPaymentForm ? 'active' : ''}`} onClick={() => setShowPaymentForm(!showPaymentForm)}>
                            {showPaymentForm ? 'Cancel Payment' : 'Add Payment'}
                        </button>
                    </div>

                    {showPaymentForm && (
                        <div className="payment-fields">
                            <InputField
                                label="Amount"
                                name="amount"
                                value={newPayment.amount}
                                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                placeholder="Ex: 5000"
                                required
                            />
                            <div className="grid-2">
                                <div className="input-group">
                                    <label>Payment Mode</label>
                                    <input
                                        value={newPayment.payment_type}
                                        onChange={(e) => setNewPayment({ ...newPayment, payment_type: e.target.value })}
                                        placeholder="Ex: Cash/UPI"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Transaction Type</label>
                                    <input
                                        value={newPayment.transaction_type}
                                        onChange={(e) => setNewPayment({ ...newPayment, transaction_type: e.target.value })}
                                        placeholder="Ex: Debit/Credit"
                                        required
                                    />
                                </div>
                            </div>
                            <InputField
                                label="Transaction Date"
                                name="transaction_date"
                                type="date"
                                value={newPayment.transaction_date}
                                onChange={(e) => setNewPayment({ ...newPayment, transaction_date: e.target.value })}
                                required
                            />
                        </div>
                    )}
                </FormSection>

                <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                    <Save size={20} />
                    <span>{loading ? 'Saving...' : 'Save Trip'}</span>
                </button>
            </form>

            <style jsx>{`
        .form-page {
          padding-top: 0.5rem;
          padding-bottom: 3rem;
        }
        .form-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
        }
        .form-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .status-grid {
           display: flex;
           flex-direction: column;
           gap: 1rem;
        }
        .status-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .status-item label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .submit-btn {
          position: sticky;
          bottom: 80px;
          left: 0;
          right: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 1rem;
          font-size: 1.1rem;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
          z-index: 50;
        }
        .payment-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .payment-toggle label {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .toggle-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          color: white;
          cursor: pointer;
        }
        .toggle-btn.active {
          background: var(--danger-color);
          border-color: var(--danger-color);
        }
        .payment-fields {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--glass-border);
        }
      `}</style>
        </div>
    );
};

export default TripForm;
