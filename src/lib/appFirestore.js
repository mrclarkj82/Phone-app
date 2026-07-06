import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

export const FIRESTORE_APP_ID = "drrs-math";

export function appCollection(collectionName) {
  return collection(db, "apps", FIRESTORE_APP_ID, collectionName);
}

export function appDoc(collectionName, documentId) {
  return doc(db, "apps", FIRESTORE_APP_ID, collectionName, documentId);
}
