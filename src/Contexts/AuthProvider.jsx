import React, { createContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user'); // default role 'user'
  const [loading, setLoading] = useState(true);

  // Register user
  const createUser = async (email, password, name) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    await sendEmailVerification(userCred.user);
    
    // Save user role in Firestore (default 'user')
    await setDoc(doc(db, "users", userCred.user.uid), {
      name,
      email: userCred.user.email,
      role: userCred.user.role || 'user' // default role
    });
    return userCred;
  };

  // Login user
  const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout user
  const logoutUser = () => {
    return signOut(auth);
  };

  // User state change handler with Role checking
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // ⚠️ EKHANE APNAR ASOL LOGIN EMAIL-TI DILE SEI DIRECT TREASURER HOYE JABE:
          const MY_TREASURER_EMAIL = "apnar_email@gmail.com"; // <--- Replace this with your actual login email!

          if (currentUser.email === MY_TREASURER_EMAIL) {
            setUserRole('treasurer');
          } else {
            // Database (users collection) theke role query kora baki userder jonno
            const q = query(collection(db, "users"), where("email", "==", currentUser.email));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
              const userData = snap.docs[0].data();
              setUserRole(userData.role || 'user'); 
            } else {
              setUserRole('user'); // Default viewer/user
            }
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const authInfo = {
    user,
    userRole,
    loading,
    createUser,
    loginUser,
    logoutUser
  };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
}