
// This service handles saving test data to Firebase Firestore and Cloud Storage.
import { app } from '@/lib/firebase';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, deleteObject, getDownloadURL } from 'firebase/storage';

const db = getFirestore(app);
const storage = getStorage(app);
const testsCollection = collection(db, 'tests');

export interface TestData {
    id?: string;
    title: string;
    sections: any[]; // A more specific type can be used here
    stats: {
        totalQuestions: number;
        totalScore: number;
        totalParts: number;
    };
    curriculumId?: string;
    knowledgeUnitId?: string;
    timeLimit?: number;
    createdAt: any; // Can be a Date object or a string
    updatedAt?: any;
}

/**
 * Uploads a data URI to Firebase Cloud Storage.
 * @param dataUri The data URI to upload.
 * @param path The path in Cloud Storage to upload the file to.
 * @returns The public download URL of the uploaded file.
 */
async function uploadDataUriToStorage(dataUri: string, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    // 'data_url' is the format for data URIs, including the 'data:' prefix.
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
}

/**
 * Extracts all Cloud Storage URLs from the test data.
 * @param testData The test data object.
 * @returns An array of storage URLs.
 */
function extractStorageUrls(testData: TestData): string[] {
    const urls: string[] = [];
    
    if (testData.sections) {
        testData.sections.forEach(section => {
            if (!section.parts) return;
            section.parts.forEach((part: any) => {
                if (part.audioUrl && part.audioUrl.includes('firebasestorage.googleapis.com')) {
                    urls.push(part.audioUrl);
                }
                if (!part.questions) return;
                part.questions.forEach((question: any) => {
                    if (!question.options) return;
                    question.options.forEach((option: any) => {
                        if (option.imageUrl && option.imageUrl.includes('firebasestorage.googleapis.com')) {
                            urls.push(option.imageUrl);
                        }
                    });
                });
            });
        });
    }

    return urls;
}

// Custom deep copy function to handle 'undefined' values correctly
function deepCopy(obj: any) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepCopy(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = deepCopy(obj[key]);
        }
    }
    return newObj;
}


/**
 * Saves or updates a test. If an ID is provided, it updates the existing test.
 * Otherwise, it creates a new one. It also handles uploading any new data URIs to Cloud Storage.
 * @param testData The complete test object to be saved.
 * @param id The ID of the test to update (optional).
 * @returns The ID of the saved/updated test.
 */
export async function saveTest(testData: Omit<TestData, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<string> {
    try {
        const testId = id || doc(collection(db, 'tests')).id;
        const processedData = deepCopy(testData);

        // Process all data URIs and upload them to Firebase Storage
        if (processedData.sections && Array.isArray(processedData.sections)) {
            for (const section of processedData.sections) {
                if (!section.parts || !Array.isArray(section.parts)) continue;
                for (const part of section.parts) {
                    // Upload audio if it's a data URI
                    if (part.audioUrl && typeof part.audioUrl === 'string' && part.audioUrl.startsWith('data:')) {
                        const path = `tests/${testId}/${part.id}/audio.wav`;
                        part.audioUrl = await uploadDataUriToStorage(part.audioUrl, path);
                    }

                    if (!part.questions || !Array.isArray(part.questions)) continue;
                    // Upload images in options if they are data URIs
                    for (const question of part.questions) {
                         // Upload image for speaking-qa
                        if (question.imageUrl && typeof question.imageUrl === 'string' && question.imageUrl.startsWith('data:')) {
                            const fileExtension = question.imageUrl.split(';')[0].split('/')[1] || 'png';
                            const path = `tests/${testId}/${part.id}/${question.id}/image.${fileExtension}`;
                            question.imageUrl = await uploadDataUriToStorage(question.imageUrl, path);
                        }
                        
                        if (question.options && Array.isArray(question.options)) {
                            for (const option of question.options) {
                                if (option.imageUrl && typeof option.imageUrl === 'string' && option.imageUrl.startsWith('data:')) {
                                    const fileExtension = option.imageUrl.split(';')[0].split('/')[1] || 'png';
                                    const path = `tests/${testId}/${part.id}/${question.id}/${option.id}.${fileExtension}`;
                                    option.imageUrl = await uploadDataUriToStorage(option.imageUrl, path);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        const docRef = doc(db, 'tests', testId);
        
        if (id) {
            // Update existing document
            const dataToUpdate = {
                ...processedData,
                updatedAt: serverTimestamp(),
            };
            await setDoc(docRef, dataToUpdate, { merge: true });
        } else {
            // Create new document
            const dataToCreate = {
                ...processedData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await setDoc(docRef, dataToCreate);
        }
        
        console.log('Test saved successfully. Firestore ID:', testId);
        return testId;

    } catch (error) {
        console.error("Error saving test:", error);
        throw new Error('Failed to save test to Firebase.');
    }
}


/**
 * Fetches all tests from Firestore.
 * @returns A promise that resolves to an array of test data.
 */
export async function getTests(): Promise<TestData[]> {
    try {
        const querySnapshot = await getDocs(testsCollection);
        const tests = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to ISO strings
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
            } as TestData;
        });
        
        // Sort tests by creation date, newest first
        tests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return tests;
    } catch (error) {
        console.error("Error fetching tests:", error);
        throw new Error("Failed to fetch tests from Firebase.");
    }
}

/**
 * Fetches a single test by its ID from Firestore.
 * @param testId The ID of the test to fetch.
 * @returns A promise that resolves to the test data.
 */
export async function getTestById(testId: string): Promise<TestData | null> {
    try {
        const docRef = doc(db, 'tests', testId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                 // Convert Firestore Timestamps to ISO strings
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
            } as TestData;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching test by ID:", error);
        throw new Error("Failed to fetch test from Firebase.");
    }
}

/**
 * Deletes a test from Firestore and all associated files from Cloud Storage.
 * @param testId The ID of the test to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteTest(testId: string): Promise<void> {
    try {
        // First, get the test data to find all storage URLs
        const testToDelete = await getTestById(testId);
        if (testToDelete) {
            const urlsToDelete = extractStorageUrls(testToDelete);
            
            // Delete all associated files in Cloud Storage
            const deletePromises = urlsToDelete.map(url => {
                try {
                    const fileRef = ref(storage, url);
                    return deleteObject(fileRef);
                } catch (error) {
                    // Log error if a file can't be deleted (e.g., malformed URL), but don't block the process
                    console.error(`Failed to create ref for file at ${url}:`, error);
                    return Promise.resolve(); // Resolve to not break Promise.all
                }
            });
            await Promise.all(deletePromises.map(p => p.catch(e => console.error("A file deletion failed, but proceeding:", e))));
            console.log(`Finished attempting to delete ${urlsToDelete.length} associated files from Cloud Storage.`);
        }

        // Finally, delete the Firestore document
        await deleteDoc(doc(db, 'tests', testId));
        console.log(`Test with ID ${testId} deleted successfully from Firestore.`);

    } catch (error) {
         console.error("Error deleting test:", error);
         throw new Error('Failed to delete test from Firebase.');
    }
}
