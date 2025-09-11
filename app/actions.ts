'use server'

import { db } from './lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function saveData(data: { message: string }) {
  try {
    const docRef = await addDoc(collection(db, "test_data"), data);
    console.log("Document written with ID: ", docRef.id);
    return { success: true, docId: docRef.id };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, error: e };
  }
}
