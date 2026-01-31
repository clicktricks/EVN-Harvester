// ==UserScript==
// @name         Bahn.expert EVN Harvester - Mobile Fix
// @version      14.5
// @description  Zuverlässiger Report-Download für PC & Smartphone (Note 13).
// @author       DeinName
// @match        https://bahn.expert/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:130px;height:80px;font-size:1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || 
                          document.title.replace('Abfahrten ', '').split(' - ')[0];
        
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const train = container.innerText.split('\n')[0] || "Zug";
// ==UserScript==
// @name         Bahn.expert EVN Harvester - Final 16.9
// @version      16.9
// @description  Garantiert Endziele statt Zwischenhalte oder Liniennummern.
// @author       DeinName
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:130px;height:80px;font-size:1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || "Freiburg Hbf";
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const trainName = container.querySelector('span[class*="train"]')?.innerText || container.innerText.split('\n')[0];
            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // --- GLEIS FINDEN ---
            let track = lines.find(l => l.startsWith("Gleis") || l.startsWith("Pl."))?.replace("Gleis ", "") || 
                        lines.find(l => /^\d{1,2}$/.test(l)) || "";

            // --- FAHRTNUMMERN (Rot, 3-5 Stellen) ---
            let foundNumbers = lines.filter(l => 
                /\d{3,}/.test(l) && !/\d{2}:\d{2}/.test(l) && l !== trainName &&
                !l.includes("Einstiegshilfe") && !l.includes("Gleis") && !l.toLowerCase().includes("linie")
            );
            const trainNumberHtml = [...new Set(foundNumbers)].join("<br>");

            // --- ENDZIEL-LOGIK (Vollständig neu) ---
            let destinationHtml = "";
            let destElements = Array.from(container.querySelectorAll('[class*="destination"]'));
            
            if (destElements.length > 0) {
                // Bei Flügelzügen nehmen wir alle markierten Ziele
                destinationHtml = destElements
                    .map(el => el.innerText)
                    .filter(txt => txt.length > 2 && !txt.toLowerCase().includes("linie") && !txt.includes("Einstiegshilfe"))
                    .join("<br>");
            } else {
                // FALLBACK: Wir nehmen die Zeile, die am wahrscheinlichsten das Ziel ist 
                // (Meistens die Zeile VOR der Uhrzeit oder am Ende des ersten Blocks)
                let potentialDests = lines.filter(l => 
                    l.length > 3 && 
                    !/\d{2}:\d{2}/.test(l) && 
                    !foundNumbers.includes(l) && 
                    l !== trainName && 
                    !l.includes("Gleis") && 
                    !l.toLowerCase().includes("linie") &&
                    !l.includes("Einstiegshilfe")
                );
                // Wir nehmen das LETZTE Element der Liste, da das Ziel bei bahn.expert meist unten steht
                destinationHtml = potentialDests.length > 0 ? potentialDests[potentialDests.length - 1] : "Ziel";
            }

            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;
            container.scrollIntoView({ block: "center" });
            container.click();

            const isLong = trainName.includes("ICE") || trainName.includes("IC") || trainName.includes("NJ");
            await new Promise(r => setTimeout(r, isLong ? 2800 : 1400));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            reportData.push({ time, train: trainName, nr: trainNumberHtml, dest: destinationHtml, evns: [...new Set(matches)], track: track });

            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

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
            .track-box { background: #003366; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; float: right; margin-left: 10px; }
        </style></head><body>
        <div class="header">🚉 BAHN REPORT: ${station} | ${dateObj.toLocaleString('de-DE')}</div>
        <table><thead><tr><th>Zeit</th><th>Zug & Nummer</th><th>Endziel (Alle Teile)</th><th>EVNs & Gleis</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            const trackHtml = item.track ? `<span class="track-box">Gl. ${item.track}</span>` : "";
            html += `<tr>
                <td><b>${item.time}</b></td>
                <td><div class="train-box">${item.train}</div><div class="train-nr">${item.nr}</div></td>
                <td class="dest">${item.dest}</td>
                <td>${trackHtml} ${evns || "---"}</td>
            </tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVN_Report_${station.replace(/\s/g, '_')}.html`;
        a.click();
    }
})();; text-align: left; }
            th { background: #f2f2f2; color: #003366; }
            .evn { background: #eeeeee; color: black; border: 1px solid #ccc; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-weight: bold; display: inline-block; margin: 1px; }
        </style></head><body>
        <div class="header">Bahnhof: ${station}<br>Datum: ${d} | Zeit: ${t}</div>
        <table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th>EVNs</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr><td><b>${item.time}</b></td><td>${item.train}</td><td>${item.dest}</td><td>${evns || "---"}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;

        // Die Lösung für Mobile: Blob & Download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EVN_Report_${station.replace(/\s/g, '_')}.html`;
        document.body.appendChild(a);
        a.click(); // Startet den Download oder das Öffnen
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }
})();
