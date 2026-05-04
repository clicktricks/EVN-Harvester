// ==UserScript==
// @name         evn_harvester.user.js
// @version      1.6
// @description  Scan-Overlay + Zentrales Popup + Button Reset
// @author       clicktricks
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.id = 'evn-scan-btn';
    btn.innerHTML = "<span style='font-size:22px;'>🔍</span><br>SCAN";
    btn.style = `position:fixed;top:15px;right:75px;z-index:99999;width:55px;height:55px;
                 border:3px solid #3d2273;border-radius:10px;font-weight:bold;color:white;
                 cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.8);display:flex;
                 flex-direction:column;justify-content:center;align-items:center;
                 text-align:center;background:#1976d2;font-family:sans-serif;font-size:15px;`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.title.split('|')[0].split('–')[0].trim();
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;

        // --- Overlay erstellen ---
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.95); z-index: 99998;
            display: flex; flex-direction: column; justify-content: flex-start;
            padding-top: 32px; align-items: center;
            color: #a5b7c9; font-family: sans-serif; font-size: 24px;
            pointer-events: none;
        `;
        overlay.innerHTML = "Scan läuft ⟶";
        document.body.appendChild(overlay);

        let reportData = [];
        const startTime = new Date();

        // --- Scan-Schleife ---
        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;

            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const time = lines.find(l => /\d{2}:\d{2}/.test(l)) || "--:--";
            const trainFull = container.querySelector('span[class*="train"]')?.innerText || lines[0];

            let trainNrMatch = lines.find(l => /^[A-Z]?\s?\d{4,5}$/.test(l) || (l.includes(' ') && /\d+/.test(l) && l.length < 12 && l !== trainFull));
            let displayNr = trainNrMatch || "";
            let detailLink = container.querySelector('a[href*="/details/"]')?.href || "";

            let destination = "";
            let destElements = Array.from(container.querySelectorAll('[class*="destination"]'));
            if (destElements.length > 0) {
                destination = destElements[destElements.length - 1].innerText;
            } else {
                let pot = lines.filter(l => l.length > 3 && !/\d{2}:\d{2}/.test(l) && l !== trainFull);
                destination = pot.length > 0 ? pot[pot.length - 1] : "Ziel";
            }

            container.scrollIntoView({ block: "center" });
            container.click();
            await new Promise(r => setTimeout(r, 1400));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            let track = lines.find(l => l.toLowerCase().includes("gleis") || /^\d+$/.test(l))?.replace(/Gleis /gi, "") || "";

            // Echte TZ: steht als <span>ICE9480</span> neben dem WRSheets-PDF-Link
            // Dieser Block wird ausserhalb des containers gerendert -> document-weite Suche
            let tzNr = "";
            const allPdfLinks = Array.from(document.querySelectorAll('a[href*="WRSheets"]'));
            if (allPdfLinks.length > 0) {
                // Nehme den zuletzt sichtbaren (= aktuell aufgeklappten)
                const pdfLink = allPdfLinks[allPdfLinks.length - 1];
                const tzSpan = pdfLink.parentElement?.querySelector('span');
                const tzRaw = tzSpan?.innerText.trim() || "";
                if (/[A-Z]+[0-9]+/.test(tzRaw)) tzNr = tzRaw.replace(/[^0-9]/g, '');
            }

            reportData.push({ time, train: trainFull, nr: displayNr, link: detailLink, dest: destination, evns: [...new Set(matches)], track: track, tz: tzNr });

            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

        // --- Abschluss-Aktionen ---

        // 1. Overlay weg
        if (overlay) overlay.remove();

        // 2. Button zurück auf Anfang
        btn.disabled = false;
        btn.style.background = "#1976d2";
        btn.innerHTML = "<span style='font-size:25px;'>🔍</span><br>SCAN";

        // 3. Separates Popup anzeigen
        const popup = document.createElement('div');
        popup.innerHTML = "<b>SCAN FERTIG ✔</b><br><span style='font-size:12px;'>Report wurde erstellt</span>";
        popup.style = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background:#0b3b20; color: white #9bb2c9; padding: 12px 25px;
            border-radius: 4px; font-family: sans-serif; font-size: 16px;
            z-index: 100000; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            text-align: center; border: 1px solid white;
        `;
        document.body.appendChild(popup);

        // Popup nach 4 Sek ausblenden
        setTimeout(() => {
            popup.style.opacity = "0";
            popup.style.transition = "opacity 0.5s ease";
            setTimeout(() => popup.remove(), 500);
        }, 4000);

        // 4. Download
        exportHTML(stationName, startTime, reportData);
    };

    function exportHTML(station, dateObj, data) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        const timeStamp = `${day}-${month}-${year}_${hours}-${mins}`;

        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            .header { background: #2b70b5; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; display: flex; align-items: center; gap: 20px; }
            .header h1 { font-size: 1.9rem; margin: 0; }
            .header p  { font-size: 1.4rem; margin: 0; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; vertical-align: middle; }
            th { background: #f2f2f2; color: #003366; text-transform: uppercase; }
            .evn { background: #eeeeee; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; border: 1px solid #ccc; margin: 0 3px; }
            .clip-box { background: #624887; border: 2px solid #ccc; border-radius: 6px; padding: 4px 8px; text-decoration: none; font-size: 1.5rem; }
            .track-box { background:#006666; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
            .tz-box { background:#9eb5af; color: #010a1c; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; font-size: 1.1rem; letter-spacing: 1px; }
            #filterbar { position: sticky; top: 0; z-index: 999; background: #0d2d4d; padding: 10px 16px;
                display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4); margin-bottom: 16px; }
            #filterbar input { padding: 7px 12px; border-radius: 6px; border: none;
                font-size: 14px; width: 220px; background: #2e3f52; color: white; outline: none; }
            #filterbar button { padding: 7px 14px; border-radius: 6px; border: none;
                color: white; font-size: 13px; cursor: pointer; font-weight: bold; white-space: nowrap; }
            #chipArea { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; flex: 1; }
            .chip { background: #2b70b5; color: white; padding: 4px 10px; border-radius: 20px;
                font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
            #counter { font-size: 13px; color: #9eb5af; background: #111;
                padding: 4px 10px; border-radius: 4px; white-space: nowrap; }
        </style></head><body>

        <div id="filterbar">
            <div id="chipArea"><span style="color:#7a8fa0;font-size:13px;">Keine aktiven Filter</span></div>
            <input id="searchInput" placeholder="EVN, Zugnr, Ziel … dann Enter"
                onkeydown="if(event.key==='Enter') addSearch()" />
            <button onclick="addSearch()" style="background:#1976d2;">+ Suche</button>
            <button id="btnToggle" onclick="toggleHide()" style="background:#555;">&#x1F453; Nur Treffer anzeigen</button>
            <button onclick="resetAll()" style="background:#7b2020;">&#x2715; Zurücksetzen</button>
            <span id="counter"></span>
        </div>

        <div class="header"><h1>&#x1F689; REPORT: ${station}</h1><p>${dateObj.toLocaleString('de-DE')}</p></div>
        <table><thead><tr><th>Zeit</th><th>Zug / Nr</th><th>Ziel</th><th>Waggons</th><th style="width:40px;">LINKS</th><th>Gl.</th><th>TZ</th></tr></thead><tbody>`;

        data.forEach(item => {
            const evnsHtml = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            const trackHtml = item.track ? `<span class="track-box">${item.track}</span>` : `<span style="color:#aaa;">–</span>`;
            const clipHtml = item.link
                ? `<a href="${item.link}" target="_blank" class="clip-box">&#x1F517;</a>`
                : `<span style="color:#aaa;">–</span>`;
            const tzHtml = item.tz ? `<span class="tz-box">${item.tz}</span>` : `<span style="color:#aaa;">–</span>`;
            html += `<tr>
                <td><b>${item.time}</b></td>
                <td><b>${item.train}</b><br><small>${item.nr}</small></td>
                <td><b>${item.dest}</b></td>
                <td>${evnsHtml}</td>
                <td style="text-align:center;">${clipHtml}</td>
                <td style="text-align:center;">${trackHtml}</td>
                <td style="text-align:center;">${tzHtml}</td>
            </tr>`;
        });
        html += `</tbody></table>
        <script>
            var searches = [];
            var hideNoMatch = false;

            document.getElementById('searchInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') addSearch();
            });

            function addSearch() {
                var val = document.getElementById('searchInput').value.trim().toLowerCase();
                if (!val || searches.includes(val)) { document.getElementById('searchInput').value = ''; return; }
                searches.push(val);
                document.getElementById('searchInput').value = '';
                renderChips();
                applyFilter();
            }

            function removeSearch(val) {
                searches = searches.filter(function(s) { return s !== val; });
                renderChips();
                applyFilter();
            }

            function resetAll() {
                searches = [];
                hideNoMatch = false;
                var btn = document.getElementById('btnToggle');
                btn.textContent = '\u{1F453} Nur Treffer anzeigen';
                btn.style.background = '#555';
                renderChips();
                applyFilter();
            }

            function toggleHide() {
                hideNoMatch = !hideNoMatch;
                var btn = document.getElementById('btnToggle');
                btn.innerHTML = hideNoMatch ? '\u{1F441} Alle anzeigen' : '\u{1F453} Nur Treffer anzeigen';
                btn.style.background = hideNoMatch ? '#1976d2' : '#555';
                applyFilter();
            }

            function renderChips() {
                var area = document.getElementById('chipArea');
                area.innerHTML = '';
                if (searches.length === 0) {
                    area.innerHTML = '<span style="color:#7a8fa0;font-size:13px;">Keine aktiven Filter</span>';
                    return;
                }
                searches.forEach(function(s) {
                    var chip = document.createElement('span');
                    chip.className = 'chip';
                    chip.innerHTML = s + ' <b style="font-size:16px;line-height:1;">&#x00D7;</b>';
                    chip.title = 'Klicken zum Entfernen';
                    chip.onclick = function() { removeSearch(s); };
                    area.appendChild(chip);
                });
            }

            function applyFilter() {
                var rows = document.querySelectorAll('table tbody tr');
                var total = rows.length;
                var visible = 0;
                rows.forEach(function(row) {
                    if (searches.length === 0) {
                        row.style.display = hideNoMatch ? 'none' : '';
                        row.style.background = '';
                        if (!hideNoMatch) visible++;
                    } else {
                        var text = row.innerText.toLowerCase();
                        var matched = searches.filter(function(s) { return text.includes(s); });
                        if (matched.length > 0) {
                            row.style.display = '';
                            row.style.background = matched.length >= 2 ? '#b6dbbc' : '#b6dbbc';
                            visible++;
                        } else {
                            row.style.display = hideNoMatch ? 'none' : '';
                            row.style.background = '';
                        }
                    }
                });
                document.getElementById('counter').textContent = visible + ' / ' + total + ' Züge';
            }

            applyFilter();
        <\/script>
        </body></html>`;

        const blob = new Blob(['\uFEFF' + html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVN_Report_${station.replace(/[^a-z0-9]/gi, '_')}_${timeStamp}.html`;
        a.click();
    }
})();
