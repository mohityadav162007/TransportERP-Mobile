import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Truck, History, Wallet, Users, UserCircle } from 'lucide-react';

const Layout = () => {
  return (
    <div className="layout-container">
      {/* Header */}
      <header className="glass header">
        <h1>Shri Sanwariya Road Lines</h1>
      </header>

      {/* Main Content */}
      <main className="content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="glass bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/trips" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Truck size={24} />
          <span>Trips</span>
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={24} />
          <span>Payments</span>
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={24} />
          <span>Expenses</span>
        </NavLink>
        <NavLink to="/masters" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={24} />
          <span>Masters</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <style jsx>{`
        .layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-bottom: 70px; /* Space for bottom nav */
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem;
          text-align: center;
          border-radius: 0 0 16px 16px;
          margin-bottom: 1rem;
        }

        .header h1 {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .content {
          flex: 1;
          padding: 0 1rem;
          overflow-y: auto;
        }

        .bottom-nav {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          height: 64px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 0.5rem;
          border-radius: 20px;
          z-index: 1000;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-secondary);
          text-decoration: none;
          gap: 4px;
          transition: color 0.2s;
        }

        .nav-item span {
          font-size: 10px;
          font-weight: 500;
        }

        .nav-item.active {
          color: var(--accent-color);
        }
      `}</style>
    </div>
  );
};

export default Layout;
