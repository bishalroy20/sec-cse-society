import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layouts & Context
import AuthProvider from './Contexts/AuthProvider.jsx';
import PrivateRoute from './Layout/PrivateRoute.jsx';
import TreasurerRoute from './Layout/TreasurerRoute.jsx'; 

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardLayout from './Layout/DashboardLayout.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import Transactions from './pages/Transactions.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Students from './pages/Students.jsx';
import UserRoles from './pages/UserRoles.jsx';
import ErrorPage from './/Layout/ErrorPage.jsx';
import AllCost from './pages/AllCost.jsx';
import Payables from './pages/Payables.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <PrivateRoute><DashboardLayout /></PrivateRoute>, // Main app layout (Protected)
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardHome /> },              // Dashboard summary & charts
      { path: "transactions", element: <Transactions /> },  
      { path: "all-cost", element: <AllCost /> },    // View all income/expense/transfer
      { path: "students", element: <Students /> },              // Fee collected & student name entry
      { path: "payables", element: <Payables />},
      { 
        path: "/add-transaction", 
        element: <AddTransaction />
      },
      { 
        path: "users", 
        element: <TreasurerRoute><UserRoles /></TreasurerRoute> 
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "*", element: <ErrorPage /> },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);