// firebase/config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// substitua pelos seus valores (já presentes no seu arquivo atual)
const firebaseConfig = {
  apiKey: "AIzaSyAddCDASDFnZJK80MrTFscuYc17EyZ1Z3Y",
  authDomain: "patrimonygo-9c977.firebaseapp.com",
  projectId: "patrimonygo-9c977",
  storageBucket: "patrimonygo-9c977.appspot.com", // verifique e corrija para *.appspot.com se necessário
  messagingSenderId: "314603793335",
  appId: "1:314603793335:web:a34c56a18985c2c98c9632",
  measurementId: "G-RJMVEW9F5P"
};

const app = initializeApp(firebaseConfig);

// NÃO chamamos getAuth() nem getAnalytics() aqui para evitar problemas no Expo Go
export const firebaseApp = app;
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// função utilitária (lazy) caso futuramente queira auth sem erro de inicialização top-level
export function getAuthIfNeeded() {
  try {
    // require dinâmico evita erro de import no bundle do Expo
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth } = require("firebase/auth");
    return getAuth(firebaseApp);
  } catch (e) {
    // auth não disponível no ambiente atual (Expo Go), retorna null como fallback
    return null;
  }
}
