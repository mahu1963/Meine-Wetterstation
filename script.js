const LOCAL_URL  = "http://esp32.local/data.json";
const GITHUB_URL = "https://mahu1963.github.io/Meine-Wetterstation/data.json";

async function loadData() {
    // 1) Versuch: Lokaler ESP32
    try {
        const res = await fetch(LOCAL_URL, { cache: "no-cache" });
        const data = await res.json();
        updateUI(data, true);
        return;
    } catch(e) {
        console.warn("ESP32 lokal nicht erreichbar, nutze GitHub");
    }

    // 2) Fallback: GitHub
    try {
        const res = await fetch(GITHUB_URL, { cache: "no-cache" });
        const data = await res.json();
        updateUI(data, false);
    } catch(e) {
        console.error("Fehler beim Laden:", e);
    }
}
