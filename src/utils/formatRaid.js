import { dataPokemon } from '../utils/dataPokemon.js';

export async function formatRaid(raid) {
  // if (!raid.pokemon) return "Errore: Pokemon non specificato.";
  if (!raid.getPokemon()) return "Errore: Pokemon non specificato.";

  const pokemon = await dataPokemon(raid.getPokemon().toLowerCase());
  const link = `https://db.pokemongohub.net/pokemon/${pokemon.id}/`;

  const players = raid.getPlayers()
    .map((p, i) => `${i + 1}. ${p.icon} ${p.name}${p.count > 1 ? " +" + (p.count - 1) : ""}`)
    .join("\n");

  const totalPlayers = raid.getPlayers().reduce((sum, p) => sum + p.count, 0);
  
  return `
🔰 [${raid.getPokemon().toUpperCase()}](${link}) 🔰
\`      ───────\`
\`Palestra : \`${raid.getGym()}
\`Coord.   : \`\`${raid.getLatitudine().toFixed(6)}, ${raid.getLongitudine().toFixed(6)}\`
\`Location : \`_${"Gorizia"}_
\`Ritrovo  : \`**${raid.getTimeStart()}**
\`Scadenza : \`${raid.getTimeEnd() || "?"}
\`      ───────\`
${totalPlayers} giocatori confermati:
${players || "Nessuno ancora"}
\`      ───────\`
_${raid.getNotes() ? raid.getNotes() : ""}_
\`      ───────\`
Creatore: \`${raid.getCreator()}\`
ID Raid: \`${raid.getId()}\``;
}

// Funzione helper per escapare caratteri speciali in MarkdownV2
function escapeMarkdown(text) {
  if (!text) return "";
  return text.toString()
    .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// function getPokedexData(raid){
//   const resp = fetch("https://ex.traction.one/pokedex/pokemon");
//   const data = resp.json();
//   return data; // nome ↔ numero
// }

// async function getPokemonNumber(name) {
//   const data = await getPokedexData();
//   const key = Object.keys(data).find(
//     key => data[key].toLowerCase() === name.toLowerCase()
//   );
//   return key ? Number(key) : null;
// }

// Coord.	 : [${raid.coordinates[0].toFixed(5)}, ${raid.coordinates[1].toFixed(5)}](https://www.google.com/maps/search/?api=1&query=${raid.coordinates[0]},${raid.coordinates[1]})