import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "buttoncounter-57005.firebaseapp.com",
  projectId: "buttoncounter-57005",
  storageBucket: "buttoncounter-57005.firebasestorage.app",
  messagingSenderId: "881518959277",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };