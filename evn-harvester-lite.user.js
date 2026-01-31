// ==UserScript==
// @name         Bahn.expert EVN Harvester - LITE 17.7
// @version      17.7
// @description  Lite-Version mit Tab-Progress und verbesserter ICE-Erkennung.
// @author       NiNI77
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const originalTitle = document.title;
    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:130px;height:80px;font-size:1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || "Bahnhof";
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            document.title = `(${i+1}/${containers.length}) ${stationName}`;
            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;

            const trainName = container.querySelector('span[class*="train"]')?.innerText || "Zug";
            const isLong = trainName.includes("ICE") || trainName.includes("IC") || trainName.includes("EC") || trainName.includes("NJ");

            container.scrollIntoView({ block: "center", behavior: "smooth" });
            container.click();

            // PRO-WARTEZEIT: ICEs brauchen Zeit zum Laden der vielen Wagen
            await new Promise(r => setTimeout(r, isLong ? 3500 : 1500));

            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let track = lines.find(l => l.startsWith("Gleis") || l.startsWith("Pl."))?.replace("Gleis ", "") || lines.find(l => /^\d{1,2}$/.test(l)) || "";
            let fahrtNrs = lines.filter(l => /\d{3,}/.test(l) && !l.includes(":") && l !== trainName && !l.includes("Gleis") && !l.toLowerCase().includes("linie"));
            
            let dests = Array.from(container.querySelectorAll('[class*="destination"]')).map(el => el.innerText);
            let destination = dests.length > 0 ? dests.filter(t => t.length > 2 && !t.includes("Einstieg")).join("<br>") : "Ziel";

            let evnMatches = [...new Set(container.innerHTML.match(/\d{4}\s\d{3}/g) || [])];
            reportData.push({ time, train: trainName, nr: fahrtNrs.join("<br>"), dest: destination, evns: evnMatches, track: track });

            container.click();
            await new Promise(r => setTimeout(r, 300));
        }

        document.title = "✅ FERTIG!";
        setTimeout(() => { document.title = originalTitle; }, 4000);
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "🚀<br>SCAN STARTEN";
        exportHTML(stationName, startTime, reportData);
    };

    function exportHTML(station, dateObj, data) {
        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            .header { background: #003366; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; vertical-align: top; }
            th { background: #f2f2f2; color: #003366; }
            .train-box { font-weight: bold; font-size: 1.1em; }
            .train-nr { color: #d32f2f; font-size: 0.9em; font-weight: bold; }
            .dest { font-weight: bold; color: #003366; }
            .evn { background: #eeeeee; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-weight: bold; display: inline-block; margin: 1px; border: 1px solid #ccc; }
            .track-box { background: #003366; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; float: right; }
        </style></head><body>
        <div class="header">🚉 BAHN REPORT: ${station} | ${dateObj.toLocaleString('de-DE')}</div>
        <table><thead><tr><th>Zeit</th><th>Zug & Nummer</th><th>Zielort</th><th>EVNs & Gleis</th></tr></thead><tbody>`;
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr><td><b>${item.time}</b></td><td><div class="train-box">${item.train}</div><div class="train-nr">${item.nr}</div></td><td class="dest">${item.dest}</td><td><span class="track-box">Gl. ${item.track}</span>${evns || "---"}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Report_${station}.html`; a.click();
    }
})();
