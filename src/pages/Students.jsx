import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function Students() {
  const context = useOutletContext();
  const userRole = context?.userRole || 'treasurer'; 
  
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [batch, setBatch] = useState('15th');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [paidFee, setPaidFee] = useState(0);
  
  // Payment Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Fee Edit Modal States (To correct overpaid or wrong fee)
  const [isFeeEditModalOpen, setIsFeeEditModalOpen] = useState(false);
  const [newFeeVal, setNewFeeVal] = useState(0);

  // Semester Update Modal States
  const [isSemModalOpen, setIsSemModalOpen] = useState(false);
  const [newSemesterVal, setNewSemesterVal] = useState(1);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const T = (n) => "৳ " + Number(n || 0).toLocaleString("en-IN");

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "students"), {
        name: name.trim(),
        registration: registration.trim(),
        batch: batch.trim(),
        current_semester: Number(currentSemester),
        paid_fee: Number(paidFee)
      });
      setName(''); setRegistration(''); setCurrentSemester(1); setPaidFee(0);
      setIsModalOpen(false);
      alert("Student added successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const currentPaid = Number(selectedStudent.paid_fee || 0);
      const newPayment = Number(paymentAmount);
      const updatedTotalPaid = currentPaid + newPayment;

      const studentRef = doc(db, "students", selectedStudent.id);
      await updateDoc(studentRef, { paid_fee: updatedTotalPaid });

      alert(`Successfully added ${T(newPayment)} for ${selectedStudent.name}!`);
      setIsPayModalOpen(false);
      setSelectedStudent(null);
      setPaymentAmount('');
    } catch (err) {
      alert("Error updating payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Direct Fee Correction/Edit
  const handleDirectFeeEdit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const studentRef = doc(db, "students", selectedStudent.id);
      await updateDoc(studentRef, { paid_fee: Number(newFeeVal) });

      alert(`Paid fee corrected to ${T(newFeeVal)} for ${selectedStudent.name}!`);
      setIsFeeEditModalOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      alert("Error correcting fee: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const studentRef = doc(db, "students", selectedStudent.id);
      await updateDoc(studentRef, { current_semester: Number(newSemesterVal) });

      alert(`Semester updated to ${newSemesterVal} for ${selectedStudent.name}!`);
      setIsSemModalOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      alert("Error updating semester: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Student (For duplicate entries)
  const handleDeleteStudent = async (id, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        await deleteDoc(doc(db, "students", id));
        alert("Student deleted successfully!");
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  // Bulk Promote Selected Students (e.g. 7th to 8th semester)
  const handleBulkPromote = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student to promote!");
      return;
    }

    if (window.confirm(`Are you sure you want to promote ${selectedStudentIds.length} selected student(s) to the next semester?`)) {
      setLoading(true);
      try {
        for (const id of selectedStudentIds) {
          const student = students.find(s => s.id === id);
          if (student) {
            const currentSem = Number(student.current_semester || 1);
            const nextSem = currentSem < 8 ? currentSem + 1 : 8; // Max semester 8
            const studentRef = doc(db, "students", id);
            await updateDoc(studentRef, { current_semester: nextSem });
          }
        }
        alert("Selected students promoted successfully!");
        setSelectedStudentIds([]);
      } catch (err) {
        alert("Error promoting students: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filtered.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleCheckboxChange = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(item => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let count = 0;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const sName = row[0] ? String(row[0]).trim() : "";
          const sReg = row[1] ? String(row[1]).trim() : "";
          const sBatch = row[2] ? String(row[2]).trim() : "15th";
          
          let semStr = row[3] ? String(row[3]).replace(/[^0-9]/g, '') : "1";
          const sSem = Number(semStr) || 1;
          const sPaid = Number(row[4] || 0);

          if (sName && sReg && sReg.length > 5) {
            await addDoc(collection(db, "students"), {
              name: sName,
              registration: sReg,
              batch: sBatch,
              current_semester: sSem,
              paid_fee: sPaid
            });
            count++;
          }
        }
        alert(`${count} students imported successfully!`);
      } catch (err) {
        alert("Error importing: " + err.message);
      } finally {
        setUploading(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = students.filter(s => 
    ((s.name || "") + (s.registration || "") + (s.batch || "")).toLowerCase().includes(q.toLowerCase())
  );

  const isTreasurer = userRole === 'treasurer';

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', paddingBottom: 40}}>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 15}}>
        <div>
          <h2 style={{margin: 0, color: '#4A0E4E', fontSize: 24, fontWeight: 700}}>Students & Fee Directory</h2>
          <p style={{margin: '4px 0 0', color: '#666', fontSize: 13}}>Manage student semesters, contributions, and payment updates.</p>
        </div>
        
        {isTreasurer && (
          <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            {selectedStudentIds.length > 0 && (
              <button 
                onClick={handleBulkPromote}
                style={{
                  background: '#2E7D32', color: '#fff', border: 'none', padding: '10px 16px', 
                  borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                🚀 Promote Selected ({selectedStudentIds.length})
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#4A0E4E', color: '#fff', border: 'none', padding: '10px 18px', 
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              + Add Student
            </button>
            <label style={{
              background: '#fff', color: '#4A0E4E', border: '1px solid #4A0E4E', padding: '10px 18px', 
              borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center'
            }}>
              {uploading ? 'Importing...' : '📁 Upload Excel'}
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{display: 'none'}} />
            </label>
          </div>
        )}
      </div>

      <div style={{background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: 20, border: '1px solid #eee'}}>
        <input 
          style={{width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc', outline: 'none', fontSize: 14, background: '#fff', color: '#222', boxSizing: 'border-box'}}
          placeholder="🔍 Search student by name, registration or batch..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
      </div>

      {/* Add Student Modal */}
      {isModalOpen && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #4A0E4E', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h3 style={{margin: 0, color: '#4A0E4E', fontSize: 20}}>Add New Student</h3>
              <button onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>

            <form onSubmit={handleAddStudent} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Student Name</label>
                <input style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. Bishal Roy" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Registration No</label>
                <input style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. 2021331518" value={registration} onChange={e => setRegistration(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Batch</label>
                <input style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. 15th" value={batch} onChange={e => setBatch(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Current Semester (1-8)</label>
                <input type="number" min="1" max="8" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} value={currentSemester} onChange={e => setCurrentSemester(e.target.value)} required />
              </div>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Initial Paid Fee (৳)</label>
                <input type="number" min="0" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} value={paidFee} onChange={e => setPaidFee(e.target.value)} required />
              </div>
              
              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{flex: 1, padding: 11, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" disabled={loading} style={{flex: 1, padding: 11, background: '#4A0E4E', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>{loading ? 'Saving...' : 'Save Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Add Modal */}
      {isPayModalOpen && selectedStudent && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #2E7D32', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <h3 style={{margin: 0, color: '#2E7D32', fontSize: 18}}>Update Fee Payment</h3>
              <button onClick={() => setIsPayModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>
            <div style={{background: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 13}}>
              <b>Student:</b> {selectedStudent.name} <br/>
              <b>Reg:</b> {selectedStudent.registration} <br/>
              <b>Current Paid:</b> {T(selectedStudent.paid_fee)}
            </div>
            <form onSubmit={handleUpdatePayment} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Amount to Add Now (৳)</label>
                <input type="number" min="1" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} placeholder="e.g. 500" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
              </div>
              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsPayModalOpen(false)} style={{flex: 1, padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" disabled={loading} style={{flex: 1, padding: 10, background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>{loading ? 'Updating...' : 'Confirm Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Fee Correction Modal (To fix overpaid/wrong amounts) */}
      {isFeeEditModalOpen && selectedStudent && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #C62828', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <h3 style={{margin: 0, color: '#C62828', fontSize: 18}}>Correct / Edit Total Paid Fee</h3>
              <button onClick={() => setIsFeeEditModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>
            <div style={{background: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 13}}>
              <b>Student:</b> {selectedStudent.name} <br/>
              <b>Reg:</b> {selectedStudent.registration}
            </div>
            <form onSubmit={handleDirectFeeEdit} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Set Actual Total Paid Fee (৳)</label>
                <input type="number" min="0" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} value={newFeeVal} onChange={e => setNewFeeVal(e.target.value)} required />
              </div>
              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsFeeEditModalOpen(false)} style={{flex: 1, padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" disabled={loading} style={{flex: 1, padding: 10, background: '#C62828', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>{loading ? 'Saving...' : 'Save Corrected Fee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Update Modal */}
      {isSemModalOpen && selectedStudent && isTreasurer && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 15}}>
          <div style={{width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderTop: '6px solid #4A0E4E', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <h3 style={{margin: 0, color: '#4A0E4E', fontSize: 18}}>Update Semester</h3>
              <button onClick={() => setIsSemModalOpen(false)} style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'}}>✕</button>
            </div>
            <div style={{background: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 13}}>
              <b>Student:</b> {selectedStudent.name} <br/>
              <b>Reg:</b> {selectedStudent.registration} <br/>
              <b>Current Semester:</b> {selectedStudent.current_semester || 1} / 8
            </div>
            <form onSubmit={handleUpdateSemester} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div>
                <label style={{fontSize: 13, fontWeight: 600, color: '#333'}}>Select New Semester (1-8)</label>
                <input type="number" min="1" max="8" style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, boxSizing: 'border-box'}} value={newSemesterVal} onChange={e => setNewSemesterVal(e.target.value)} required />
              </div>
              <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <button type="button" onClick={() => setIsSemModalOpen(false)} style={{flex: 1, padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>Cancel</button>
                <button type="submit" disabled={loading} style={{flex: 1, padding: 10, background: '#4A0E4E', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer'}}>{loading ? 'Updating...' : 'Update Semester'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View */}
      <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflowX: 'auto', border: '1px solid #eee'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 850}}>
          <thead>
            <tr style={{background: '#4A0E4E', color: '#fff', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px'}}>
              {isTreasurer && (
                <th style={{padding: '14px 16px', width: 40, textAlign: 'center'}}>
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedStudentIds.length === filtered.length && filtered.length > 0} />
                </th>
              )}
              <th style={{padding: '14px 16px'}}>Name</th>
              <th style={{padding: '14px 16px'}}>Registration</th>
              <th style={{padding: '14px 16px'}}>Batch</th>
              <th style={{padding: '14px 16px', textAlign: 'center'}}>Semester</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Paid Fee</th>
              <th style={{padding: '14px 16px', textAlign: 'right'}}>Due Fee</th>
              <th style={{padding: '14px 16px', textAlign: 'center'}}>Status</th>
              {isTreasurer && <th style={{padding: '14px 16px', textAlign: 'center'}}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((s, idx) => {
              const sem = Number(s.current_semester || 1);
              const paid = Number(s.paid_fee || 0);
              const requiredFee = sem * 500;
              const dueFee = (requiredFee > paid) ? (requiredFee - paid) : 0;
              const isPaidFull = dueFee === 0;
              const isSelected = selectedStudentIds.includes(s.id);

              return (
                <tr key={s.id} style={{borderBottom: '1px solid #f0f0f0', background: isSelected ? '#F3E5F5' : (idx % 2 === 0 ? '#fff' : '#FAFAFA')}}>
                  {isTreasurer && (
                    <td style={{padding: '14px 16px', textAlign: 'center'}}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleCheckboxChange(s.id)} />
                    </td>
                  )}
                  <td style={{padding: '14px 16px', fontWeight: 600, color: '#222'}}>{s.name}</td>
                  <td style={{padding: '14px 16px', color: '#555'}}>{s.registration}</td>
                  <td style={{padding: '14px 16px', color: '#555'}}>{s.batch}</td>
                  <td style={{padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#4A0E4E'}}>
                    {sem} / 8 
                    {isTreasurer && (
                      <button 
                        onClick={() => { setSelectedStudent(s); setNewSemesterVal(sem); setIsSemModalOpen(true); }}
                        style={{background: 'none', border: 'none', color: '#1976D2', cursor: 'pointer', fontSize: 11, marginLeft: 6, fontWeight: 600, textDecoration: 'underline'}}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                  <td style={{padding: '14px 16px', textAlign: 'right', color: '#2E7D32', fontWeight: 600}}>
                    {T(paid)}
                    {isTreasurer && (
                      <button 
                        onClick={() => { setSelectedStudent(s); setNewFeeVal(paid); setIsFeeEditModalOpen(true); }}
                        style={{background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: 10, display: 'block', marginLeft: 'auto', fontWeight: 600, textDecoration: 'underline'}}
                      >
                        Edit Fee
                      </button>
                    )}
                  </td>
                  <td style={{padding: '14px 16px', textAlign: 'right', color: dueFee > 0 ? '#C62828' : '#666', fontWeight: 600}}>{T(dueFee)}</td>
                  <td style={{padding: '14px 16px', textAlign: 'center'}}>
                    <span style={{display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isPaidFull ? '#E8F5E9' : '#FFEBEE', color: isPaidFull ? '#2E7D32' : '#C62820'}}>
                      {isPaidFull ? 'PAID FULL' : 'DUE'}
                    </span>
                  </td>
                  {isTreasurer && (
                    <td style={{padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                      <button 
                        onClick={() => { setSelectedStudent(s); setIsPayModalOpen(true); }}
                        style={{background: '#2E7D32', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 5}}
                      >
                        + Pay
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        style={{background: '#C62828', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer'}}
                      >
                        Del
                      </button>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={isTreasurer ? 9 : 7} style={{textAlign: 'center', padding: 40, color: '#888'}}>
                  No students found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}