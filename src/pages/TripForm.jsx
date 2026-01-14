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

const InputField = ({ label, name, value, onChange, placeholder, type = "text", required = false, readOnly = false }) => (
    <div className="input-group">
        <label>{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            readOnly={readOnly}
            disabled={readOnly}
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


    useEffect(() => {
        if (isEdit) {
            fetchTrip();
        }
    }, [id, fetchTrip]);

    const fetchTrip = React.useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setFormData(data);
        } catch (err) {
            console.error('Error fetching trip for edit:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Auto-detect Own Vehicle
    useEffect(() => {
        const checkOwnVehicle = async () => {
            if (!formData.vehicle_number || formData.vehicle_number.length < 3) return;

            try {
                // Check against own_vehicles table
                const { data, error } = await supabase
                    .from('own_vehicles')
                    .select('id')
                    .ilike('vehicle_number', formData.vehicle_number.trim())
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error checking own_vehicles:', error);
                    return;
                }

                const isOwn = !!data;

                // Only update if status implies a change to prevent infinite loops
                setFormData(prev => {
                    if (prev.is_own_vehicle === isOwn) return prev;
                    return { ...prev, is_own_vehicle: isOwn };
                });

            } catch (err) {
                console.error('Error in own vehicle check:', err);
            }
        };

        const timer = setTimeout(checkOwnVehicle, 800);
        return () => clearTimeout(timer);
    }, [formData.vehicle_number]);

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


            navigate('/trips');
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
                    <div className="input-with-badge">
                        <InputField
                            label="Vehicle Number"
                            name="vehicle_number"
                            value={formData.vehicle_number}
                            onChange={handleInputChange}
                            placeholder="Ex: HR 55 AB 1234"
                            required
                        />
                        {formData.is_own_vehicle && (
                            <span className="badge-own-vehicle">OWN VEHICLE</span>
                        )}
                    </div>

                    {!formData.is_own_vehicle && (
                        <>
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
                        </>
                    )}

                    <InputField
                        label="Driver Number"
                        name="driver_number"
                        value={formData.driver_number}
                        onChange={handleInputChange}
                        placeholder="Driver Contact"
                    />
                    <style jsx>{`
                        .input-with-badge {
                            position: relative;
                        }
                        .badge-own-vehicle {
                            position: absolute;
                            top: 0;
                            right: 0;
                            background: rgba(63, 185, 80, 0.15);
                            color: #3fb950;
                            font-size: 0.65rem;
                            font-weight: 700;
                            padding: 2px 6px;
                            border-radius: 4px;
                            border: 1px solid rgba(63, 185, 80, 0.3);
                        }
                    `}</style>
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

                {!formData.is_own_vehicle && (
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
                )}

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
                        label={formData.is_own_vehicle ? "Calculated Profit (Auto)" : "Calculated Profit"}
                        name="profit"
                        value={formData.profit}
                        onChange={handleInputChange}
                        placeholder="Manual Input"
                        readOnly={formData.is_own_vehicle}
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
                            <select name="payment_status" value={formData.payment_status} onChange={handleInputChange}>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div className="status-item">
                            <label>POD Status</label>
                            <select name="pod_status" value={formData.pod_status} onChange={handleInputChange}>
                                <option value="Pending">Pending</option>
                                <option value="Received">Received</option>
                            </select>
                        </div>
                    </div>
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
        .status-item select {
          padding: 12px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: white;
          font-size: 0.95rem;
          outline: none;
        }
        .status-item select:focus {
          border-color: var(--accent-color);
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
      `}</style>
        </div>
    );
};

export default TripForm;
