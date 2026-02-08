import { useState, useEffect } from 'react';
import { auth, firebaseAvailable } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAvailable) {
      // Check for demo user in sessionStorage
      const demoUser = sessionStorage.getItem('demoUser');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email?.endsWith('@egen.ai')) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function setDemoUser(demoUser) {
    sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
    setUser(demoUser);
  }

  function clearDemoUser() {
    sessionStorage.removeItem('demoUser');
    setUser(null);
  }

  return { user, loading, setDemoUser, clearDemoUser };
}
