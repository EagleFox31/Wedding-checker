import { Guest, Table } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc, addDoc, query, where, onSnapshot, Unsubscribe, getDoc } from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================
const USE_MOCK_DATA = !db; 

// ==========================================
// MOCK DATA GENERATOR
// ==========================================
const MOCK_TABLES: Table[] = [
  { id: 't_1', number: 1, name: 'Les Mariés' },
  { id: 't_2', number: 2, name: 'Amis Vip' },
  { id: 't_3', number: 3, name: 'Cousins' },
  { id: 't_4', number: 4, name: 'Voisins' },
  { id: 't_honneur', number: "Table d'Honneur", name: 'Honneur' },
];

const MOCK_GUESTS: Guest[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', tableId: 't_1', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Serge', description: 'Témoin', hasArrived: true, arrivedAt: new Date().toISOString(), plusOne: true, isAbsent: false },
  { id: '2', firstName: 'Marie', lastName: 'Curie', tableId: 't_1', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Christiane', description: 'Tante', hasArrived: false, isAbsent: false },
  { id: '3', firstName: 'Paul', lastName: 'Martin', tableId: 't_2', tableNumber: 2, tableName: 'Amis Vip', inviter: 'Parents', description: 'Ami enfance', hasArrived: false, isAbsent: false },
  { id: '4', firstName: 'Sophie', lastName: 'Bernard', tableId: 't_2', tableNumber: 2, tableName: 'Amis Vip', inviter: 'Serge', description: 'Collègue', hasArrived: false, isAbsent: false },
  { id: '5', firstName: 'Luc', lastName: 'Besson', tableId: 't_honneur', tableNumber: "Table d'Honneur", tableName: 'Honneur', inviter: 'Christiane', description: 'Oncle', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '6', firstName: 'Emma', lastName: 'Watson', tableId: 't_3', tableNumber: 3, inviter: 'Serge', description: 'Cousine éloignée', hasArrived: false, isAbsent: false },
  { id: '7', firstName: 'Thomas', lastName: 'Pesquet', tableId: 't_3', tableNumber: 3, inviter: 'Serge', description: 'Ami lycée', hasArrived: false, isAbsent: false },
  { id: '8', firstName: 'Céline', lastName: 'Dion', tableId: 't_4', tableNumber: 4, inviter: 'Christiane', description: 'Voisine', hasArrived: false, isAbsent: true },
  { id: '9', firstName: 'Omar', lastName: 'Sy', tableId: 't_4', tableNumber: 4, inviter: 'Parents', description: 'Ami famille', hasArrived: true, arrivedAt: new Date().toISOString(), isAbsent: false },
  { id: '10', firstName: 'Zinedine', lastName: 'Zidane', tableId: 't_1', tableNumber: 1, tableName: 'Les Mariés', inviter: 'Serge', description: 'Parrain', hasArrived: false, isAbsent: false },
];

// ==========================================
// HELPER: BATCH CHUNKING (Fix Firestore 500 limit)
// ==========================================
const commitBatches = async (operations: ((batch: any) => void)[]) => {
    if (!db) return;
    
    const CHUNK_SIZE = 400; // Safe margin below 500
    const chunks = [];
    
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        chunks.push(operations.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Processing ${operations.length} operations in ${chunks.length} batches...`);

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(op => op(batch));
        await batch.commit();
    }
};

// ==========================================
// REAL-TIME SUBSCRIPTION (GUESTS)
// ==========================================
export const subscribeToGuests = (onUpdate: (guests: Guest[]) => void): Unsubscribe => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('demo_guests');
        const data = stored ? JSON.parse(stored) : MOCK_GUESTS;
        onUpdate(data);
        return () => {};
    } else {
        if (!db) return () => {};
        
        const q = collection(db, "guests");
        return onSnapshot(q, (snapshot) => {
            const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guest));
            onUpdate(guests);
        }, (error) => {
            console.error("Error subscribing to guests:", error);
        });
    }
};

// ==========================================
// REAL-TIME SUBSCRIPTION (TABLES)
// ==========================================
export const subscribeToTables = (onUpdate: (tables: Table[]) => void): Unsubscribe => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('demo_tables');
        const data = stored ? JSON.parse(stored) : MOCK_TABLES;
        onUpdate(data);
        return () => {};
    } else {
        if (!db) return () => {};
        
        const q = collection(db, "tables");
        return onSnapshot(q, (snapshot) => {
            const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
            // Sort by number (numeric aware)
            onUpdate(tables.sort((a,b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true })));
        }, (error) => {
            console.error("Error subscribing to tables:", error);
        });
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
    
    const updates: any = { 
      hasArrived, 
      arrivedAt: hasArrived ? new Date().toISOString() : null 
    };
    
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
            hasArrived: isAbsent ? false : g.hasArrived,
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
    
    const updates: any = { isAbsent: isAbsent };
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
// UPDATE GUEST DETAILS
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
// UPDATE TABLE (Renaming)
// ==========================================
export const updateTable = async (tableId: string, updates: Partial<Table>): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('demo_tables');
        if (stored) {
            const tables: Table[] = JSON.parse(stored);
            const updatedTables = tables.map(t => t.id === tableId ? { ...t, ...updates } : t);
            localStorage.setItem('demo_tables', JSON.stringify(updatedTables));
        }
    } else {
        if (!db) return;
        const tableRef = doc(db, "tables", tableId);
        await updateDoc(tableRef, updates);
    }
};

export const addTable = async (table: Table): Promise<void> => {
    if (USE_MOCK_DATA) {
         const stored = localStorage.getItem('demo_tables');
         const tables: Table[] = stored ? JSON.parse(stored) : MOCK_TABLES;
         // Check if exists
         if (!tables.find(t => t.id === table.id)) {
            tables.push(table);
            localStorage.setItem('demo_tables', JSON.stringify(tables));
         }
    } else {
        if (!db) return;
        // We use setDoc to specify the ID (t_1) instead of addDoc (random ID)
        await setDoc(doc(db, "tables", table.id), table);
    }
}

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
// REPAIR DATABASE SCHEMA (Fix missing tables)
// ==========================================
export const repairDatabaseSchema = async (): Promise<void> => {
    if (!db) return;
    console.log("Running Database Integrity Check & Repair...");

    try {
        // 1. Get all guests
        const guestsSnap = await getDocs(collection(db, "guests"));
        const guests = guestsSnap.docs.map(d => ({id: d.id, ...d.data()} as Guest));

        // 2. Get all tables
        const tablesSnap = await getDocs(collection(db, "tables"));
        const existingTableIds = new Set(tablesSnap.docs.map(d => d.id));

        // 3. Find missing tables
        const tablesToCreate = new Map<string, Table>();
        const ops: ((batch: any) => void)[] = [];

        guests.forEach(g => {
            // Generate the deterministic ID
            const safeNumber = g.tableNumber ? g.tableNumber.toString().trim() : '0';
            const safeId = `t_${safeNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

            // Check if this table ID is missing from DB AND we haven't already queued it for creation
            if (!existingTableIds.has(safeId) && !tablesToCreate.has(safeId)) {
                const newTable: Table = {
                    id: safeId,
                    number: g.tableNumber || '?',
                    name: g.tableName || '' // Restore name from guest data
                };
                tablesToCreate.set(safeId, newTable);
                
                // Add Create Table Op
                ops.push((batch) => {
                    const ref = doc(db!, "tables", safeId);
                    batch.set(ref, newTable);
                });
            }

            // Also check if Guest needs the tableId link
            if (g.tableId !== safeId) {
                ops.push((batch) => {
                    const ref = doc(db!, "guests", g.id);
                    batch.update(ref, { tableId: safeId });
                });
            }
        });

        if (ops.length > 0) {
            console.log(`Found ${tablesToCreate.size} missing tables and inconsistencies. Repairing...`);
            await commitBatches(ops);
            console.log("Database repair complete.");
        } else {
            console.log("Database integrity verified. All tables exist.");
        }
        
        // Mark as migrated
        const configRef = doc(db, 'config', 'system');
        await setDoc(configRef, { migration_tables_v2: true }, { merge: true });

    } catch (e) {
        console.error("Repair failed", e);
    }
};

// ==========================================
// AUTOMATED DB INITIALIZATION
// ==========================================
export const initializeDatabase = async (): Promise<void> => {
  if ((window as any)._hasInitializedDB) return;
  (window as any)._hasInitializedDB = true;

  if (USE_MOCK_DATA) {
     const isMigrated = localStorage.getItem('migration_v2_completed');
     if (!isMigrated) {
        // Simpler logic for mock
        const guests = JSON.parse(localStorage.getItem('demo_guests') || '[]');
        await uploadGuestList(guests); // Reuse upload logic to sync tables
     }
     return;
  }

  // Check and repair automatically on load
  await repairDatabaseSchema();
};


// ==========================================
// ADMIN: BATCH UPLOAD (With Batch Chunking)
// ==========================================
export const uploadGuestList = async (guests: Guest[]) => {
  // 1. Extract Unique Tables from the guest list
  const uniqueTables = new Map<string, Table>();
  
  guests.forEach(g => {
      // Create a deterministic ID based on table number
      const safeNumber = g.tableNumber.toString().trim();
      const safeId = `t_${safeNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
      
      if (!uniqueTables.has(safeId)) {
          uniqueTables.set(safeId, {
              id: safeId,
              number: g.tableNumber,
              name: g.tableName || ''
          });
      }
      // Assign the link
      g.tableId = safeId;
  });

  const tablesToUpload = Array.from(uniqueTables.values());

  if (USE_MOCK_DATA) {
    localStorage.setItem('demo_guests', JSON.stringify(guests));
    localStorage.setItem('demo_tables', JSON.stringify(tablesToUpload));
    localStorage.setItem('migration_v2_completed', 'true');
    window.location.reload();
  } else {
    if (!db) throw new Error("Firebase DB not ready");
    
    // PREPARE OPERATIONS
    const ops: ((batch: any) => void)[] = [];

    // Ops for Tables
    tablesToUpload.forEach((table) => {
        ops.push((batch) => {
            const tableRef = doc(db!, "tables", table.id);
            batch.set(tableRef, table);
        });
    });

    // Ops for Guests
    guests.forEach((guest) => {
        ops.push((batch) => {
            const docRef = doc(collection(db!, "guests"), guest.id);
            batch.set(docRef, guest);
        });
    });
    
    // EXECUTE IN CHUNKS
    await commitBatches(ops);
  }
};

export const resetDemoData = () => {
  localStorage.removeItem('demo_guests');
  localStorage.removeItem('demo_tables');
  localStorage.removeItem('migration_v2_completed');
  window.location.reload();
};