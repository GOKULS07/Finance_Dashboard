
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDgTk9Bw12HsVWK7VPqFX662doj3gxl368",
  authDomain: "financely-1d91d.firebaseapp.com",
  projectId: "financely-1d91d",
  storageBucket: "financely-1d91d.appspot.com",
  messagingSenderId: "375010495111",
  appId: "1:375010495111:web:502ca2554e3d8bd8f08622",
  measurementId: "G-19ZXWFKWQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app); 
export { db, auth, provider, doc, setDoc };