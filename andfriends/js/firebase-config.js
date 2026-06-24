
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdjLSIIBZkInBm2Xc2cVpf47olh6G4WhQ",
  authDomain: "andfriends-c5552.firebaseapp.com",
  projectId: "andfriends-c5552",
  storageBucket: "andfriends-c5552.firebasestorage.app",
  messagingSenderId: "518106146797",
  appId: "1:518106146797:web:51aa340e1840e54c7de9e4",
  measurementId: "G-0C0YYTYW2S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Optional Analytics
if (firebase.analytics) {
  firebase.analytics();
}