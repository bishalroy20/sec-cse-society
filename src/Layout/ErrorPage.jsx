import React from 'react';
import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div style={{maxWidth: 400, margin: '100px auto', textAlign: 'center', padding: 20}}>
      <h1 style={{color: 'var(--r)'}}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{color: 'var(--mu)'}}>The page you are looking for does not exist.</p>
      <Link to="/" className="btn" style={{display: 'inline-block', marginTop: 15, textDecoration: 'none'}}>Go to Dashboard</Link>
    </div>
  );
}