import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Transactions fetch kora
    const unsubTx = onSnapshot(collection(db, "transactions"), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Students fetch kora
    const unsubSt = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubTx();
      unsubSt();
    };
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  // Calculations
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(tx => {
    const isIncome = (tx.t === 'income' || tx.type === 'income');
    const amt = Number(tx.amt || tx.amount || 0);
    if (isIncome) {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const isLoss = netBalance < 0;

  if (loading) {
    return <div style={{textAlign: 'center', padding: 40, color: '#666'}}>Loading dashboard data...</div>;
  }

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      {/* Header */}
      <div style={{marginBottom: 24}}>
        <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>Financial Dashboard</h2>
        <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Overview of society income, expenses, profit/loss, and student contributions.</p>
      </div>

      {/* Summary Cards Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30}}>
        
        {/* Total Income */}
        <div style={{background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #2E7D32'}}>
          <span style={{fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase'}}>Total Income</span>
          <h3 style={{margin: '8px 0 0', fontSize: 24, color: '#2E7D32'}}>{T(totalIncome)}</h3>
        </div>

        {/* Total Expense */}
        <div style={{background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #C62828'}}>
          <span style={{fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase'}}>Total Expense</span>
          <h3 style={{margin: '8px 0 0', fontSize: 24, color: '#C62828'}}>{T(totalExpense)}</h3>
        </div>

        {/* Net Balance / Profit or Loss */}
        <div style={{background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: `5px solid ${isLoss ? '#C62828' : '#4A0E4E'}`}}>
          <span style={{fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase'}}>{isLoss ? 'Net Loss' : 'Net Balance (Profit)'}</span>
          <h3 style={{margin: '8px 0 0', fontSize: 24, color: isLoss ? '#C62828' : '#4A0E4E'}}>{T(Math.abs(netBalance))}</h3>
        </div>

        {/* Total Students */}
        <div style={{background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #1976D2'}}>
          <span style={{fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase'}}>Total Students</span>
          <h3 style={{margin: '8px 0 0', fontSize: 24, color: '#1976D2'}}>{students.length}</h3>
        </div>

      </div>


      {/* <div style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee', overflow: 'hidden'}}>
        
        <div style={{padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3 style={{margin: 0, color: '#4A0E4E', fontSize: 16, fontWeight: 700}}>Student Contribution Ledger (Ke Koto Taka Dise)</h3>
          <span style={{fontSize: 12, color: '#666', background: '#eee', padding: '4px 10px', borderRadius: 12, fontWeight: 600}}>
            Total Students: {students.length}
          </span>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 700}}>
            <thead>
              <tr style={{background: '#4A0E4E', color: '#fff', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px'}}>
                <th style={{padding: '12px 16px'}}>Student Name</th>
                <th style={{padding: '12px 16px'}}>Registration</th>
                <th style={{padding: '12px 16px', textAlign: 'center'}}>Semester</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Total Paid</th>
                <th style={{padding: '12px 16px', textAlign: 'right'}}>Due Fee</th>
                <th style={{padding: '12px 16px', textAlign: 'center'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? students.map((s, idx) => {
                const sem = Number(s.current_semester || 1);
                const paid = Number(s.paid_fee || 0);
                const required = sem * 500;
                const due = (required > paid) ? (required - paid) : 0;
                const isPaidFull = due === 0;

                return (
                  <tr key={s.id || idx} style={{borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#FAFAFA'}}>
                    <td style={{padding: '12px 16px', fontWeight: 600, color: '#222'}}>{s.name}</td>
                    <td style={{padding: '12px 16px', color: '#555'}}>{s.registration}</td>
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
                  <td colSpan="6" style={{textAlign: 'center', padding: 30, color: '#888'}}>No student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div> */}

    </div>
  );
}