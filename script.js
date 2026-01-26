async function loadData() {
    try {
        const response = await fetch("data.json?cachebuster=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Fehler beim Laden der Daten");
        }

        const data = await response.json();

        // Werte aus JSON übernehmen
        document.getElementById("temp").textContent = data.temperature + " °C";
        document.getElementById("humidity").textContent = data.humidity + " %";
        document.getElementById("pressure").textContent = data.pressure + " hPa";

        // Zeitstempel anzeigen
        const now = new Date();
        document.getElementById("lastUpdate").textContent =
            "Zuletzt aktualisiert: " +
            now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        document.getElementById("lastUpdate").textContent = "Fehler beim Laden der Daten";
    }
}

// Sofort beim Start laden
loadData();

// Alle 5 Sekunden neu laden
setInterval(loadData, 5000);
