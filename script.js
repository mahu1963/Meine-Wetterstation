// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAfIU041dyNBiCC_ywpJiwf8mABJVsT-lw",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "593494014586",
  appId: "1:593494014586:web:c704ffa5baa9ae5a6059c3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Chart vorbereiten
const ctx = document.getElementById("chart").getContext("2d");
let chart = new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets: [{
    label: "Temperatur (°C)",
    data: [],
    borderColor: "#0a84ff",
    backgroundColor: "rgba(10,132,255,0.2)",
    tension: 0.2,
    pointRadius: 2
  }]},
  options: {
    scales: {
      x: { ticks: { color: "#ccc" }},
      y: { ticks: { color: "#ccc" }}
    }
  }
});

// Buttons
const btnWeek  = document.getElementById("btn-week");
const btnMonth = document.getElementById("btn-month");
const btnYear  = document.getElementById("btn-year");
const statsEl  = document.getElementById("stats");

// Daten laden
async function loadRange(range) {
  btnWeek.classList.toggle("active", range === "week");
  btnMonth.classList.toggle("active", range === "month");
  btnYear.classList.toggle("active", range === "year");

  const snap = await db.ref(`/history/${range}`).get();
  if (!snap.exists()) {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
    statsEl.textContent = "Keine Daten vorhanden.";
    return;
  }

  const entries = Object.entries(snap.val())
    .map(([ts, t]) => ({ ts: Number(ts), t }))
    .sort((a, b) => a.ts - b.ts);

  const labels = entries.map(e =>
    new Date(e.ts * 1000).toLocaleDateString("de-AT")
  );
  const temps = entries.map(e => e.t);

  chart.data.labels = labels;
  chart.data.datasets[0].data = temps;
  chart.update();

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;

  statsEl.textContent =
    `Messungen: ${temps.length} | Min: ${min.toFixed(1)}°C | Max: ${max.toFixed(1)}°C | Mittel: ${avg.toFixed(1)}°C`;
}

// Button Events
btnWeek.addEventListener("click", () => loadRange("week"));
btnMonth.addEventListener("click", () => loadRange("month"));
btnYear.addEventListener("click", () => loadRange("year"));

// Start
loadRange("week");
