
export function formatRaid(raid) {
  const link = `https://www.pogoitalianleague.com/raid-boss-${raid.pokemon.toLowerCase()}/`;
  const players = raid.players
    .map((p, i) => `${i + 1}. ${p.icon} ${p.name}${p.count > 1 ? " +" + (p.count - 1) : ""}`)
    .join("\n");
  const totalPlayers = raid.players.reduce((sum, p) => sum + p.count, 0);

  return `🔰 [${raid.pokemon.toUpperCase()}](${link}) 🔰
───────
Palestra : ${raid.palestra}
Coord.   : \`${raid.coordinates[0].toFixed(6)}, ${raid.coordinates[1].toFixed(6)}\`
Location : ${process.env.LOCATION || "Gorizia"}
Ritrovo  : ${raid.start}
Scadenza : ${raid.end || "?"}
───────
${totalPlayers} giocatori confermati:
${players || "Nessuno ancora"}
───────
${raid.notes ? raid.notes : ""}
───────
Creatore: ${raid.creator}
ID Raid: ${raid.id}`;
}

// Coord.	 : [${raid.coordinates[0].toFixed(5)}, ${raid.coordinates[1].toFixed(5)}](https://www.google.com/maps/search/?api=1&query=${raid.coordinates[0]},${raid.coordinates[1]})