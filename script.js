// -----------------------------------------
// Diagramm-Variablen
// -----------------------------------------
let tempChart = null;
let humidityChart = null;
let pressureChart = null;


// -----------------------------------------
// Universelle Chart-Erstellung
// -----------------------------------------
function createLineChart(ctx, label) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
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
// Alle Diagramme initialisieren
// -----------------------------------------
function initAllCharts() {
    tempChart = createLineChart(
        document.getElementById("tempChart").getContext("2d"),
        "Temperatur (°C)"
    );

    humidityChart = createLineChart(
        document.getElementById("humidityChart").getContext("2d"),
        "Luftfeuchtigkeit (%)"
    );

    pressureChart = createLineChart(
        document.getElementById("pressureChart").getContext("2d"),
        "Luftdruck (hPa)"
    );
}


// -----------------------------------------
// Daten in Diagramm pushen
// -----------------------------------------
function pushChartData(chart, value) {
    const now = new Date().toLocaleTimeString();

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(value);

    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
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

        pushChartData(tempChart, data.temperature);
        pushChartData(humidityChart, data.humidity);
        pushChartData(pressureChart, data.pressure);

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
    const isDark = document.body.classList.contains("dark");
    const charts = [tempChart, humidityChart, pressureChart];

    charts.forEach(chart => {
        if (!chart) return;

        chart.options.scales.x.ticks.color = isDark ? "#ccc" : "#666";
        chart.options.scales.y.ticks.color = isDark ? "#ccc" : "#666";

        chart.update();
    });
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


// -----------------------------------------
// Start erst, wenn DOM vollständig geladen ist
// -----------------------------------------
window.addEventListener("DOMContentLoaded", () => {

    const darkToggle = document.getElementById("darkToggle");

    darkToggle.addEventListener("change", () => {
        applyDarkMode(darkToggle.checked);
    });

    // Dark Mode laden
    const saved = localStorage.getItem("darkmode");

    if (saved === "1") {
        applyDarkMode(true);
    } else if (saved === "0") {
        applyDarkMode(false);
    } else {
        applyDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    // Diagramme starten
    initAllCharts();
    updateChartColors();

    // Daten laden
    loadData();
    setInterval(loadData, 5000);
});
