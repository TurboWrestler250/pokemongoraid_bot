import fetch from "node-fetch";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIKmAkbVox16DFHqUK-wvsOP8-yoqs5LpKxBbz0RV-KaUpTD_99kDsfqSEB2j2xm4qGqsYopYlvVBi/pub?output=csv";

let gyms = [];

export async function readGoogleSheet() {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();
    gyms = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });
  } catch (err) {
    console.error("Errore leggendo il Google Sheet:", err);
    console.log("gyms:", gyms);
  }
}

export function findGymByKeywords(keyword) {
  try {
    if (!keyword || typeof keyword !== "string") {
      return null;
    }

    const search = keyword.toLowerCase();

    for (const gym of gyms) {
      if (!gym["Parole chiave"]) continue;

      const gymKeywords = gym["Parole chiave"].toLowerCase().split(" ");

      if (gymKeywords.includes(search)) {
        return {
          nome: gym["Nome palestra"],
          coords: [
            parseFloat(gym["Latitudine"]),
            parseFloat(gym["Longitudine"]),
          ],
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Errore in findGymByKeywords:", err);
    console.log("gyms:", gyms);
    return null;
  }
}
