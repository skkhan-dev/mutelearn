import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBXL2YREgRpeF2jR47DkgDPhFyTtla8_iw',
  authDomain: 'my-project-mutelearn.firebaseapp.com',
  projectId: 'my-project-mutelearn',
  storageBucket: 'my-project-mutelearn.firebasestorage.app',
  messagingSenderId: '533856761368',
  appId: '1:533856761368:web:5fdc322d8416f6514d356d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
