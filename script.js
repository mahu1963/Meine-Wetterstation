function updateUI(data, local) {
    document.getElementById("temp").innerText  = data.t.toFixed(1) + " °C";
    document.getElementById("hum").innerText   = data.h.toFixed(1) + " %";
    document.getElementById("press").innerText = data.p.toFixed(1) + " hPa";

    // Anzeige, ob Daten lokal oder GitHub
    const src = local ? "ESP32 (live)" : "GitHub (Backup)";
    document.getElementById("lastUpdate").innerText = "Quelle: " + src;

    draw24hChart(data.hist || []);
    drawWeekChart(data.week || []);
    drawYearChart(data.year || []);
}
