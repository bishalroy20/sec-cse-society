import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function AllCost() {
  const [costSummary, setCostSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transactions"), (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter only expenses and group by subject/category
      const costMap = {};
      txs.forEach(tx => {
        const isExpense = (tx.t === 'expense' || tx.type === 'expense');
        if (isExpense) {
          const subject = tx.subject || tx.category || 'General Cost';
          const amt = Number(tx.amt || tx.amount || 0);
          
          if (!costMap[subject]) {
            costMap[subject] = { subject: subject, count: 0, totalAmount: 0 };
          }
          costMap[subject].count += 1;
          costMap[subject].totalAmount += amt;
        }
      });

      // Convert map object to array
      const summaryArray = Object.values(costMap);
      setCostSummary(summaryArray);
      setLoading(false);
    }, (err) => {
      console.error("Error loading cost aggregation:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  if (loading) {
    return <div className="card" style={{textAlign: 'center', padding: 40}}>Loading cost summary...</div>;
  }

  // Calculate grand total cost
  const grandTotal = costSummary.reduce((acc, item) => acc + item.totalAmount, 0);

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      {/* Header */}
      <div style={{marginBottom: 20}}>
        <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>All Cost & Expense Summary</h2>
        <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Aggregated subject-wise total expenses (e.g., food entries over multiple days).</p>
      </div>

      {/* Summary Card Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4A0E4E 0%, #6A1B9A 100%)', color: '#fff', 
        padding: '20px 24px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <span style={{fontSize: 13, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Expenses Recorded</span>
          <h3 style={{margin: '5px 0 0', fontSize: 28}}>{T(grandTotal)}</h3>
        </div>
        <div style={{background: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600}}>
          {costSummary.length} Categories
        </div>
      </div>

      {/* Modern Table View */}
      <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflowX: 'auto', border: '1px solid #eee'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 600}}>
          <thead>
            <tr style={{background: '#4A0E4E', color: '#fff', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px'}}>
              <th style={{padding: '14px 16px'}}>Subject / Category</th>
              <th style={{padding: '14px 16px', textAlign: 'center'}}>Entries Count</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Total Amount Spent</th>
            </tr>
          </thead>
          <tbody>
            {costSummary.length > 0 ? costSummary.map((item, idx) => (
              <tr key={idx} style={{borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#FAFAFA'}}>
                <td style={{padding: '14px 16px', fontWeight: 600, color: '#222'}}>{item.subject}</td>
                <td style={{padding: '14px 16px', textAlign: 'center', color: '#555'}}>{item.count} Times</td>
                <td style={{padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#C62828'}}>
                  {T(item.totalAmount)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" style={{textAlign: 'center', padding: 40, color: '#888'}}>
                  No expense records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}