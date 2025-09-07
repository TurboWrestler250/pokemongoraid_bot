import fetch from "node-fetch";
import { parse } from "csv-parse";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIKmAkbVox16DFHqUK-wvsOP8-yoqs5LpKxBbz0RV-KaUpTD_99kDsfqSEB2j2xm4qGqsYopYlvVBi/pub?output=csv";

let gyms = [];

export async function readGoogleSheet() {
  const res = await fetch(CSV_URL);
  const text = await res.text();

  gyms = parse(text, {
    columns: true,
    skip_empty_lines: true,
  });
}

export function findGymByKeywords(keywords) {
  keywords = keywords.map((k) => k.toLowerCase());

  for (const gym of gyms) {
    if (!gym["Parole chiave"]) continue;

    const gymKeywords = gym["Parole chiave"].toLowerCase().split(" ");
    if (keywords.some((k) => gymKeywords.includes(k))) {
      return {
        nome: gym["Nome palestra"],
        coords: [parseFloat(gym["Latitudine"]), parseFloat(gym["Longitudine"])],
      };
    }
  }
  return null;
}
