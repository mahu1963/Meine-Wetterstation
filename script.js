// -----------------------------------------
// Diagramm-Variablen
// -----------------------------------------
let tempChart = null;


// -----------------------------------------
// Diagramm initialisieren (erst wenn DOM fertig)
// -----------------------------------------
function initChart() {
    const canvas = document.getElementById("tempChart");

    // Falls Canvas nicht existiert → abbrechen
    if (!canvas) {
        console.error("Canvas für Diagramm nicht gefunden!");
        return;
    }

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

    console.log("Diagramm initialisiert");
}


// -----------------------------------------
// Diagramm aktualisieren
// -----------------------------------------
function updateChart(temp) {
    if (!tempChart) {
        console.warn("Diagramm noch nicht bereit");
        return;
    }

    const now = new Date().toLocaleTimeString();

    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push(temp);

    // Nur die letzten 20 Werte behalten
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

        if (!response.ok) {
            throw new Error("Fehler beim Laden der Daten");
        }

        const data = await response.json();

        // Werte anzeigen
        document.getElementById("temp").textContent = data.temperature + " °C";
        document.getElementById("humidity").textContent = data.humidity + " %";
        document.getElementById("pressure").textContent = data.pressure + " hPa";

        // Diagramm aktualisieren
        updateChart(data.temperature);

        // Zeit anzeigen
        const now = new Date();
        document.getElementById("lastUpdate").textContent =
            "Zuletzt aktualisiert: " +
            now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        document.getElementById("lastUpdate").textContent = "Fehler beim Laden der Daten";
    }
}


// -----------------------------------------
// Start erst, wenn DOM vollständig geladen ist
// -----------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM geladen → starte App");

    initChart();      // Diagramm initialisieren
    loadData();       // Daten sofort laden
    setInterval(loadData, 5000); // Alle 5 Sekunden aktualisieren
});
