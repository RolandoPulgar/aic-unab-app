import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCYIpGf-ADpICPeIN5Vcvagt1GNJJY4N2Q",
    authDomain: "aic-unab.firebaseapp.com",
    projectId: "aic-unab",
    storageBucket: "aic-unab.firebasestorage.app",
    messagingSenderId: "311729114579",
    appId: "1:311729114579:web:4faf50749d015924d1b326",
    measurementId: "G-RJ64F2S0WG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'aic_unab_portal_v1';
