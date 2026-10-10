import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useOutletContext } from 'react-router-dom';

export default function Payables() {
  const context = useOutletContext();
  const userRole = context?.userRole || 'treasurer';

  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payables"), (snap) => {
      setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching payables:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  const handleAddPayable = async (e) => {
    e.preventDefault();
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can add payable entries.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "payables"), {
        name: name.trim(),
        subject: subject.trim(),
        amount: Number(amount),
        description: description.trim(),
        date: date
      });
      setName('');
      setSubject('');
      setAmount('');
      setDescription('');
      setIsModalOpen(false);
      alert("Payable record added successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can delete records.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, "payables", id));
        alert("Record deleted!");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  // Group by Person Name to calculate total owed per person
  const personSummaryMap = {};
  payables.forEach(item => {
    const personName = item.name || 'Unknown';
    if (!personSummaryMap[personName]) {
      personSummaryMap[personName] = { name: personName, totalOwed: 0, entriesCount: 0 };
    }
    personSummaryMap[personName].totalOwed += Number(item.amount || 0);
    personSummaryMap[personName].entriesCount += 1;
  });

  const personSummary = Object.values(personSummaryMap);
  const grandTotalOwed = personSummary.reduce((acc, p) => acc + p.totalOwed, 0);

  if (loading) {
    return <div style={{textAlign: 'center', padding: 40, color: '#666'}}>Loading payables...</div>;
  }

  const isTreasurer = userRole === 'treasurer';

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      {/* Header & Add Button */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 15}}>
        <div>
          <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>Personal Advances & Payables</h2>
          <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Track money owed to individuals who advanced personal funds to the society.</p>
        </div>
        
        {isTreasurer && (
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#4A0E4E', color: '#fff', border: 'none', padding: '10px 18px', 
              borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            + Add Payable Entry
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, #4A0E4E 0%, #6A1B9A 100%)', color: '#fff', 
        padding: '20px 24px', borderRadius: 12, marginBottom: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15
      }}>
        <div>
          <span style={{fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Amount Owed to Persons</span>
          <h3 style={{margin: '6px 0 0', fontSize: 28}}>{T(grandTotalOwed)}</h3>
        </div>
        <div style={{background: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600}}>
          {personSummary.length} Persons Credited
        </div>
      </div>

      {/* Add Payable Modal */}
      {isModalOpen && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #4A0E4E', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h3 style={{margin: 0, color: '#4A0E4E', fontSize: 20}}>Add Payable Entry</h3>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>

            <form onSubmit={handleAddPayable} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Person Name</label>
                <input style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. Rahim Ahmed" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Subject / Category</label>
                <input style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. Sound System Advance" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Amount (৳)</label>
                <input type="number" min="1" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. 2000" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Date</label>
                <input type="date" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Description</label>
                <textarea rows="2" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="Additional details..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              
              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{flex: 1, padding: 11, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{flex: 1, padding: 11, background: '#4A0E4E', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>{submitting ? 'Saving...' : 'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Person Summary Section */}
      <div style={{marginBottom: 30}}>
        <h3 style={{color: '#4A0E4E', fontSize: 18, marginBottom: 12}}>Person-wise Summary</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 15}}>
          {personSummary.map((p, idx) => (
            <div key={idx} style={{background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <h4 style={{margin: 0, color: '#222', fontSize: 16}}>{p.name}</h4>
                <span style={{background: '#EDE7F6', color: '#4A0E4E', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700}}>{p.entriesCount} Entries</span>
              </div>
              <span style={{fontSize: 12, color: '#666'}}>Total Owed:</span>
              <div style={{fontSize: 20, fontWeight: 700, color: '#C62828'}}>{T(p.totalOwed)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Transactions / Entries Table */}
      <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflowX: 'auto', border: '1px solid #eee'}}>
        <div style={{padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #eee', fontSize: 14, fontWeight: 700, color: '#444'}}>
          All Payable Entries History
        </div>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 750}}>
          <thead>
            <tr style={{background: '#4A0E4E', color: '#fff', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px'}}>
              <th style={{padding: '14px 16px'}}>Date</th>
              <th style={{padding: '14px 16px'}}>Person Name</th>
              <th style={{padding: '14px 16px'}}>Subject</th>
              <th style={{padding: '14px 16px', minWidth: '200px'}}>Description</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Amount</th>
              {isTreasurer && <th style={{padding: '14px 16px', textAlign: 'center'}}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {payables.length > 0 ? payables.map((item, idx) => (
              <tr key={item.id || idx} style={{borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#FAFAFA'}}>
                <td style={{padding: '14px 16px', color: '#555', whiteSpace: 'nowrap'}}>{item.date}</td>
                <td style={{padding: '14px 16px', fontWeight: 600, color: '#222'}}>{item.name}</td>
                <td style={{padding: '14px 16px', color: '#333'}}>{item.subject}</td>
                <td style={{padding: '14px 16px', color: '#666', wordBreak: 'break-word'}}>{item.description || 'N/A'}</td>
                <td style={{padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#C62828', whiteSpace: 'nowrap'}}>{T(item.amount)}</td>
                {isTreasurer && (
                  <td style={{padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      style={{background: '#C62828', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600}}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={isTreasurer ? 6 : 5} style={{textAlign: 'center', padding: 40, color: '#888'}}>
                  No payable records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}