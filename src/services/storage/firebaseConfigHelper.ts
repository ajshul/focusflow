/**
 * Helper functions for managing Firebase configuration in localStorage
 */

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}


const defaultConfig: FirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
};

const STORAGE_KEY = "lifeflow_firebase_config";

/**
 * Get the stored Firebase configuration or the default one
 */
export const getFirebaseConfig = (): FirebaseConfig => {
  try {
    const storedConfig = localStorage.getItem(STORAGE_KEY);
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
  } catch (error) {
    console.error("Error getting Firebase config from localStorage:", error);
  }

  return defaultConfig;
};

/**
 * Save Firebase configuration to localStorage
 */
export const saveFirebaseConfig = (config: FirebaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving Firebase config to localStorage:", error);
  }
};

/**
 * Reset Firebase configuration to default
 */
export const resetFirebaseConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting Firebase config in localStorage:", error);
  }
};

/**
 * Check if the Firebase configuration is valid
 */
export const isValidFirebaseConfig = (config: FirebaseConfig): boolean => {
  return !!(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  );
};
