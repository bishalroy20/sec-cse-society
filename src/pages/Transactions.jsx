import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function Transactions() {
  const context = useOutletContext();
  const userRole = context?.userRole || 'user'; 
  
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [type, setType] = useState('income');
  const [subject, setSubject] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [memoNote, setMemoNote] = useState('');

  useEffect(() => {
    const qRef = query(collection(db, "transactions"));
    const unsub = onSnapshot(qRef, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      txs.sort((a, b) => new Date(a.d || a.date || 0) - new Date(b.d || b.date || 0));
      setTransactions(txs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching transactions:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  let runningBal = 0;
  const processedTxs = transactions.map(tx => {
    const isIncome = (tx.t === 'income' || tx.type === 'income');
    const amount = Number(tx.amt || tx.amount || 0);
    
    if (isIncome) {
      runningBal += amount;
    } else {
      runningBal -= amount;
    }

    return { 
      ...tx, 
      isIncome, 
      amount, 
      calculatedTotal: tx.after_spent !== undefined ? Number(tx.after_spent) : runningBal 
    };
  });

  const displayTxs = [...processedTxs].reverse();

  const filtered = displayTxs.filter(tx => {
    const text = ((tx.ds || tx.description || "") + (tx.subject || "") + (tx.d || tx.date || "")).toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const handleOpenEdit = (tx) => {
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can edit.");
      return;
    }
    setEditingTx(tx);
    setType(tx.t || tx.type || 'income');
    setSubject(tx.subject || tx.category || '');
    setAmount(tx.amt || tx.amount || '');
    setDate(tx.d || tx.date || '');
    setDescription(tx.ds || tx.description || '');
    setMemoNote(tx.memo_note || tx.memo || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (userRole !== 'treasurer') return alert("Access Denied!");
    if (!editingTx) return;

    try {
      const txRef = doc(db, "transactions", editingTx.id);
      await updateDoc(txRef, {
        t: type,
        subject: subject.trim(),
        amt: Number(amount),
        d: date,
        ds: description.trim(),
        memo_note: memoNote.trim()
      });
      alert("Transaction updated successfully!");
      setIsEditModalOpen(false);
      setEditingTx(null);
    } catch (err) {
      alert("Error updating: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can delete.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        alert("Transaction deleted!");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  if (loading) {
    return <div className="card" style={{textAlign: 'center', padding: 40}}>Loading transactions...</div>;
  }

  const isTreasurer = userRole === 'treasurer';

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 15}}>
        <div>
          <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>Transactions & Ledger</h2>
          <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Track income, expenses, cash memos, and running balance.</p>
        </div>
        
        {isTreasurer && (
          <button 
            onClick={() => navigate('/add-transaction')}
            style={{
              background: '#4A0E4E', color: '#fff', border: 'none', padding: '10px 18px', 
              borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            + Add New Entry
          </button>
        )}
      </div>

      <div style={{background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: 20, border: '1px solid #eee'}}>
        <input 
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc', 
            outline: 'none', fontSize: 14, background: '#fff', color: '#222', boxSizing: 'border-box'
          }}
          placeholder="🔍 Search by description, subject, or date..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

      {isEditModalOpen && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 450, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #4A0E4E', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <h3 style={{margin: 0, color: '#4A0E4E', fontSize: 18}}>Edit Transaction</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>

            <form onSubmit={handleUpdateTransaction} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Type</label>
                <select value={type} onChange={e => setType(e.target.value)} style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3}}>
                  <option value="income">Income (+)</option>
                  <option value="expense">Expense (-)</option>
                </select>
              </div>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Amount (৳)</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Description</label>
                <textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box'}} />
              </div>
              <div>
                <label style={{fontSize: 12, fontWeight: 600}}>Memo Note</label>
                <input type="text" value={memoNote} onChange={e => setMemoNote(e.target.value)} style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box'}} />
              </div>

              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{flex: 1, padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" style={{flex: 1, padding: 10, background: '#4A0E4E', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflowX: 'auto', border: '1px solid #eee'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: isTreasurer ? 850 : 700}}>
          <thead>
            <tr style={{background: '#4A0E4E', color: '#fff', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px'}}>
              <th style={{padding: '14px 16px', width: '110px'}}>Date</th>
              <th style={{padding: '14px 16px', minWidth: '250px'}}>Description</th>
              <th style={{padding: '14px 16px'}}>Subject</th>
              <th style={{padding: '14px 16px', textAlign: 'center'}}>Type</th>
              <th style={{padding: '14px 16px', textAlign: 'center'}}>Cash Memo</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Amount</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Total</th>
              {isTreasurer && <th style={{padding: '14px 16px', textAlign: 'center'}}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((tx, idx) => {
              const dateStr = tx.d || tx.date || 'N/A';
              const desc = tx.ds || tx.description || 'No description';
              const subject = tx.subject || tx.category || 'General';
              const isIncome = tx.isIncome;
              const amount = tx.amount;
              const memoNote = tx.memo_note || tx.memo || '';
              const memoFile = tx.memo_file || '';
              const totalAmount = tx.calculatedTotal;

              return (
                <tr key={tx.id || idx} style={{borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#FAFAFA'}}>
                  <td style={{padding: '14px 16px', color: '#555', whiteSpace: 'nowrap'}}>{dateStr}</td>
                  <td style={{padding: '14px 16px', color: '#333', wordBreak: 'break-word', lineHeight: '1.4'}}>{desc}</td>
                  <td style={{padding: '14px 16px', fontWeight: 600, color: '#222', whiteSpace: 'nowrap'}}>{subject}</td>
                  
                  <td style={{padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                    <span style={{display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isIncome ? '#E8F5E9' : '#FFEBEE', color: isIncome ? '#2E7D32' : '#C62828'}}>
                      {isIncome ? '+ INC' : '- EXP'}
                    </span>
                  </td>

                  <td style={{padding: '14px 16px', textAlign: 'center', fontSize: 12, color: '#555', whiteSpace: 'nowrap'}}>
                    {memoFile ? (
                      <a href={memoFile} target="_blank" rel="noopener noreferrer" style={{color: '#4A0E4E', fontWeight: 600, textDecoration: 'underline'}}>View Memo</a>
                    ) : memoNote ? (
                      <span title={memoNote}>{memoNote}</span>
                    ) : (
                      <span style={{color: '#aaa'}}>N/A</span>
                    )}
                  </td>

                  <td style={{padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: isIncome ? '#2E7D32' : '#C62828', whiteSpace: 'nowrap'}}>
                    {isIncome ? `+ ${T(amount)}` : `- ${T(amount)}`}
                  </td>

                  <td style={{padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#4A0E4E', whiteSpace: 'nowrap'}}>
                    {T(totalAmount)}
                  </td>

                  {isTreasurer && (
                    <td style={{padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                      <button onClick={() => handleOpenEdit(tx)} style={{background: '#1976D2', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', marginRight: 5, fontWeight: 600}}>Edit</button>
                      <button onClick={() => handleDelete(tx.id)} style={{background: '#C62828', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600}}>Del</button>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={isTreasurer ? 8 : 7} style={{textAlign: 'center', padding: 40, color: '#888'}}>No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}