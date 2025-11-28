import { TimelineItem } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, writeBatch, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

// ==========================================
// CONFIGURATION
// ==========================================
const USE_MOCK_DATA = !db; 
const STORAGE_KEY = 'wedding_planning_cs_v5'; 
const PLANNING_VERSION = 5;

// ==========================================
// MOCK DATA GENERATOR (PROGRAMME COMPLET CHRISTIANE & SERGE)
// ==========================================
const MOCK_PLANNING: TimelineItem[] = [
  // 1. MATINÉE – PRÉPARATIFS
  { id: '1', category: 'matin', time: '06h30 – 07h00', title: 'Réveil et Organisation', description: 'Réveil des mariés, mise en place des équipes (coiffure, maquillage, habillage).', completed: false },
  { id: '2', category: 'matin', time: '07h00 – 09h00', title: 'Maquillage & Habillage', description: 'Maquillage et coiffure de la mariée, Habillage du marié.', completed: false },
  { id: '3', category: 'matin', time: '09h00 – 09h30', title: 'Finalisation', description: 'Installation des témoins, vérification des alliances & documents officiels, petit-déjeuner léger.', completed: false },
  { id: '3b', category: 'matin', time: '09h30 – 10h00', title: 'Départ Mairie', description: 'Organisation du cortège pour l’Hôtel de ville de BAFTIA.', completed: false },

  // 2. MAIRIE – CÉRÉMONIE CIVILE
  { id: '4', category: 'mairie', time: '10h00', title: 'Début Cérémonie Civile', description: 'Hôtel de ville de BAFTIA. Arrivée du couple, témoins et familles.', completed: false, isHighlight: true },
  { id: '5', category: 'mairie', time: '10h00 – 10h45', title: 'Célébration', description: 'Cérémonie civile, lecture des actes, signature des registres.', completed: false },
  { id: '6', category: 'mairie', time: '10h45 – 11h15', title: 'Photos Officielles', description: 'Photos avec l\'officier, témoins et familles devant la mairie.', completed: false },
  { id: '7', category: 'mairie', time: '11h15 – 12h30', title: 'Séance Photo Couple', description: 'Portraits de famille et transition vers le cocktail.', completed: false },

  // 3. COCKTAIL
  { id: '8', category: 'cocktail', time: '12h30', title: 'Début du Cocktail', description: 'Domicile des mariés (Quartier Bissebock, 2e chellerie). Installation des invités et rafraîchissements.', completed: false, isHighlight: true },
  { id: '9', category: 'cocktail', time: '12h30 – 14h30', title: 'Animation', description: 'Cocktail officiel, animation musicale, mot de bienvenue des familles.', completed: false },

  // 4. ÉGLISE – BÉNÉDICTION NUPTIALE
  { id: '10', category: 'eglise', time: '14h30 – 15h00', title: 'Installation Église', description: 'Départ du cocktail et installation des invités à la Paroisse EPC-KOTOUO LOUISE MORLIA.', completed: false },
  { id: '11', category: 'eglise', time: '15h00', title: 'Début Bénédiction', description: 'Entrée solennelle et début du culte.', completed: false, isHighlight: true },
  { id: '12', category: 'eglise', time: '15h00 – 16h30', title: 'Cérémonie Religieuse', description: 'Prédication, bénédiction nuptiale et signature du registre.', completed: false },
  { id: '13', category: 'eglise', time: '16h30 – 18h00', title: 'Photos Parvis', description: 'Photos des familles et témoins devant l’église.', completed: false },
  { id: '14', category: 'eglise', time: '18h00 – 19h00', title: 'Transition Soirée', description: 'Retour et derniers ajustements avant la réception.', completed: false },

  // 5. SOIRÉE NUPTIALE (Mise à jour complète)
  { id: '15', category: 'soiree', time: '19h00 – 20h00', title: 'Accueil & Installation', description: 'Cocktail / apéritif, musique douce.', completed: false },
  { id: '16', category: 'soiree', time: '20h00', title: 'Ambiance', description: 'Piano-bar / animations DJ (ambiance douce).', completed: false },
  { id: '17', category: 'soiree', time: '20h10 – 20h20', title: 'Entrée Solennelle', description: 'Entrée du marié (compilation), Entrée de la mariée (« Ça fait mal » – Kedjevara).', completed: false, isHighlight: true },
  { id: '18', category: 'soiree', time: '20h20 – 20h30', title: 'Discours', description: 'Chef de famille BIKANDA (Salomon Emmanuel) et Chef de famille BISSACK (Révérend Emmanuel Bissack).', completed: false },
  { id: '19', category: 'soiree', time: '20h40 – 20h45', title: '1er Intermède', description: 'Ballet des enfants (Lady Ponce & Blanche Bailly – “Lève-toi”).', completed: false },
  { id: '20', category: 'soiree', time: '20h45 – 20h50', title: 'Ouverture du Buffet', description: 'Bénédiction, Présentation du menu (Mme Patience Ayissi), Service par table.', completed: false, isHighlight: true },
  { id: '21', category: 'soiree', time: '20h50 – 21h40', title: '2e Intermède', description: '2e ballet des enfants (Ulanda ft Coco Argenté — “Valide”).', completed: false },
  { id: '22', category: 'soiree', time: '21h40 – 21h50', title: 'Poème', description: '“Nouveau départ” – Jessica Bolagnano Benebine.', completed: false },
  { id: '23', category: 'soiree', time: '21h50 – 22h00', title: 'Animation Public', description: 'Jeux avec le public (Recherche d’un objet dans la salle).', completed: false },
  { id: '24', category: 'soiree', time: '22h00', title: 'Prestations Mariés', description: 'Mariée (Voilà moi – Tina), Les mariés (Locko & Sandrine Nanga).', completed: false },
  { id: '25', category: 'soiree', time: '22h10 – 22h30', title: 'Prestation Artiste', description: 'Artiste invité : NICO. DJ (lancement de la soirée dansante).', completed: false, isHighlight: true },
  { id: '26', category: 'soiree', time: '22h30 – 22h40', title: 'Animation Couple', description: 'Jeux avec les mariés (“De vous deux, qui… ?”).', completed: false },
  { id: '27', category: 'soiree', time: '22h40 – ...', title: 'Ouverture du Bal', description: 'Soirée dansante générale.', completed: false, isHighlight: true },
];

// ==========================================
// REAL-TIME SUBSCRIPTIONS
// ==========================================
export const subscribeToPlanning = (onUpdate: (items: TimelineItem[]) => void): Unsubscribe => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : MOCK_PLANNING;
        onUpdate(data);
        return () => {};
    } else {
        if (!db) return () => {};
        
        // 1. Check version first (one time)
        const configRef = doc(db, "config", "planning_metadata");
        getDoc(configRef).then(async (configSnap) => {
             const remoteVersion = configSnap.exists() ? configSnap.data().version : 0;
             if (remoteVersion < PLANNING_VERSION) {
                 await overwritePlanningWithDefaults();
             }
        });

        // 2. Subscribe to collection
        const q = query(collection(db, "planning"));
        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) return;
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineItem));
            // Sort by ID (handle numeric strings logic to sort '3b' correctly after '3')
            const sorted = items.sort((a,b) => {
                const numA = parseFloat(a.id);
                const numB = parseFloat(b.id);
                if (!isNaN(numA) && !isNaN(numB)) {
                    if (numA !== numB) return numA - numB;
                }
                return a.id.localeCompare(b.id);
            });
            onUpdate(sorted);
        });
    }
};

export const subscribeToPartyStatus = (onUpdate: (started: boolean) => void): Unsubscribe => {
    if (USE_MOCK_DATA) {
        return () => {};
    } else {
        if (!db) return () => {};
        const docRef = doc(db, "config", "planning");
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                onUpdate(docSnap.data().started === true);
            } else {
                onUpdate(false);
            }
        });
    }
};

// ==========================================
// PARTY STATUS (Legacy/One-time)
// ==========================================
export const getPartyStatus = async (): Promise<boolean> => {
  const localStatus = localStorage.getItem('wedding_party_started');
  if (localStatus !== null) return localStatus === 'true';

  if (!USE_MOCK_DATA && db) {
    try {
      const docRef = doc(db, "config", "planning");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const started = docSnap.data().started === true;
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
  localStorage.setItem('wedding_party_started', started ? 'true' : 'false');

  if (!USE_MOCK_DATA && db) {
    try {
        const docRef = doc(db, "config", "planning");
        await setDoc(docRef, { started }, { merge: true });
    } catch (e) {
        console.error("Firebase update failed", e);
    }
  }
};

// ==========================================
// RESET PLANNING PROGRESS
// ==========================================
export const resetPlanningProgress = async (): Promise<void> => {
  console.log("Resetting planning progress...");
  const currentItems = await fetchPlanning();
  const updatedItems = currentItems.map(i => ({...i, completed: false}));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  
  if (!USE_MOCK_DATA && db) {
    try {
      const snapshot = await getDocs(collection(db, "planning"));
      // ACID: Use a batch to update all docs atomically
      const batch = writeBatch(db);
      
      if (snapshot.empty) return;

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { completed: false });
      });
      
      await batch.commit();
    } catch (e) {
      console.error("Failed to reset firebase planning", e);
    }
  }
};

// ==========================================
// FORCE RESET TO DEFAULTS (ACID COMPLIANT)
// ==========================================
export const overwritePlanningWithDefaults = async (): Promise<void> => {
  console.log(`Overwriting planning with default data (Version ${PLANNING_VERSION})...`);
  
  // 1. Local Storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANNING));
  
  // 2. Firebase (if connected)
  if (!USE_MOCK_DATA && db) {
    try {
      const snapshot = await getDocs(collection(db, "planning"));
      
      // ACID: Use a single batch for both deletion and creation
      const batch = writeBatch(db);
      
      // A. Queue Deletes
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // B. Queue Creations
      MOCK_PLANNING.forEach((item) => {
          const docRef = doc(db, "planning", item.id);
          batch.set(docRef, item);
      });
      
      // C. Update Version
      const versionRef = doc(db, "config", "planning_metadata");
      batch.set(versionRef, { version: PLANNING_VERSION });
      
      // D. Commit All at once
      await batch.commit();
      console.log("Firebase planning successfully updated (ACID transaction).");
    } catch (e) {
      console.error("Failed to overwrite firebase planning", e);
      throw e;
    }
  }
};

// ==========================================
// FETCH PLANNING (Legacy)
// ==========================================
export const fetchPlanning = async (): Promise<TimelineItem[]> => {
  if (USE_MOCK_DATA) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANNING));
    return MOCK_PLANNING;
  } else {
    try {
      if (!db) throw new Error("Database not initialized");
      
      const configRef = doc(db, "config", "planning_metadata");
      const configSnap = await getDoc(configRef);
      const remoteVersion = configSnap.exists() ? configSnap.data().version : 0;
      
      if (remoteVersion < PLANNING_VERSION) {
          await overwritePlanningWithDefaults();
          return MOCK_PLANNING;
      }

      const q = query(collection(db, "planning"));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await overwritePlanningWithDefaults();
        return MOCK_PLANNING;
      }
      
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineItem));
      // Robust Sort
      return items.sort((a,b) => {
            const numA = parseFloat(a.id);
            const numB = parseFloat(b.id);
            if (!isNaN(numA) && !isNaN(numB)) {
                if (numA !== numB) return numA - numB;
            }
            return a.id.localeCompare(b.id);
      });
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const items: TimelineItem[] = JSON.parse(stored);
      const updated = items.map(i => i.id === itemId ? { ...i, completed } : i);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
        const stored = localStorage.getItem(STORAGE_KEY);
        const items: TimelineItem[] = stored ? JSON.parse(stored) : MOCK_PLANNING;
        const newItem = { ...item, id: Date.now().toString() };
        items.push(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const items: TimelineItem[] = JSON.parse(stored);
            const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const items: TimelineItem[] = JSON.parse(stored);
            const updated = items.filter(i => i.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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

    // Handling date crossover for late night events
    const now = new Date();
    if (hours < 6 && now.getHours() > 12) {
        date.setDate(date.getDate() + 1);
    }
    
    return date;
};