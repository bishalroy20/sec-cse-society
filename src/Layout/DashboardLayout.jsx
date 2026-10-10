import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthProvider.jsx';

export default function DashBoardLayout() {
  const { user, userRole, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
    ...(userRole === 'treasurer' ? [{ path: '/add-transaction', label: '+ Add Entry' }] : []),
    { path: '/students', label: 'Students & Dues' },
    ...(userRole === 'treasurer' ? [{ path: '/users', label: 'User Roles' }] : []),
    { path: '/payables', label: 'Payables' },
  ];





  return (
    <div style={{minHeight: '100vh', background: '#F8F9FA', display: 'flex', flexDirection: 'column', fontSize: '14px'}}>
      
      {/* Inline media query style injector for mobile optimization */}
      <style>{`
        @media (max-width: 600px) {
          .header-title { font-size: 13px !important; }
          .header-sub { font-size: 10px !important; }
          .header-logo { width: 28px !important; height: 28px !important; font-size: 14px !important; }
          .nav-btn { padding: 8px 12px !important; font-size: 11px !important; }
          .main-content { padding: 10px !important; }
        }
      `}</style>

      {/* Responsive Header */}
      <header style={{
        background: '#4A0E4E', color: '#fff', padding: '10px 15px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden'}}>
          <div className="header-logo" style={{
            width: 32, height: 32, background: '#fff', color: '#4A0E4E', 
            borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0
          }}>
            S
          </div>
          <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
            <b className="header-title" style={{fontSize: 15, display: 'block', lineHeight: 1.2}}>SEC CSE Society</b>
            <small className="header-sub" style={{fontSize: 11, opacity: 0.8, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {user?.email} · <span style={{textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '0px 4px', borderRadius: 3}}>{userRole}</span>
            </small>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          style={{
            background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.6)', 
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0
          }}
        >
          Logout
        </button>
      </header>

      {/* Responsive Navigation Bar (Horizontal Scrollable on Mobile) */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 10px',
        display: 'flex', gap: 4, overflowX: 'auto', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        scrollbarWidth: 'none' // Hide scrollbar for clean look
      }} id="nav">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.path}
              className="nav-btn"
              onClick={() => navigate(item.path)}
              style={{
                background: isActive ? '#4A0E4E' : 'transparent',
                color: isActive ? '#fff' : '#444',
                border: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', borderBottom: isActive ? '3px solid #2E0830' : '3px solid transparent',
                transition: 'background 0.2s, color 0.2s', flexShrink: 0
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content View Area */}
      <main className="main-content" style={{flex: 1, padding: '15px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box'}} id="main">
        <Outlet context={{ user, userRole }} />
      </main>
    </div>
  );
}