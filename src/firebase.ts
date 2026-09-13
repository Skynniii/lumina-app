import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAfQoiYOHUQBDldx2DWAC_aF_Ctc2IgLhc',
  authDomain: 'aplicacion-ff63f.firebaseapp.com',
  projectId: 'aplicacion-ff63f',
  storageBucket: 'aplicacion-ff63f.firebasestorage.app',
  messagingSenderId: '664146917749',
  appId: '1:664146917749:web:f070a8c231d912922d3b3c',
  measurementId: 'G-PT0RJQY907',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Persistencia offline nativa de Firestore: los cambios se reflejan al instante
// y se sincronizan con la nube al recuperar la señal.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: múltiples pestañas abiertas.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: no soportado por el navegador.');
  }
});
