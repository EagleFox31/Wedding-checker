import { TimelineItem } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, writeBatch, getDoc, setDoc } from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================
// Will automatically use Mock data if Firebase DB is not initialized in firebase.ts
const USE_MOCK_DATA = !db; 

// ==========================================
// MOCK DATA (FROM PDF)
// ==========================================
const MOCK_PLANNING: TimelineItem[] = [
  { id: '1', time: '19h00 – 20h00', title: 'Accueil et installation', description: 'Arrivée à la salle, cocktail ou apéritif, musique douce.', completed: false },
  { id: '2', time: '20h00', title: 'Piano-bar/Animations', description: 'Musique douce d’ambiance par DJ.', completed: false },
  { id: '3', time: '20h10 – 20h20', title: 'Entrée solennelle des mariés', description: 'a) Entrée du marié (compilation)\nb) Entrée de la mariée (ça fait mal de Kedjevara)', completed: false, isHighlight: true },
  { id: '4', time: '20h20 – 20h30', title: 'Discours', description: '- Chef de famille marié (M. SALOMON EMMANUEL)\n- Chef de famille mariée (Rév. Pasteur Emmanuel BISSACK)', completed: false },
  { id: '5', time: '20h40 – 20h45', title: 'Premier intermède', description: '1er balais des enfants (Lady Ponce et Blanche Bailly), Titre lève-toi.', completed: false },
  { id: '6', time: '20h45 – 20h50', title: 'Ouverture du buffet', description: '- Bénédiction du repas\n- Présentation menu par Mme PATIENCE AYISSI\n- Priorité aux mariés.', completed: false, isHighlight: true },
  { id: '7', time: '20h50 – 21h40', title: '2e balais des enfants', description: 'ULANDA ft COCO ARGENTE VALIDE', completed: false },
  { id: '8', time: '21h40 – 21h50', title: 'Deuxième intermède-Poème', description: 'Jessica Bolagnano Benebine - Titre nouveau départ', completed: false },
  { id: '9', time: '21h50 – 22h00', title: 'Jeux avec le public', description: 'Recherche d’un objet dans la salle', completed: false },
  { id: '10', time: '22h00', title: 'Prestation musicale des mariés', description: '- Mariée: Voilà moi de Tina\n- Mariées: Locko et Sandrine Nanga', completed: false, isHighlight: true },
  { id: '11', time: '21h50 – 22h30', title: 'Prestation Artiste NICO + DJ', description: 'Entrée en douceur pour lancer la soirée dansante', completed: false },
  { id: '12', time: '22h30 – 22h40', title: 'Jeux avec les mariés', description: 'De vous deux qui à …………', completed: false },
  { id: '13', time: '22h40 – 22h45', title: 'Ouverture du bal', description: 'Tour d’honneur des mariés', completed: false, isHighlight: true },
  { id: '14', time: '22h45 – 23h30', title: 'Tour d’honneur parents et invités', description: 'Faire une liste en fonction des invités présents', completed: false },
  { id: '15', time: '23h30 – 00h05', title: 'Remise des cadeaux', description: '', completed: false },
  { id: '16', time: '00h05 – 00h30', title: 'Gâteau & Champagne', description: 'Coupure du gâteau et ouverture du champagne', completed: false, isHighlight: true },
  { id: '17', time: '00h30 – 01h00', title: 'Jet du bouquet de fleur', description: '', completed: false },
  { id: '18', time: '01h00', title: 'Piste libre', description: 'Fin du protocole', completed: false },
];

// ==========================================
// PARTY STATUS (STARTED OR NOT)
// ==========================================
export const getPartyStatus = async (): Promise<boolean> => {
  // Check local storage first for speed/fallback
  const localStatus = localStorage.getItem('wedding_party_started');
  if (localStatus !== null) return localStatus === 'true';

  if (!USE_MOCK_DATA && db) {
    try {
      const docRef = doc(db, "config", "planning");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const started = docSnap.data().started === true;
        // Sync local
        localStorage.setItem('wedding_party_started', started ? 'true' : 'false');
        return started;
      }
    } catch (e) {
      console.warn("Could not fetch party status from Firebase", e);
    }
  }
  return false;
};

export const setPartyStarted = async (started: boolean): Promise<void> => {
  // 1. Always set local storage immediately so UI reacts
  localStorage.setItem('wedding_party_started', started ? 'true' : 'false');

  // 2. Try to sync with Firebase
  if (!USE_MOCK_DATA && db) {
    try {
        const docRef = doc(db, "config", "planning");
        // Use setDoc with merge to create document if it doesn't exist
        await setDoc(docRef, { started }, { merge: true });
    } catch (e) {
        console.error("Firebase update failed, using local fallback mode", e);
    }
  }
};

// ==========================================
// RESET PLANNING PROGRESS
// ==========================================
export const resetPlanningProgress = async (): Promise<void> => {
  console.log("Resetting planning progress...");
  
  // 1. Reset Local Storage
  const stored = localStorage.getItem('wedding_planning');
  if (stored) {
    try {
      const items = JSON.parse(stored);
      if (Array.isArray(items)) {
        const resetItems = items.map((i: any) => ({ ...i, completed: false }));
        localStorage.setItem('wedding_planning', JSON.stringify(resetItems));
      }
    } catch (e) {
      console.error("Error parsing local items during reset", e);
    }
  }

  // 2. Reset Firebase
  if (!USE_MOCK_DATA && db) {
    try {
      const snapshot = await getDocs(collection(db, "planning"));
      const batch = writeBatch(db);
      
      if (snapshot.empty) {
        console.log("No docs to reset in Firebase.");
        return;
      }

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { completed: false });
      });
      
      await batch.commit();
      console.log("Firebase planning reset committed.");
    } catch (e) {
      console.error("Failed to reset firebase planning", e);
    }
  }
};

// ==========================================
// FETCH PLANNING
// ==========================================
export const fetchPlanning = async (): Promise<TimelineItem[]> => {
  if (USE_MOCK_DATA) {
    const stored = localStorage.getItem('wedding_planning');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('wedding_planning', JSON.stringify(MOCK_PLANNING));
    return MOCK_PLANNING;
  } else {
    try {
      if (!db) throw new Error("Database not initialized");
      
      const q = query(collection(db, "planning"));
      const snapshot = await getDocs(q);
      
      // AUTO-SEED: If Firebase is empty, fill it with the default program
      if (snapshot.empty) {
        console.log("Initializing Planning Data in Firebase...");
        const batch = writeBatch(db);
        
        MOCK_PLANNING.forEach((item) => {
            // Use specific ID so we can sort them easily later
            const docRef = doc(db, "planning", item.id);
            // Ensure completed is false
            batch.set(docRef, { ...item, completed: false });
        });
        
        await batch.commit();
        return MOCK_PLANNING;
      }
      
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineItem));
      // Sort by ID (numeric)
      return items.sort((a,b) => parseInt(a.id) - parseInt(b.id));
    } catch (e) {
      console.error("Firebase planning fetch error:", e);
      return MOCK_PLANNING;
    }
  }
};

// ==========================================
// TOGGLE COMPLETE
// ==========================================
export const toggleItemComplete = async (itemId: string, completed: boolean): Promise<void> => {
  if (USE_MOCK_DATA) {
    const stored = localStorage.getItem('wedding_planning');
    if (stored) {
      const items: TimelineItem[] = JSON.parse(stored);
      const updated = items.map(i => i.id === itemId ? { ...i, completed } : i);
      localStorage.setItem('wedding_planning', JSON.stringify(updated));
    }
  } else {
    if (!db) return;
    const ref = doc(db, "planning", itemId);
    await updateDoc(ref, { completed });
  }
};

// ==========================================
// ADD ITEM
// ==========================================
export const addPlanningItem = async (item: Omit<TimelineItem, 'id'>): Promise<TimelineItem> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('wedding_planning');
        const items: TimelineItem[] = stored ? JSON.parse(stored) : MOCK_PLANNING;
        const newItem = { ...item, id: Date.now().toString() };
        items.push(newItem);
        localStorage.setItem('wedding_planning', JSON.stringify(items));
        return newItem;
    } else {
        if (!db) throw new Error("Database not initialized");
        const newId = Date.now().toString(); 
        const finalItem = { ...item, id: newId };
        const batch = writeBatch(db);
        batch.set(doc(db, "planning", newId), finalItem);
        await batch.commit();
        return finalItem;
    }
};

// ==========================================
// UPDATE ITEM
// ==========================================
export const updatePlanningItem = async (id: string, updates: Partial<TimelineItem>): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('wedding_planning');
        if (stored) {
            const items: TimelineItem[] = JSON.parse(stored);
            const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
            localStorage.setItem('wedding_planning', JSON.stringify(updated));
        }
    } else {
        if (!db) return;
        const ref = doc(db, "planning", id);
        await updateDoc(ref, updates);
    }
};

// ==========================================
// DELETE ITEM
// ==========================================
export const deletePlanningItem = async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('wedding_planning');
        if (stored) {
            const items: TimelineItem[] = JSON.parse(stored);
            const updated = items.filter(i => i.id !== id);
            localStorage.setItem('wedding_planning', JSON.stringify(updated));
        }
    } else {
        if (!db) return;
        await deleteDoc(doc(db, "planning", id));
    }
};

// ==========================================
// HELPER: PARSE TIME
// ==========================================
export const getStartTimeFromString = (timeStr: string): Date | null => {
    const match = timeStr.match(/(\d{1,2})[hH:](\d{2})/);
    if (!match) return null;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    // Handling date crossover
    const now = new Date();
    if (hours < 6 && now.getHours() > 12) {
        date.setDate(date.getDate() + 1);
    }
    
    return date;
};