import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut,
    updateProfile,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isConfigured } from '../services/firebase';
import * as storage from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  syncData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitor Auth State
  useEffect(() => {
    if (!isConfigured || !auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          // Auto sync on initial load if user is logged in
          try {
              await performSync(user, false); // false = don't force upload, prefer download if cloud newer
          } catch (e) {
              console.error("Auto sync failed", e);
          }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sync Logic: Merge Local Storage with Cloud Firestore
  // Strategy: 
  // - If User document exists: Download and replace local (Assume cloud is master)
  // - If User document missing: Upload local to cloud
  const performSync = async (user: User, forceUpload: boolean = false) => {
      if (!db || !user) return;

      const userRef = doc(db, 'users', user.uid);
      
      try {
          if (forceUpload) {
              // Upload Local -> Cloud
              const localData = JSON.parse(storage.exportUserData());
              await setDoc(userRef, {
                  data: localData,
                  updatedAt: new Date().toISOString()
              });
          } else {
              // Check Cloud first
              const docSnap = await getDoc(userRef);
              
              if (docSnap.exists()) {
                  // Download Cloud -> Local
                  const cloudData = docSnap.data();
                  if (cloudData.data) {
                      // Import data to local storage
                      // We re-stringify because importUserData expects a JSON string
                      // but cloudData.data is already an object from Firestore
                      const jsonString = JSON.stringify({
                          meta: { appName: "Rayyan" },
                          data: cloudData.data.data // Assuming export structure
                      });
                      
                      // Fix: The exportUserData wraps in { meta, data: {...keys} }
                      // So we just need to pass the full object
                      storage.importUserData(JSON.stringify(cloudData.data));
                      
                      // Refresh app state by reloading might be needed, or we rely on React reactivity
                      // For this app, reloading is safer to ensure all components get fresh data from localStorage
                      // But let's avoid full reload if possible. Most hooks read on mount.
                      window.location.reload(); 
                  }
              } else {
                  // No cloud data, so upload local
                  const localData = JSON.parse(storage.exportUserData());
                  await setDoc(userRef, {
                      data: localData,
                      updatedAt: new Date().toISOString()
                  });
              }
          }
      } catch (err) {
          console.error("Sync Error:", err);
          throw err;
      }
  };

  const login = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    try {
        setError(null);
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
        setError(e.message);
        throw e;
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error("Firebase not configured");
    try {
        setError(null);
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: name });
        // New user: Force upload local data to init cloud
        await performSync(res.user, true);
    } catch (e: any) {
        setError(e.message);
        throw e;
    }
  };

  const logout = async () => {
    if (!auth) return;
    // Sync one last time before logout?
    if (currentUser) {
        await performSync(currentUser, true); // Save latest changes
    }
    await firebaseSignOut(auth);
  };

  const syncData = async () => {
      if (currentUser) {
          await performSync(currentUser, true); // Manual sync usually implies "Save my current progress"
      }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      signup,
      logout,
      syncData,
      error,
      clearError,
      isDemoMode: !isConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};