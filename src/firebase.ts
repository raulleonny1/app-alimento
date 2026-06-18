import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNkIw6Qmw-gPpsFUF4GG7d9NAdU5huQHA',
  authDomain: 'app-alimentos-dd98e.firebaseapp.com',
  projectId: 'app-alimentos-dd98e',
  storageBucket: 'app-alimentos-dd98e.firebasestorage.app',
  messagingSenderId: '735861820546',
  appId: '1:735861820546:web:ee92bdd33983f911e4389b',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
