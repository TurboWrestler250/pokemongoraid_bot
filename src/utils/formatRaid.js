import { dataPokemon } from '../utils/dataPokemon.js';

export async function formatRaid(raid) {
  const pokemon = await dataPokemon(raid.pokemon.toLowerCase());
  // console.log(pokemon.id);
  const link = `https://db.pokemongohub.net/pokemon/${pokemon.id}/`;
  const players = raid.players
    .map((p, i) => `${i + 1}. ${p.icon} ${p.name}${p.count > 1 ? " +" + (p.count - 1) : ""}`)
    .join("\n");
  const totalPlayers = raid.players.reduce((sum, p) => sum + p.count, 0);
  return `
🔰 [${raid.pokemon.toUpperCase()}](${link}) 🔰
\`      ───────\`
\`Palestra : \`${raid.palestra}
\`Coord.   : \`\`${raid.coordinates[0].toFixed(6)}, ${raid.coordinates[1].toFixed(6)}\`
\`Location : \`_${"Gorizia"}_
\`Ritrovo  : \`**${raid.start}**
\`Scadenza : \`${raid.end || "?"}
\`      ───────\`
${totalPlayers} giocatori confermati:
${players || "Nessuno ancora"}
\`      ───────\`
_${raid.notes ? raid.notes : ""}_
\`      ───────\`
Creatore: \`${raid.creator}\`
ID Raid: \`${raid.id}\``;
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