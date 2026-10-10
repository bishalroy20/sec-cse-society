import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useOutletContext } from 'react-router-dom';

export default function UserRoles() {
  const context = useOutletContext();
  const userRole = context?.userRole || 'treasurer';
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleRole = async (targetUserId, currentRole) => {
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can change roles.");
      return;
    }
    const newRole = currentRole === 'treasurer' ? 'user' : 'treasurer';
    try {
      await updateDoc(doc(db, "users", targetUserId), { role: newRole });
      alert(`User role updated to ${newRole.toUpperCase()} successfully!`);
    } catch (err) {
      alert("Error updating role: " + err.message);
    }
  };

  if (loading) {
    return <div style={{textAlign: 'center', padding: 40, color: '#666'}}>Loading user roles...</div>;
  }

  return (
    <div style={{maxWidth: 1000, margin: '0 auto', paddingBottom: 40}}>
      
      {/* Header Banner */}
      <div style={{marginBottom: 24}}>
        <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>User & Role Management</h2>
        <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Manage system access by switching members between Treasurer and Viewer (User) roles.</p>
      </div>

      {/* Users List Card Container */}
      <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee', overflow: 'hidden'}}>
        
        <div style={{padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #eee', fontSize: 13, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
          Registered Members ({usersList.length})
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          {usersList.length > 0 ? usersList.map((u, idx) => {
            const isTreasurer = u.role === 'treasurer';

            return (
              <div 
                key={u.id} 
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 20px', borderBottom: idx !== usersList.length - 1 ? '1px solid #f0f0f0' : 'none',
                  background: idx % 2 === 0 ? '#fff' : '#FAFAFA', flexWrap: 'wrap', gap: 12
                }}
              >
                {/* User Info */}
                <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: isTreasurer ? '#4A0E4E' : '#e0e0e0',
                    color: isTreasurer ? '#fff' : '#555', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16
                  }}>
                    {(u.name || u.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{margin: '0 0 3px', color: '#222', fontSize: 15}}>{u.name || 'Unnamed User'}</h4>
                    <span style={{color: '#666', fontSize: 13}}>{u.email}</span>
                  </div>
                </div>

                {/* Role Badge & Action */}
                <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    background: isTreasurer ? '#E8F5E9' : '#EDE7F6',
                    color: isTreasurer ? '#2E7D32' : '#4A0E4E',
                    border: `1px solid ${isTreasurer ? '#C8E6C9' : '#D1C4E9'}`
                  }}>
                    {isTreasurer ? '👑 Treasurer' : '👁️ Viewer / User'}
                  </span>

                  {userRole === 'treasurer' ? (
                    <button 
                      onClick={() => toggleRole(u.id, u.role)}
                      style={{
                        background: isTreasurer ? '#C62828' : '#4A0E4E', color: '#fff', 
                        border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, 
                        fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      Make {isTreasurer ? 'Viewer' : 'Treasurer'}
                    </button>
                  ) : (
                    <span style={{fontSize: 12, color: '#888', fontStyle: 'italic'}}>View Only</span>
                  )}
                </div>

              </div>
            );
          }) : (
            <div style={{padding: 40, textAlign: 'center', color: '#888', fontSize: 14}}>
              No registered users found in database.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}