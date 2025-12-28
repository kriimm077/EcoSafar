// firebase_dashboard.js

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyBK72ROuOs4fDc5p5CFaHSWwW8oQZwEL-g",
  authDomain: "ecosafar-b8e9b.firebaseapp.com",
  databaseURL: "https://ecosafar-b8e9b-default-rtdb.firebaseio.com/",
  projectId: "ecosafar-b8e9b",
  storageBucket: "ecosafar-b8e9b.appspot.com",
  messagingSenderId: "972209472560",
  appId: "1:972209472560:web:39fcc096311b3006c6d9f5"
};

// ---------- INITIALIZE FIREBASE ----------
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---------- GET DASHBOARD ELEMENTS ----------
const userNameEl = document.getElementById("userName");
const userUIDEl = document.getElementById("userUID");
const pointsEl = document.getElementById("points");
const weightEl = document.getElementById("weight");
const moneyEl = document.getElementById("money");
const historyDiv = document.getElementById("historyList");

// ---------- TRACK CURRENT LISTENERS ----------
let currentUserRef = null;
let historyRef = null;

// ---------- LISTEN FOR LAST SCANNED UID ----------
db.ref("lastActiveUID").on("value", snap => {
  const uid = snap.val();
  if(uid) loadUserData(uid);
  else resetDashboard();
});

// ---------- FUNCTION TO LOAD USER DATA ----------
function loadUserData(uid){
  // Detach previous listeners if exist
  if(currentUserRef) currentUserRef.off();
  if(historyRef) historyRef.off();

  // Set new references
  currentUserRef = db.ref("users/" + uid);
  historyRef = db.ref("history/" + uid);

  // Listen to user data
  currentUserRef.on("value", snap => {
    if(!snap.exists()){
      resetDashboard();
      return;
    }

    const d = snap.val();
    userUIDEl.innerText = uid;
    userNameEl.innerText = d.name || "User";
    weightEl.innerText = d.totalWeight || 0;
    pointsEl.innerText = d.points || 0;
    moneyEl.innerText = ((d.totalWeight || 0) / 100 * 10).toFixed(2);
  });

  // Listen to user transaction history
  historyRef.on("value", snap => {
    const h = snap.val() || {};
    const entries = Object.values(h).reverse();

    if(entries.length === 0){
      historyDiv.innerHTML = "<div class='empty'>No transactions yet</div>";
      return;
    }

    let html = `<table>
      <tr><th>#</th><th>Waste (g)</th><th>EcoPoints</th></tr>`;

    entries.forEach((e, i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td>${e.weight}</td>
        <td>+${e.points}</td>
      </tr>`;
    });

    html += "</table>";
    historyDiv.innerHTML = html;
  });
}

// ---------- FUNCTION TO RESET DASHBOARD ----------
function resetDashboard(){
  userUIDEl.innerText = "----";
  userNameEl.innerText = "---";
  weightEl.innerText = 0;
  pointsEl.innerText = 0;
  moneyEl.innerText = 0;
  historyDiv.innerHTML = "<div class='empty'>Waiting for ESP32 data…</div>";
}
