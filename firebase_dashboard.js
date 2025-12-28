// ---------- FIREBASE CONFIG ----------
firebase.initializeApp({
  apiKey: "AIzaSyBK72ROuOs4fDc5p5CFaHSWwW8oQZwEL-g",
  authDomain: "ecosafar-b8e9b.firebaseapp.com",
  databaseURL: "https://ecosafar-b8e9b-default-rtdb.firebaseio.com",
  projectId: "ecosafar-b8e9b"
});

const db = firebase.database();

// ---------- GET UID FROM URL ----------
const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if(!uid){
  alert("UID missing. Please login again.");
  window.location.href = "UserLogin.html";
}

// ---------- ELEMENTS ----------
const userNameEl = document.getElementById("userName");
const userUIDEl = document.getElementById("userUID");
const pointsEl = document.getElementById("points");
const weightEl = document.getElementById("weight");
const moneyEl = document.getElementById("money");
const historyDiv = document.getElementById("historyList");

// ---------- LOAD USER DATA ----------
db.ref("users/" + uid).on("value", snap => {

  if(!snap.exists()){
    alert("User not found");
    return;
  }

  const d = snap.val();

  userUIDEl.innerText = uid;
  userNameEl.innerText = d.name || "User";
  pointsEl.innerText = d.Ecopoints || 0;
  weightEl.innerText = d.TotalWeight || 0;

  const money = ((d.TotalWeight || 0) / 100) * 10;
  moneyEl.innerText = money.toFixed(2);
});

// ---------- LOAD HISTORY ----------
db.ref("history/" + uid).on("value", snap => {

  const h = snap.val();

  if(!h){
    historyDiv.innerHTML = "<div class='empty'>No transactions yet</div>";
    return;
  }

  let rows = "";
  let i = 1;

  Object.values(h).reverse().forEach(e => {
    rows += `
      <tr>
        <td>${i++}</td>
        <td>${e.weight}</td>
        <td>+${e.points}</td>
      </tr>
    `;
  });

  historyDiv.innerHTML = `
    <table>
      <tr>
        <th>#</th>
        <th>Waste (g)</th>
        <th>EcoPoints</th>
      </tr>
      ${rows}
    </table>
  `;
});