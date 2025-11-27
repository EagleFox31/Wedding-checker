import { Guest } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc, addDoc } from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================
// Will automatically use Mock data if Firebase DB is not initialized in firebase.ts
const USE_MOCK_DATA = !db; 

// ==========================================
// MOCK DATA GENERATOR
// ==========================================
const MOCK_GUESTS: Guest[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', tableNumber: 1, inviter: 'Marié', description: 'Témoin', hasArrived: true, arrivedAt: new Date().toISOString(), plusOne: true, isAbsent: false },
  { id: '2', firstName: 'Marie', lastName: 'Curie', tableNumber: 1, inviter: 'Mariée', description: 'Tante', hasArrived: false, isAbsent: false },
  { id: '3', firstName: 'Paul', lastName: 'Martin', tableNumber: 2, inviter: 'Parents', description: 'Ami enfance', hasArrived: false, isAbsent: false },
  { id: '4', firstName: 'Sophie', lastName: 'Bernard', tableNumber: 2, inviter: 'Marié', description: 'Collègue', hasArrived: false, isAbsent: false },
  { id: '5', firstName: 'Luc', lastName: 'Besson', tableNumber: 'Table d\'Honneur', inviter: 'Mariée', description: 'Oncle', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '6', firstName: 'Emma', lastName: 'Watson', tableNumber: 3, inviter: 'Marié', description: 'Cousine éloignée', hasArrived: false, isAbsent: false },
  { id: '7', firstName: 'Thomas', lastName: 'Pesquet', tableNumber: 3, inviter: 'Marié', description: 'Ami lycée', hasArrived: false, isAbsent: false },
  { id: '8', firstName: 'Céline', lastName: 'Dion', tableNumber: 4, inviter: 'Mariée', description: 'Voisine', hasArrived: false, isAbsent: true },
  { id: '9', firstName: 'Omar', lastName: 'Sy', tableNumber: 4, inviter: 'Parents', description: 'Ami famille', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '10', firstName: 'Zinedine', lastName: 'Zidane', tableNumber: 1, inviter: 'Marié', description: 'Parrain', hasArrived: false, isAbsent: false },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// FETCH GUESTS
// ==========================================
export const fetchGuests = async (): Promise<Guest[]> => {
  if (USE_MOCK_DATA) {
    await delay(600);
    const stored = localStorage.getItem('demo_guests');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('demo_guests', JSON.stringify(MOCK_GUESTS));
    return MOCK_GUESTS;
  } else {
    try {
      if (!db) throw new Error("Database not initialized");
      const snapshot = await getDocs(collection(db, "guests"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
    } catch (e) {
      console.error("Firebase fetch error:", e);
      return [];
    }
  }
};

// ==========================================
// UPDATE STATUS (Check-in)
// ==========================================
export const updateGuestStatus = async (guestId: string, hasArrived: boolean): Promise<void> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const stored = localStorage.getItem('demo_guests');
    if (stored) {
      const guests: Guest[] = JSON.parse(stored);
      const updatedGuests = guests.map(g => {
        if (g.id === guestId) {
          return {
            ...g,
            hasArrived,
            isAbsent: hasArrived ? false : g.isAbsent, 
            arrivedAt: hasArrived ? new Date().toISOString() : undefined
          };
        }
        return g;
      });
      localStorage.setItem('demo_guests', JSON.stringify(updatedGuests));
    }
  } else {
    if (!db) return;
    const guestRef = doc(db, "guests", guestId);
    await updateDoc(guestRef, { 
      hasArrived, 
      isAbsent: hasArrived ? false : undefined,
      arrivedAt: hasArrived ? new Date().toISOString() : null 
    });
  }
};

// ==========================================
// ADD GUEST
// ==========================================
export const addGuest = async (guest: Omit<Guest, 'id'>): Promise<Guest> => {
  if (USE_MOCK_DATA) {
    await delay(400);
    const stored = localStorage.getItem('demo_guests');
    const guests: Guest[] = stored ? JSON.parse(stored) : MOCK_GUESTS;
    const newGuest: Guest = { ...guest, id: `manual_${Date.now()}` };
    guests.push(newGuest);
    localStorage.setItem('demo_guests', JSON.stringify(guests));
    return newGuest;
  } else {
    if (!db) throw new Error("Database not initialized");
    const docRef = await addDoc(collection(db, "guests"), guest);
    return { id: docRef.id, ...guest };
  }
};

// ==========================================
// UPDATE GUEST DETAILS (Table, etc)
// ==========================================
export const updateGuestDetails = async (guestId: string, updates: Partial<Guest>): Promise<void> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const stored = localStorage.getItem('demo_guests');
    if (stored) {
      const guests: Guest[] = JSON.parse(stored);
      const updatedGuests = guests.map(g => g.id === guestId ? { ...g, ...updates } : g);
      localStorage.setItem('demo_guests', JSON.stringify(updatedGuests));
    }
  } else {
    if (!db) return;
    const guestRef = doc(db, "guests", guestId);
    await updateDoc(guestRef, updates);
  }
};

// ==========================================
// DELETE GUEST
// ==========================================
export const deleteGuest = async (guestId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const stored = localStorage.getItem('demo_guests');
    if (stored) {
      const guests: Guest[] = JSON.parse(stored);
      const updatedGuests = guests.filter(g => g.id !== guestId);
      localStorage.setItem('demo_guests', JSON.stringify(updatedGuests));
    }
  } else {
    if (!db) return;
    await deleteDoc(doc(db, "guests", guestId));
  }
};

// ==========================================
// ADMIN: BATCH UPLOAD
// ==========================================
export const uploadGuestList = async (guests: Guest[]) => {
  if (USE_MOCK_DATA) {
    localStorage.setItem('demo_guests', JSON.stringify(guests));
    window.location.reload();
  } else {
    if (!db) throw new Error("Firebase DB not ready");
    const batch = writeBatch(db);
    guests.forEach((guest) => {
      const docRef = doc(collection(db, "guests"), guest.id);
      batch.set(docRef, guest);
    });
    await batch.commit();
  }
};

export const resetDemoData = () => {
  localStorage.removeItem('demo_guests');
  window.location.reload();
};