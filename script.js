// -----------------------------------------
// Diagramm-Variablen
// -----------------------------------------
let tempChart = null;


// -----------------------------------------
// Diagramm initialisieren
// -----------------------------------------
function initChart() {
    const canvas = document.getElementById("tempChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    tempChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Temperatur (°C)",
                data: [],
                borderColor: "#4fc3f7",
                backgroundColor: "rgba(79, 195, 247, 0.2)",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#666" }},
                y: { ticks: { color: "#666" }}
            }
        }
    });
}


// -----------------------------------------
// Diagramm aktualisieren
// -----------------------------------------
function updateChart(temp) {
    if (!tempChart) return;

    const now = new Date().toLocaleTimeString();

    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push(temp);

    if (tempChart.data.labels.length > 20) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
    }

    tempChart.update();
}


// -----------------------------------------
// Daten laden
// -----------------------------------------
async function loadData() {
    try {
        const response = await fetch("data.json?cachebuster=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Fehler beim Laden");

        const data = await response.json();

        document.getElementById("temp").textContent = data.temperature + " °C";
        document.getElementById("humidity").textContent = data.humidity + " %";
        document.getElementById("pressure").textContent = data.pressure + " hPa";

        updateChart(data.temperature);

        const now = new Date();
        document.getElementById("lastUpdate").textContent =
            "Zuletzt aktualisiert: " +
            now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    } catch (err) {
        console.error(err);
        document.getElementById("lastUpdate").textContent = "Fehler beim Laden der Daten";
    }
}


// -----------------------------------------
// Dark Mode
// -----------------------------------------
function updateChartColors() {
    if (!tempChart) return;

    const isDark = document.body.classList.contains("dark");

    tempChart.options.scales.x.ticks.color = isDark ? "#ccc" : "#666";
    tempChart.options.scales.y.ticks.color = isDark ? "#ccc" : "#666";

    tempChart.update();
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add("dark");
        darkToggle.checked = true;
    } else {
        document.body.classList.remove("dark");
        darkToggle.checked = false;
    }

    localStorage.setItem("darkmode", isDark ? "1" : "0");
    updateChartColors();
}

const darkToggle = document.getElementById("darkToggle");

darkToggle.addEventListener("change", () => {
    applyDarkMode(darkToggle.checked);
});


// -----------------------------------------
// Start erst, wenn DOM vollständig geladen ist
// -----------------------------------------
window.addEventListener("DOMContentLoaded", () => {

    // Dark Mode laden
    const saved = localStorage.getItem("darkmode");

    if (saved === "1") {
        applyDarkMode(true);
    } else if (saved === "0") {
        applyDarkMode(false);
    } else {
        applyDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    // Diagramm starten
    initChart();
    updateChartColors();

    // Daten laden
    loadData();
    setInterval(loadData, 5000);
});
