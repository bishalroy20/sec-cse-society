# 🏛️ SEC CSE Society Financial Management System

A comprehensive, role-based financial and student management web application designed specifically for Departmental Societies (e.g., SEC CSE Society). Built with React, Vite, and Firebase.

---

## ✨ Key Features

- **🔐 Role-Based Access Control (RBAC):**
  - **Treasurer:** Full permissions to add, edit, and delete financial transactions, student records, payables, and manage user roles.
  - **Viewer (User):** Read-only access to view ledgers, dashboard statistics, and student directories securely.
- **📊 Real-time Financial Dashboard:** Tracks total income, total expenses, net balance (profit/loss), and category-wise expense distribution.
- **📝 Transaction Ledger & Cash Memos:** 
  - Sequential running balance calculations.
  - Direct image uploads for cash memos via ImgBB integration.
  - Notepad notes and voucher remarks tracking.
- **🎓 Student Directory & Bulk Semester Promotion:**
  - Individual fee tracking (Paid vs. Due fees based on semester requirements).
  - Excel/CSV upload support for bulk student imports.
  - **Bulk Semester Promotion:** Select multiple students and promote them to the next semester simultaneously.
- **💳 Personal Advances & Payables (Owed Money):** Dedicated ledger to track personal funds advanced or loaned by members to the society.

---

## 🚀 Live Demo

Experience the live application here:  
👉 **[https://sec-cse-society.netlify.app/]**

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), React Router DOM
- **Database & Auth:** Firebase Firestore & Firebase Authentication
- **File Handling:** ImgBB API (for image uploads), SheetJS / XLSX (for Excel processing)
- **Styling:** Custom Modern CSS & Inline Flex/Grid Layouts

---

