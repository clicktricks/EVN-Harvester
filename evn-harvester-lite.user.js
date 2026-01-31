// ==UserScript==
// @name         Bahn.expert EVN Harvester - 16.7.Final-FIX
// @version      16.7.FF
// @description  Stabile Ziele (wie in Report_Report.html) + Korrekter Bahnhofsname.
// @author       NiNi77
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
        // --- BAHNHOFSNAME ---
        let stationName = document.title.split('|')[0].split('–')[0].trim();
        if (!stationName || stationName === "bahn.expert") {
            stationName = document.querySelector('h1')?.innerText.split('\n')[0].trim() || "Bahnhof";
        }

        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            
            document.title = `(${i + 1}/${containers.length}) ${stationName}`;
            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;

            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const trainName = container.querySelector('span[class*="train"]')?.innerText || container.innerText.split('\n')[0];
            const lines = container.innerText.split('\n').map(l => l.trim());

            // --- GLEIS ---
            let track = lines.find(l => l.startsWith("Gleis") || l.startsWith("Pl."))?.replace("Gleis ", "") ||
                        lines.find(l => /^\d{1,2}$/.test(l)) || "";

            // --- FAHRTNUMMERN ---
            let foundNumbers = lines.filter(l =>
                /\d{3,}/.test(l) && !/\d{2}:\d{2}/.test(l) && l !== trainName && !l.includes("Einstiegshilfe")
            );
            const trainNumberHtml = [...new Set(foundNumbers)].join("<br>");

            // --- ZIEL-LOGIK FIX (Zurück zu Report_Report.html Standard) ---
            let destinationHtml = "";
            let destElements = Array.from(container.querySelectorAll('[class*="destination"]'));
            
            if (destElements.length > 0) {
                // Nimmt alle gefundenen Ziel-Elemente, filtert nur ganz kurzen Müll raus
                destinationHtml = destElements.map(el => el.innerText).filter(txt => txt.length > 2).join("<br>");
            } else {
                // Notlösung: Letzte Zeile, die keine Zeit/Nummer ist
                let pot = lines.filter(l => l.length > 3 && !/\d{2}:\d{2}/.test(l) && !foundNumbers.includes(l) && l !== trainName);
                destinationHtml = pot.length > 0 ? pot[pot.length - 1] : "Ziel";
            }

            container.scrollIntoView({ block: "center" });
            container.click();

            const isLong = trainName.includes("ICE") || trainName.includes("IC");
            await new Promise(r => setTimeout(r, isLong ? 2800 : 1400));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            reportData.push({ time, train: trainName, nr: trainNumberHtml, dest: destinationHtml, evns: [...new Set(matches)], track: track });

            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

        document.title = originalTitle;
        btn.disabled = false;
        btn.innerHTML = "🚀<br>SCAN STARTEN";
        
        exportHTML(stationName, startTime, reportData);
    };

    function exportHTML(station, dateObj, data) {
        const safeName = station.replace(/[^a-z0-9]/gi, '_');
        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            .header { background: #003366; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; vertical-align: top; }
            th { background: #f2f2f2; color: #003366; }
            .train-nr { color: #d32f2f; font-size: 0.9em; font-weight: bold; }
            .evn { background: #eeeeee; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-weight: bold; display: inline-block; margin: 1px; border: 1px solid #ccc; }
            .track-box { background: #003366; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; float: right; }
        </style></head><body>
        <div class="header"><h1>🚉 REPORT: ${station}</h1><p>${dateObj.toLocaleString('de-DE')}</p></div>
        <table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th>EVNs & Gleis</th></tr></thead><tbody>`;

        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            const trackHtml = item.track ? `<span class="track-box">Gl. ${item.track}</span>` : "";
            html += `<tr><td><b>${item.time}</b></td><td><b>${item.train}</b><br><div class="train-nr">${item.nr}</div></td><td><b>${item.dest}</b></td><td>${trackHtml} ${evns}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVN_Report_${safeName}.html`;
        a.click();
    }
})();
