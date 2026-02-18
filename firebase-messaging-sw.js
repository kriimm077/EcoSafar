importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

// IMPORTANT: copy same config from firebase-config.js
firebase.initializeApp({
  apiKey: "AIzaSyBK72ROuOs4fDc5p5CFaHSWwW8oQZwEL-g",
  authDomain: "ecosafar-b8e9b.firebaseapp.com",
  databaseURL: "https://ecosafar-b8e9b-default-rtdb.firebaseio.com",
  projectId: "ecosafar-b8e9b",
  storageBucket: "ecosafar-b8e9b.firebasestorage.app",
  messagingSenderId: "277553134320",
  appId: "1:277553134320:web:efd3d87dab7d925825a035",
  measurementId: "G-FYJBPTWZCT"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  return self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "logo.png"
  });
});
