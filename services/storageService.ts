
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  updateDoc
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { db, auth, isFirebaseReady } from "../firebase";
import { BillRecord, User, RentalProperty } from '../types';

export const storageService = {
  isReady: () => isFirebaseReady,

  // --- Landlord Auth Operations ---
  signIn: async (email: string, pass: string): Promise<User> => {
    if (!isFirebaseReady) throw new Error("Firebase not configured");
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return {
      id: cred.user.uid,
      email: cred.user.email || '',
      name: cred.user.displayName || 'Landlord'
    };
  },

  signUp: async (email: string, pass: string, name: string): Promise<User> => {
    if (!isFirebaseReady) throw new Error("Firebase not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    return {
      id: cred.user.uid,
      email: cred.user.email || '',
      name: name
    };
  },

  logout: async () => {
    if (!isFirebaseReady) return;
    await signOut(auth);
  },

  onAuthUpdate: (callback: (user: User | null) => void) => {
    if (!isFirebaseReady) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'Landlord'
        });
      } else {
        callback(null);
      }
    });
  },

  // --- Billing Operations ---
  saveBill: async (bill: BillRecord, userId: string): Promise<string> => {
    if (!isFirebaseReady) throw new Error("Firebase not configured");
    const docRef = await addDoc(collection(db, "bills"), {
      ...bill,
      userId,
      createdAt: Date.now()
    });
    return docRef.id;
  },

  getBills: async (userId: string): Promise<BillRecord[]> => {
    if (!isFirebaseReady) return [];
    const billsCol = collection(db, "bills");
    const q = query(
      billsCol, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as BillRecord));
  },

  deleteBill: async (id: string): Promise<void> => {
    if (!isFirebaseReady) return;
    await deleteDoc(doc(db, "bills", id));
  },

  // --- Rental Property Operations ---
  getRentals: async (userId: string): Promise<RentalProperty[]> => {
    if (!isFirebaseReady) return [];
    const rentalsCol = collection(db, "rentals");
    const q = query(
      rentalsCol,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as RentalProperty));
  },

  saveRental: async (rental: Omit<RentalProperty, 'id'>): Promise<string> => {
    if (!isFirebaseReady) throw new Error("Firebase not configured");
    const docRef = await addDoc(collection(db, "rentals"), rental);
    return docRef.id;
  },

  updateRental: async (id: string, updates: Partial<RentalProperty>): Promise<void> => {
    if (!isFirebaseReady) return;
    const docRef = doc(db, "rentals", id);
    await updateDoc(docRef, updates);
  },

  deleteRental: async (id: string): Promise<void> => {
    if (!isFirebaseReady) return;
    await deleteDoc(doc(db, "rentals", id));
  }
};
