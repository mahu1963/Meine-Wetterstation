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
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperatur (°C)",
        data: [],
        borderColor: "#ff3b30",
        backgroundColor: "rgba(255,59,48,0.2)",
        tension: 0.2,
        yAxisID: "y"
      },
      {
        label: "Feuchte (%)",
        data: [],
        borderColor: "#0a84ff",
        backgroundColor: "rgba(10,132,255,0.2)",
        tension: 0.2,
        yAxisID: "y1"
      },
      {
        label: "Druck (hPa)",
        data: [],
        borderColor: "#34c759",
        backgroundColor: "rgba(52,199,89,0.2)",
        tension: 0.2,
        yAxisID: "y2"
      }
    ]
  },
  options: {
    scales: {
      y:  { position: "left",  ticks: { color: "var(--fg)" }},
      y1: { position: "right", ticks: { color: "var(--fg)" }},
      y2: { position: "right", ticks: { color: "var(--fg)" }, grid: { drawOnChartArea: false }}
    }
  }
});

// Buttons
const statsEl = document.getElementById("stats");

document.getElementById("btn-day").addEventListener("click", () => loadRange("day"));
document.getElementById("btn-week").addEventListener("click", () => loadRange("week"));
document.getElementById("btn-month").addEventListener("click", () => loadRange("month"));
document.getElementById("btn-year").addEventListener("click", () => loadRange("year"));

// Dark/Light Mode
const themeBtn = document.getElementById("btn-theme");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeBtn.textContent =
    document.body.classList.contains("light") ? "🌙" : "🌞";
});

// Daten laden
async function loadRange(range) {
  document.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  document.getElementById("btn-" + range).classList.add("active");

  const snap = await db.ref(`/history/${range}`).get();
  if (!snap.exists()) {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => ds.data = []);
    chart.update();
    statsEl.textContent = "Keine Daten vorhanden.";
    return;
  }

  const entries = Object.entries(snap.val())
    .map(([ts, obj]) => ({ ts: Number(ts), ...obj }))
    .sort((a, b) => a.ts - b.ts);

  const labels = entries.map(e =>
    new Date(e.ts * 1000).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })
  );

  chart.data.labels = labels;
  chart.data.datasets[0].data = entries.map(e => e.temp);
  chart.data.datasets[1].data = entries.map(e => e.hum);
  chart.data.datasets[2].data = entries.map(e => e.pres);

  chart.update();

  const temps = entries.map(e => e.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;

  statsEl.textContent =
    `Messungen: ${temps.length} | Min: ${min.toFixed(1)}°C | Max: ${max.toFixed(1)}°C | Mittel: ${avg.toFixed(1)}°C`;
}

// Start mit Woche
loadRange("week");
