import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function AddTransaction() {
  const context = useOutletContext();
  const userRole = context?.userRole || 'user'; 
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole !== 'treasurer') {
      alert("Access Denied! Only treasurers can add transactions.");
      navigate('/transactions');
    }
  }, [userRole, navigate]);

  const [type, setType] = useState('income');
  const [subject, setSubject] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const [memoNote, setMemoNote] = useState('');
  const [memoFile, setMemoFile] = useState(''); // ImgBB URL
  const [uploadingImg, setUploadingImg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  // 🔑 IMGBB API KEY
  const IMGBB_API_KEY = "aa7cc99fc48cd7b4535b604b6633af61";

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const snap = await getDocs(collection(db, "transactions"));
        let bal = 0;
        snap.docs.forEach(doc => {
          const data = doc.data();
          const amt = Number(data.amt || data.amount || 0);
          if (data.t === 'income' || data.type === 'income') {
            bal += amt;
          } else {
            bal -= amt;
          }
        });
        setCurrentBalance(bal);
      } catch (err) {
        console.error("Error calculating balance:", err);
      }
    };
    fetchBalance();
  }, []);

  // Handle ImgBB Image Upload (Fixed Endpoint & FormData)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImg(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (data && data.success) {
        setMemoFile(data.data.url); // ImgBB direct image URL
        alert("Memo image uploaded successfully to ImgBB!");
      } else {
        alert("Image upload failed: " + (data.error?.message || "Invalid API key or network issue"));
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole !== 'treasurer') return alert("Access Denied!");
    setLoading(true);

    const amtNum = Number(amount);
    const newTotal = type === 'income' ? (currentBalance + amtNum) : (currentBalance - amtNum);

    try {
      await addDoc(collection(db, "transactions"), {
        t: type,
        subject: subject.trim(),
        amt: amtNum,
        d: date,
        ds: description.trim(),
        memo_note: memoNote.trim(),
        memo_file: memoFile, // Saved ImgBB URL
        after_spent: newTotal
      });

      alert("Transaction added successfully!");
      navigate('/transactions');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'treasurer') {
    return null;
  }

  return (
    <div style={{maxWidth: 600, margin: '0 auto', paddingBottom: 40}}>
      <div style={{background: '#fff', borderRadius: 16, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderTop: '6px solid #4A0E4E'}}>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
          <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 22}}>Add New Transaction</h2>
          <button onClick={() => navigate('/transactions')} style={{background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#666'}}>
            ← Back
          </button>
        </div>

        <div style={{background: '#F8F9FA', padding: '12px 15px', borderRadius: 8, marginBottom: 20, fontSize: 13, border: '1px solid #eee'}}>
          <span>Current Treasury Balance: <b>৳ {currentBalance.toLocaleString("en-IN")}</b></span>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 15}}>
          
          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Transaction Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              style={{width: '100%', padding: 11, borderRadius: 8, border: '1px solid #ddd', marginTop: 4, background: '#FAFAFA', fontWeight: 600, boxSizing: 'border-box'}}
            >
              <option value="income">➕ Income (+)</option>
              <option value="expense">➖ Expense (-)</option>
            </select>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Subject / Category</label>
            <input 
              type="text" 
              placeholder="e.g. Food, Banner, Event Registration Fee" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
               
              style={{width: '100%', padding: 11, borderRadius: 8, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Amount (৳)</label>
            <input 
              type="number" 
              min="1" 
              placeholder="e.g. 1500" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required 
              style={{width: '100%', padding: 11, borderRadius: 8, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
              style={{width: '100%', padding: 11, borderRadius: 8, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Description / Note</label>
            <textarea 
              rows="3" 
              placeholder="Write details about this transaction..." 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{width: '100%', padding: 11, borderRadius: 8, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box', resize: 'vertical'}}
            />
          </div>

          {/* Cash Memo Section: Notepad Note + ImgBB Upload */}
          <div style={{background: '#FAFAFA', padding: 15, borderRadius: 10, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 10}}>
            <label style={{fontSize: 13, fontWeight: 700, color: '#4A0E4E'}}>📝 Cash Memo (Notepad Note or ImgBB Image Upload)</label>
            
            <div>
              <label style={{fontSize: 12, fontWeight: 600, color: '#555'}}>Notepad Note (Write details)</label>
              <textarea 
                rows="2" 
                placeholder="Write memo details, voucher number, or remarks here..." 
                value={memoNote} 
                onChange={e => setMemoNote(e.target.value)} 
                style={{width: '100%', padding: 9, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, boxSizing: 'border-box', fontSize: 13}}
              />
            </div>

            <div>
              <label style={{fontSize: 12, fontWeight: 600, color: '#555'}}>Upload Memo Image to ImgBB</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginTop: 3, background: '#fff', fontSize: 12, boxSizing: 'border-box'}}
              />
            </div>

            {uploadingImg && <p style={{fontSize: 12, color: '#1976D2', margin: 0}}>Uploading image to ImgBB...</p>}

            {memoFile && (
              <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 5}}>
                <img src={memoFile} alt="Memo Preview" style={{width: 45, height: 45, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc'}} />
                <a href={memoFile} target="_blank" rel="noopener noreferrer" style={{fontSize: 12, color: '#2E7D32', fontWeight: 600, textDecoration: 'underline'}}>✓ View Uploaded Memo</a>
                <button type="button" onClick={() => setMemoFile('')} style={{background: 'none', border: 'none', color: '#C62828', fontSize: 12, cursor: 'pointer', fontWeight: 600}}>Remove</button>
              </div>
            )}
          </div>

          <div style={{display: 'flex', gap: 10, marginTop: 10}}>
            <button type="button" onClick={() => navigate('/transactions')} style={{flex: 1, padding: 12, background: '#f1f1f1', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'}}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{flex: 1, padding: 12, background: '#4A0E4E', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'}}>
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}