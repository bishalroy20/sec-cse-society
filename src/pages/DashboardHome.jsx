import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function DashboardHome() {
  const [tx, setTx] = useState([]);
  const [st, setSt] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default accounts for society funds
  const acc = [
    { id: 1, n: "Cash in Hand" },
    { id: 2, n: "Dutch-Bangla Bank" },
    { id: 3, n: "bKash" }
  ];

  useEffect(() => {
    const unsubTx = onSnapshot(collection(db, "transactions"), (snap) => {
      setTx(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSt = onSnapshot(collection(db, "students"), (snap) => {
      setSt(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubTx(); unsubSt(); };
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  // Safe calculations
  let totalIncome = 0;
  let totalExpense = 0;

  tx.forEach(item => {
    const isIncome = (item.t === 'income' || item.type === 'income');
    const amt = Number(item.amt || item.amount || 0);
    if (isIncome) {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  });

  const currentBalance = totalIncome - totalExpense;

  // Expense by category/subject aggregation
  const expenseMap = {};
  tx.forEach(item => {
    const isExpense = (item.t === 'expense' || item.type === 'expense');
    if (isExpense) {
      const subject = item.subject || item.category || 'General Cost';
      const amt = Number(item.amt || item.amount || 0);
      expenseMap[subject] = (expenseMap[subject] || 0) + amt;
    }
  });

  const catTotals = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]);
  const safeTotalExp = totalExpense || 1;

  // Student contributions total
  const totalContributions = st.reduce((accSum, student) => accSum + Number(student.paid_fee || 0), 0);

  if (loading) {
    return <div className="card" style={{textAlign: 'center', padding: 40}}>Loading dashboard...</div>;
  }

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      {/* Hero Balance Card */}
      <div className="card hero" style={{background: 'linear-gradient(135deg, #4A0E4E 0%, #6A1B9A 100%)', color: '#fff', padding: 24, borderRadius: 12, marginBottom: 20}}>
        <small style={{opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Current Treasury Balance</small>
        <h2 style={{fontSize: 32, margin: '6px 0 0'}}>{T(currentBalance)}</h2>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 15, marginBottom: 25}}>
        <div className="card" style={{background: '#fff', padding: 20, borderRadius: 12, borderLeft: '5px solid #2E7D32'}}>
          <small style={{color: '#666', fontWeight: 600}}>Total Income</small>
          <h2 className="g" style={{color: '#2E7D32', margin: '6px 0 0', fontSize: 24}}>{T(totalIncome)}</h2>
        </div>
        <div className="card" style={{background: '#fff', padding: 20, borderRadius: 12, borderLeft: '5px solid #C62828'}}>
          <small style={{color: '#666', fontWeight: 600}}>Total Expense</small>
          <h2 className="r" style={{color: '#C62828', margin: '6px 0 0', fontSize: 24}}>{T(totalExpense)}</h2>
        </div>
        
        <div className="card" style={{background: '#fff', padding: 20, borderRadius: 12, borderLeft: '5px solid #4A0E4E'}}>
          <small style={{color: '#666', fontWeight: 600}}>Total Students</small>
          <h2 style={{color: '#4A0E4E', margin: '6px 0 0', fontSize: 24}}>{st.length}</h2>
        </div>
      </div>

      {/* Expense by Category Breakdown */}
      <div className="card" style={{background: '#fff', padding: 20, borderRadius: 12, marginBottom: 25, border: '1px solid #eee'}}>
        <b style={{color: '#4A0E4E', fontSize: 16}}>Expense by Category / Subject</b>
        <div style={{marginTop: 15}}>
          {catTotals.length > 0 ? catTotals.map(([c, v]) => {
            const percent = Math.round((v / safeTotalExp) * 100);
            return (
              <div key={c} style={{marginBottom: 12}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4}}>
                  <span>{c}</span>
                  <span>{T(v)} ({percent}%)</span>
                </div>
                <div style={{background: '#f1f1f1', height: 8, borderRadius: 4, overflow: 'hidden'}}>
                  <div style={{width: `${percent}%`, background: '#C62828', height: '100%', borderRadius: 4}}></div>
                </div>
              </div>
            );
          }) : <small style={{color: '#888'}}>No expenses recorded yet.</small>}
        </div>
      </div>

      {/* Student Contributions Table (Ke koto taka dise) */}
      {/* <div className="card" style={{background: '#fff', borderRadius: 12, padding: 0, overflow: 'hidden', border: '1px solid #eee'}}>
        <div style={{padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #eee'}}>
          <b style={{color: '#4A0E4E', fontSize: 16}}>Student Contribution Ledger (Ke Koto Taka Dise)</b>
          <p style={{margin: '2px 0 0', color: '#666', fontSize: 12}}>Individual tracking of student paid fees and due amounts.</p>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 650}}>
            <thead>
              <tr style={{background: '#4A0E4E', color: '#fff', fontSize: 12, textTransform: 'uppercase'}}>
                <th style={{padding: '12px 16px'}}>Student Name</th>
                <th style={{padding: '12px 16px'}}>Registration</th>
                <th style={{padding: '12px 16px', textAlign: 'center'}}>Semester</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Total Paid</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Due Fee</th>
                <th style={{padding: '12px 16px', textAlign: 'center'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {st.length > 0 ? st.map((student, idx) => {
                const sem = Number(student.current_semester || 1);
                const paid = Number(student.paid_fee || 0);
                const required = sem * 500;
                const due = (required > paid) ? (required - paid) : 0;
                const isPaidFull = due === 0;

                return (
                  <tr key={student.id || idx} style={{borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#FAFAFA'}}>
                    <td style={{padding: '12px 16px', fontWeight: 600, color: '#222'}}>{student.name}</td>
                    <td style={{padding: '12px 16px', color: '#555'}}>{student.registration}</td>
                    <td style={{padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#4A0E4E'}}>{sem} / 8</td>
                    <td style={{padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#2E7D32'}}>{T(paid)}</td>
                    <td style={{padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: due > 0 ? '#C62828' : '#666'}}>{T(due)}</td>
                    <td style={{padding: '12px 16px', textAlign: 'center'}}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: isPaidFull ? '#E8F5E9' : '#FFEBEE',
                        color: isPaidFull ? '#2E7D32' : '#C62828'
                      }}>
                        {isPaidFull ? 'PAID FULL' : 'DUE'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: 30, color: '#888'}}>No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div> */}

    </div>
  );
}