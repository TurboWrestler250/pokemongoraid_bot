import { JSDOM } from "jsdom";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs";

const FILE_PATH = "./ScrapedDuck/boss-names.json";
const LOG_PATH = "./ScrapedDuck/changes.log";

// Funzione per confrontare due oggetti/array profondamente
function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Funzione per scrivere nel file di log
function logToFile(message) {
    const now = new Date();
    const date = now.toLocaleDateString("it-IT"); // es. 01/09/2025
    const time = now.toLocaleTimeString("it-IT"); // es. 14:32:10

    // const timestamp = new Date().toISOString();
    appendFileSync(LOG_PATH, `[${date} ${time}] ${message}\n`);
}

export async function fetchBosses() {
    JSDOM.fromURL("https://leekduck.com/boss/")
        .then(dom => {
            const document = dom.window.document;

            // RAID BOSSES
            const raidBossesTiers = document.querySelectorAll("div.raid-bosses > div.tier");
            const raidBossNames = [];

            raidBossesTiers.forEach(tier => {
                const cards = tier.querySelectorAll("div.card");
                cards.forEach(card => {
                    const nameElem = card.querySelector("p.name") || card.querySelector("p.name.small-type");
                    if (nameElem) {
                        raidBossNames.push(nameElem.textContent.trim());
                    }
                });
            });

            // console.log("Raid Bosses:", raidBossNames);

    // -------------------------------------------------------------------------------

            // SHADOW RAID BOSSES
            const shadowRaidBossesTiers = document.querySelectorAll("div.shadow-raid-bosses > div.tier");
            const shadowRaidBossNames = [];

            shadowRaidBossesTiers.forEach(tier => {
                const cards = tier.querySelectorAll("div.card.-shadow");
                cards.forEach(card => {
                    const nameElem = card.querySelector("p.name") || card.querySelector("p.name.small-type");
                    if (nameElem) {
                        shadowRaidBossNames.push(nameElem.textContent.trim());
                    }
                });
            });

            // console.log("Shadow Raid Bosses:", shadowRaidBossNames);

            // Salva i nomi in un file JSON
            const allBosses = {
                raidBosses: raidBossNames,
                shadowRaidBosses: shadowRaidBossNames
            };

// CONTROLLO QUANDO CAMBIANO I BOSS
            // Controllo se esiste già un file
            if (existsSync(FILE_PATH)) {
                const oldData = JSON.parse(readFileSync(FILE_PATH, "utf-8"));

                if (!deepEqual(allBosses, oldData)) {
                    logToFile("⚠️ Cambiamento rilevato nei boss!");
                    logToFile("➡️ Vecchi boss: " + JSON.stringify(oldData));
                    logToFile("➡️ Nuovi boss: " + JSON.stringify(allBosses));
                }
            } else {
                logToFile("📂 Nessun file precedente trovato, creato il primo snapshot.");
            }

            // Json file saved
            writeFileSync(FILE_PATH, JSON.stringify(allBosses, null, 4));
            console.log("Create boss-names.json file!");
        })
        .catch(err => console.error("Errore:", err));
}