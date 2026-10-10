import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthProvider.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (password !== confirmPassword) {
      return setErr("Passwords do not match!");
    }
    if (password.length < 6) {
      return setErr("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      await createUser(email, password, name);
      setMsg("Registration successful! A verification link has been sent to your email.");
      setTimeout(() => navigate('/login'), 4000);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', 
      background: 'linear-gradient(135deg, #4A0E4E 0%, #2A052D 100%)', padding: 20
    }}>
      <div style={{
        width: '100%', maxWidth: 420, padding: 35, background: '#fff', 
        borderRadius: 20, boxShadow: '0 15px 35px rgba(0,0,0,0.2)', 
        borderTop: '6px solid #4A0E4E', boxSizing: 'border-box'
      }}>
        
        <div style={{textAlign: 'center', marginBottom: 25}}>
          <h2 style={{margin: '0 0 6px', color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>SEC CSE Society</h2>
          <p style={{margin: 0, color: '#666', fontSize: 13, fontWeight: 500}}>Create a new portal account</p>
        </div>
        
        {err && (
          <div style={{background: '#FFEBEE', color: '#C62828', padding: '12px 14px', borderRadius: 8, marginBottom: 15, fontSize: 13, border: '1px solid #FFCDD2'}}>
            <b>Error:</b> {err}
          </div>
        )}
        
        {msg && (
          <div style={{background: '#E8F5E9', color: '#2E7D32', padding: '12px 14px', borderRadius: 8, marginBottom: 15, fontSize: 13, border: '1px solid #C8E6C9'}}>
            <b>Success:</b> {msg}
          </div>
        )}
        
        <form onSubmit={handleRegister} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Full Name</label>
            <input 
              type="text" 
              placeholder="type your full name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #ddd', 
                marginTop: 4, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #ddd', 
                marginTop: 4, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Password</label>
            <input 
              type="password" 
              placeholder="At least 6 characters" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #ddd', 
                marginTop: 4, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Re-enter password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #ddd', 
                marginTop: 4, fontSize: 14, outline: 'none', background: '#FAFAFA', boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: '100%', padding: '12px', background: '#4A0E4E', color: '#fff', 
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, 
              cursor: 'pointer', marginTop: 10, boxShadow: '0 4px 10px rgba(74, 14, 78, 0.2)'
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666'}}>
          Already have an account? <Link to="/login" style={{color: '#4A0E4E', fontWeight: 700, textDecoration: 'none'}}>Login here</Link>
        </div>

      </div>
    </div>
  );
}