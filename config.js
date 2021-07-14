import firebase from 'firebase';
require('@firebase/firestore');

var firebaseConfig = {
  apiKey: "AIzaSyCg69N5-e4LW_ObVLKDhelizSyqJpNClQk",
  authDomain: "wily-8b487.firebaseapp.com",
  projectId: "wily-8b487",
  storageBucket: "wily-8b487.appspot.com",
  messagingSenderId: "237181899005",
  appId: "1:237181899005:web:575129665d95bc7effae94"
};


firebase.initializeApp(firebaseConfig);

export default firebase.firestore();