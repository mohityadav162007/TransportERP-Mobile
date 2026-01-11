import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Mail, Shield } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();

    return (
        <div className="profile-page">
            <div className="section-header">
                <h2>My Profile</h2>
            </div>

            <div className="glass profile-card">
                <div className="profile-avatar">
                    <User size={40} className="text-secondary" />
                </div>
                <div className="profile-info">
                    <div className="info-item">
                        <Mail size={18} className="text-secondary" />
                        <div className="text-content">
                            <label>Email Address</label>
                            <span>{user?.email}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <Shield size={18} className="text-secondary" />
                        <div className="text-content">
                            <label>Role</label>
                            <span>Administrator</span>
                        </div>
                    </div>
                </div>
            </div>

            <button className="glass logout-btn" onClick={logout}>
                <LogOut size={20} />
                <span>Log Out</span>
            </button>

            <style jsx>{`
        .profile-page {
          padding-top: 0.5rem;
        }
        .section-header {
          margin-bottom: 2rem;
        }
        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .profile-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-info {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
        }
        .text-content {
          display: flex;
          flex-direction: column;
        }
        .text-content label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .text-content span {
          font-weight: 600;
          font-size: 1rem;
        }
        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 1rem;
          border: 1px solid var(--danger-color);
          color: #f85149;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
        }
        .logout-btn:active {
          background: rgba(248, 81, 73, 0.1);
        }
      `}</style>
        </div>
    );
};

export default Profile;
