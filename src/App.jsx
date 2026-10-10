import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        // Fetch role from Firestore
        try {
          const snapshot = await getDocs(collection(db, "users"));
          const found = snapshot.docs.find(d => d.data().email === currentUser.email);
          setUserRole(found ? found.data().role : 'viewer');
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Loading...</div>;
  if (!user) return null;

  return (
    <div>
      <header>
        <div className="logo">S</div>
        <b>SEC CSE Society</b>
        <small>{user.email} · {userRole.toUpperCase()}</small>
        <button onClick={handleLogout} style={{background:'transparent', color:'#fff', border:'1px solid #fff', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12}}>Logout</button>
      </header>

      <nav id="nav">
        <button className={location.pathname === '/' ? 'on' : ''} onClick={() => navigate('/')}>Dashboard</button>
        <button className={location.pathname === '/transactions' ? 'on' : ''} onClick={() => navigate('/transactions')}>Transactions</button>
        {userRole === 'treasurer' && (
          <button className={location.pathname === '/add-transaction' ? 'on' : ''} onClick={() => navigate('/add-transaction')}>+ Add Entry</button>
        )}
        <button className={location.pathname === '/students' ? 'on' : ''} onClick={() => navigate('/students')}>Students & Dues</button>
        <button className={location.pathname === '/users' ? 'on' : ''} onClick={() => navigate('/users')}>User Roles</button>
      </nav>

      <main id="main">
        <Outlet context={{ userRole }}/>
      </main>
    </div>
  );
}