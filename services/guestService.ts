import { Guest } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc, addDoc, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================
// Will automatically use Mock data if Firebase DB is not initialized in firebase.ts
const USE_MOCK_DATA = !db; 

// ==========================================
// MOCK DATA GENERATOR
// ==========================================
const MOCK_GUESTS: Guest[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Serge', description: 'Témoin', hasArrived: true, arrivedAt: new Date().toISOString(), plusOne: true, isAbsent: false },
  { id: '2', firstName: 'Marie', lastName: 'Curie', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Christiane', description: 'Tante', hasArrived: false, isAbsent: false },
  { id: '3', firstName: 'Paul', lastName: 'Martin', tableNumber: 2, tableName: 'Amis Vip', inviter: 'Parents', description: 'Ami enfance', hasArrived: false, isAbsent: false },
  { id: '4', firstName: 'Sophie', lastName: 'Bernard', tableNumber: 2, tableName: 'Amis Vip', inviter: 'Serge', description: 'Collègue', hasArrived: false, isAbsent: false },
  { id: '5', firstName: 'Luc', lastName: 'Besson', tableNumber: "Table d'Honneur", tableName: 'Honneur', inviter: 'Christiane', description: 'Oncle', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '6', firstName: 'Emma', lastName: 'Watson', tableNumber: 3, inviter: 'Serge', description: 'Cousine éloignée', hasArrived: false, isAbsent: false },
  { id: '7', firstName: 'Thomas', lastName: 'Pesquet', tableNumber: 3, inviter: 'Serge', description: 'Ami lycée', hasArrived: false, isAbsent: false },
  { id: '8', firstName: 'Céline', lastName: 'Dion', tableNumber: 4, inviter: 'Christiane', description: 'Voisine', hasArrived: false, isAbsent: true },
  { id: '9', firstName: 'Omar', lastName: 'Sy', tableNumber: 4, inviter: 'Parents', description: 'Ami famille', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '10', firstName: 'Zinedine', lastName: 'Zidane', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Serge', description: 'Parrain', hasArrived: false, isAbsent: false },
];

// ==========================================
// REAL-TIME SUBSCRIPTION
// ==========================================
export const subscribeToGuests = (onUpdate: (guests: Guest[]) => void): Unsubscribe => {
    if (USE_MOCK_DATA) {
        // Mock implementation: just return initial data
        const stored = localStorage.getItem('demo_guests');
        const data = stored ? JSON.parse(stored) : MOCK_GUESTS;
        onUpdate(data);
        // Mock updates aren't real-time across tabs/devices without complex event listeners
        // Returning a no-op unsubscribe function
        return () => {};
    } else {
        if (!db) return () => {};
        
        const q = collection(db, "guests");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
            onUpdate(guests);
        }, (error) => {
            console.error("Error subscribing to guests:", error);
        });

        return unsubscribe;
    }
};

// ==========================================
// FETCH GUESTS (Legacy/One-time)
// ==========================================
export const fetchGuests = async (): Promise<Guest[]> => {
  if (USE_MOCK_DATA) {
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
    
    // Construct updates object carefully to avoid 'undefined'
    const updates: any = { 
      hasArrived, 
      arrivedAt: hasArrived ? new Date().toISOString() : null 
    };
    
    // Only explicitly set isAbsent to false if the guest has arrived.
    if (hasArrived) {
      updates.isAbsent = false;
    }

    await updateDoc(guestRef, updates);
  }
};

// ==========================================
// SET ABSENT STATUS
// ==========================================
export const setGuestAbsent = async (guestId: string, isAbsent: boolean): Promise<void> => {
  if (USE_MOCK_DATA) {
    const stored = localStorage.getItem('demo_guests');
    if (stored) {
      const guests: Guest[] = JSON.parse(stored);
      const updatedGuests = guests.map(g => {
        if (g.id === guestId) {
          return {
            ...g,
            isAbsent: isAbsent,
            hasArrived: isAbsent ? false : g.hasArrived, // If absent, cannot be arrived
            arrivedAt: isAbsent ? undefined : g.arrivedAt
          };
        }
        return g;
      });
      localStorage.setItem('demo_guests', JSON.stringify(updatedGuests));
    }
  } else {
    if (!db) return;
    const guestRef = doc(db, "guests", guestId);
    
    const updates: any = { 
      isAbsent: isAbsent
    };

    if (isAbsent) {
      updates.hasArrived = false;
      updates.arrivedAt = null;
    }

    await updateDoc(guestRef, updates);
  }
};

// ==========================================
// ADD GUEST
// ==========================================
export const addGuest = async (guest: Omit<Guest, 'id'>): Promise<Guest> => {
  if (USE_MOCK_DATA) {
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
// UPDATE TABLE DETAILS (Bulk Update)
// ==========================================
export const updateTableDetails = async (oldTableNumber: string | number, newTableNumber: string, newTableName: string): Promise<void> => {
    // Normalize inputs
    const targetTableString = oldTableNumber.toString();
    const newTableVal = newTableNumber;

    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('demo_guests');
        if (stored) {
            const guests: Guest[] = JSON.parse(stored);
            const updatedGuests = guests.map(g => {
                if (g.tableNumber.toString() === targetTableString) {
                    return { ...g, tableNumber: newTableVal, tableName: newTableName };
                }
                return g;
            });
            localStorage.setItem('demo_guests', JSON.stringify(updatedGuests));
        }
    } else {
        if (!db) throw new Error("DB not ready");
        
        const batch = writeBatch(db);
        let docsFound = 0;

        // 1. Chercher comme String
        const qString = query(collection(db, "guests"), where("tableNumber", "==", targetTableString));
        const snapString = await getDocs(qString);
        
        snapString.docs.forEach((doc) => {
             batch.update(doc.ref, { 
                 tableNumber: newTableVal,
                 tableName: newTableName
             });
             docsFound++;
        });

        // 2. Chercher comme Nombre
        const asNumber = Number(targetTableString);
        if (!isNaN(asNumber)) {
            const qNum = query(collection(db, "guests"), where("tableNumber", "==", asNumber));
            const snapNum = await getDocs(qNum);
            
            snapNum.docs.forEach((doc) => {
                batch.update(doc.ref, { 
                    tableNumber: newTableVal,
                    tableName: newTableName
                });
                docsFound++;
            });
        }

        if (docsFound > 0) {
            await batch.commit();
            console.log(`Updated ${docsFound} guests in Firebase.`);
        }
    }
};

// ==========================================
// DELETE GUEST
// ==========================================
export const deleteGuest = async (guestId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
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