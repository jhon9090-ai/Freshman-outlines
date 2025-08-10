import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { FirebaseConfig, StudyOutline, CurriculumSource } from '../types';

// Re-export the User type for other components
export type User = firebase.User;

type FirebaseApp = firebase.app.App;
const Timestamp = firebase.firestore.Timestamp;

let app: FirebaseApp;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

export function initializeFirebase(config: FirebaseConfig) {
    if (!config || !config.apiKey || !config.projectId) {
        return null;
    }
    
    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(config);
        } else {
            app = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
        return { app, auth, db };
    } catch (error) {
        console.error("Firebase initialization error:", error);
        return null;
    }
}

// --- Auth Service ---

export function onAuthChange(callback: (user: User | null) => void) {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
}

export async function signInWithGoogle() {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Google Sign-In Error", error);
        throw error;
    }
}

export function signOutUser() {
    if (!auth) throw new Error("Firebase not initialized");
    return auth.signOut();
}


// --- Firestore Data Service ---

const getOutlinesCollection = (userId: string) => db.collection(`users/${userId}/outlines`);

export function onOutlinesUpdate(
    userId: string, 
    callback: (outlines: StudyOutline[]) => void,
    onError: (error: Error) => void
) {
    if (!db) return () => {};
    const q = getOutlinesCollection(userId);

    return q.onSnapshot((querySnapshot) => {
        const outlines: StudyOutline[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt;
            outlines.push({ ...data, id: doc.id, createdAt } as StudyOutline);
        });
        callback(outlines);
    }, (error) => {
        console.error("Error listening to outlines:", error);
        onError(error);
    });
}

export async function addOutline(userId: string, outline: Omit<StudyOutline, 'id'>): Promise<StudyOutline> {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await getOutlinesCollection(userId).add({
        ...outline,
        createdAt: Timestamp.fromDate(new Date(outline.createdAt))
    });
    return { ...outline, id: docRef.id };
}

export function updateOutline(userId: string, outlineId: string, data: Partial<StudyOutline>) {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = db.doc(`users/${userId}/outlines/${outlineId}`);
    return docRef.update(data);
}

export function deleteOutline(userId: string, outlineId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = db.doc(`users/${userId}/outlines/${outlineId}`);
    return docRef.delete();
}

export async function deleteOutlineBySource(userId: string, source: CurriculumSource) {
    if (!db) throw new Error("Firestore not initialized");

    const q = getOutlinesCollection(userId)
        .where("curriculumSource.subjectKey", "==", source.subjectKey)
        .where("curriculumSource.theme", "==", source.theme)
        .where("curriculumSource.unit", "==", source.unit);

    const querySnapshot = await q.get();
    const batch = db.batch();
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
}