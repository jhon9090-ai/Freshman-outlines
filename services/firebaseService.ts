import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { StudyOutline } from '../types';

// Firebase configuration
// Note: These values should be replaced with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions for study outlines
export const saveOutline = async (outline: StudyOutline, userId: string) => {
  try {
    const outlineRef = doc(db, 'users', userId, 'outlines', outline.id);
    await setDoc(outlineRef, {
      ...outline,
      updatedAt: new Date().toISOString(),
    });
    return outline.id;
  } catch (error) {
    console.error('Error saving outline:', error);
    throw error;
  }
};

export const getOutline = async (outlineId: string, userId: string) => {
  try {
    const outlineRef = doc(db, 'users', userId, 'outlines', outlineId);
    const outlineSnap = await getDoc(outlineRef);
    
    if (outlineSnap.exists()) {
      return outlineSnap.data() as StudyOutline;
    } else {
      throw new Error('Outline not found');
    }
  } catch (error) {
    console.error('Error getting outline:', error);
    throw error;
  }
};

export const getAllOutlines = async (userId: string) => {
  try {
    const outlinesRef = collection(db, 'users', userId, 'outlines');
    const outlineSnap = await getDocs(outlinesRef);
    
    const outlines: StudyOutline[] = [];
    outlineSnap.forEach((doc) => {
      outlines.push(doc.data() as StudyOutline);
    });
    
    return outlines;
  } catch (error) {
    console.error('Error getting all outlines:', error);
    throw error;
  }
};

export const updateOutline = async (outline: StudyOutline, userId: string) => {
  try {
    const outlineRef = doc(db, 'users', userId, 'outlines', outline.id);
    await updateDoc(outlineRef, {
      ...outline,
      updatedAt: new Date().toISOString(),
    });
    return outline.id;
  } catch (error) {
    console.error('Error updating outline:', error);
    throw error;
  }
};

export const deleteOutline = async (outlineId: string, userId: string) => {
  try {
    const outlineRef = doc(db, 'users', userId, 'outlines', outlineId);
    await deleteDoc(outlineRef);
    return true;
  } catch (error) {
    console.error('Error deleting outline:', error);
    throw error;
  }
};

// Function to sync local storage with Firestore
export const syncOutlinesWithFirestore = async (userId: string, localOutlines: StudyOutline[]) => {
  try {
    // Get all outlines from Firestore
    const firestoreOutlines = await getAllOutlines(userId);
    
    // Create a map of Firestore outlines by ID for easy lookup
    const firestoreOutlinesMap = new Map<string, StudyOutline>();
    firestoreOutlines.forEach(outline => {
      firestoreOutlinesMap.set(outline.id, outline);
    });
    
    // Create a map of local outlines by ID for easy lookup
    const localOutlinesMap = new Map<string, StudyOutline>();
    localOutlines.forEach(outline => {
      localOutlinesMap.set(outline.id, outline);
    });
    
    // Arrays to track changes
    const toCreate: StudyOutline[] = [];
    const toUpdate: StudyOutline[] = [];
    const toDelete: string[] = [];
    
    // Find outlines to create or update
    localOutlines.forEach(localOutline => {
      const firestoreOutline = firestoreOutlinesMap.get(localOutline.id);
      
      if (!firestoreOutline) {
        // Outline exists locally but not in Firestore, create it
        toCreate.push(localOutline);
      } else {
        // Outline exists in both places, check which is newer
        const localUpdatedAt = localOutline.updatedAt ? new Date(localOutline.updatedAt) : new Date(0);
        const firestoreUpdatedAt = firestoreOutline.updatedAt ? new Date(firestoreOutline.updatedAt) : new Date(0);
        
        if (localUpdatedAt > firestoreUpdatedAt) {
          // Local is newer, update Firestore
          toUpdate.push(localOutline);
        }
      }
    });
    
    // Find outlines to delete (exist in Firestore but not locally)
    firestoreOutlines.forEach(firestoreOutline => {
      if (!localOutlinesMap.has(firestoreOutline.id)) {
        toDelete.push(firestoreOutline.id);
      }
    });
    
    // Perform all operations
    const createPromises = toCreate.map(outline => saveOutline(outline, userId));
    const updatePromises = toUpdate.map(outline => updateOutline(outline, userId));
    const deletePromises = toDelete.map(outlineId => deleteOutline(outlineId, userId));
    
    await Promise.all([...createPromises, ...updatePromises, ...deletePromises]);
    
    // Return the updated list of outlines from Firestore
    return await getAllOutlines(userId);
  } catch (error) {
    console.error('Error syncing outlines with Firestore:', error);
    throw error;
  }
};