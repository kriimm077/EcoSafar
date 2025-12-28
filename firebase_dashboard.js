// firebase_dashboard.js

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyBK72ROuOs4fDc5p5CFaHSWwW8oQZwEL-g",
  authDomain: "ecosafar-b8e9b.firebaseapp.com",
  databaseURL: "https://ecosafar-b8e9b-default-rtdb.firebaseio.com/",
  projectId: "ecosafar-b8e9b",
  storageBucket: "ecosafar-b8e9b.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefg"
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

// ---------- LISTEN FOR LAST SCANNED UID ----------
db.ref("lastActiveUID").on("value", snap => {
  const uid = snap.val();
  
  if(uid){
    userUIDEl.innerText = uid;
    loadUserData(uid);
  } else {
    resetDashboard();
  }
});

// ---------- FUNCTION TO LOAD USER DATA ----------
function loadUserData(uid){
  db.ref("users/" + uid).on("value", snap => {
    if(!snap.exists()){
      resetDashboard();
      return;
    }

    const data = snap.val();
    userNameEl.innerText = data.name || "User";
    weightEl.innerText = data.TotalWeight || 0;
    pointsEl.innerText = data.Ecopoints || 0;
    moneyEl.innerText = ((data.TotalWeight || 0)/100*10).toFixed(2);

    const history = data.history || {};
    const entries = Object.values(history).reverse();

    if(entries.length === 0){
      historyDiv.innerHTML = "<div class='empty'>No transactions yet</div>";
      return;
    }

    let html = `<table>
      <tr>
        <th>#</th>
        <th>Waste (g)</th>
        <th>EcoPoints</th>
      </tr>`;

    entries.forEach((e, i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td>${e.weight}</td>
        <td>+${e.ecoPoints}</td>
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
