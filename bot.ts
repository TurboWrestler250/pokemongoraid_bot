import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot("<IL_TUO_TOKEN>");

// Struttura dei raid memorizzati in memoria
interface Player {
  userId: number;
  name: string;
  icon: string;
  count: number;
}

interface Raid {
  id: string;
  pokemon: string;
  palestra: string;
  start: string;
  end?: string;
  notes?: string;
  creator: string;
  players: Player[];
}

const raids = new Map<string, Raid>();

// Comando raid
bot.command("raid", async (ctx) => {
  const args = ctx.match?.split(" ") || [];

  if (args.length < 3) {
    return ctx.reply("Uso: /raid [pokemon] [palestra] [ora inizio] [ora fine?] [note?]");
  }

  const pokemon = args[0] ? args[0] : "";
  const palestra = args[1] ? args[1] : "";
  const start = args[2] ? args[2] : "";
  const end = args[3] && args[3].match(/^\d{1,2}:\d{2}$/) ? args[3] : "";
  const notes = args[4] ? args.slice(4).join(" ") : args.slice(3).join(" ");

  const raidId = Math.floor(Math.random() * 1000000).toString();
  const raid: Raid = {
    id: raidId,
    pokemon,
    palestra,
    start,
    end,
    notes,
    creator: ctx.from?.first_name || "Sconosciuto",
    players: [],
  };

  raids.set(raidId, raid);

  const keyboard = new InlineKeyboard()
    .text("✈️", `join:${raidId}:✈️`)
    .text("👤", `join:${raidId}:👤`)
    .text("🚗", `join:${raidId}:🚗`)
    .row()
    .text("❌", `leave:${raidId}`);

  await ctx.reply(formatRaid(raid), { reply_markup: keyboard });
});

// Gestione pulsanti
bot.on("callback_query:data", async (ctx) => {
  const [action, raidId, icon] = ctx.callbackQuery.data.split(":");
  if (!raidId) return ctx.answerCallbackQuery();
  const raid = raids.get(raidId);
  if (!raid) return ctx.answerCallbackQuery();

  const userId = ctx.from.id;
  const name = ctx.from.first_name;

  if (action === "join") {
    let player = raid.players.find((p) => p.userId === userId);
    if (!player) {
      player = { userId, name, icon: icon!, count: 1 };
      raid.players.push(player);
    } else {
      if (player.icon === icon) {
        player.count++;
      } else {
        player.icon = icon!;
        player.count++;
      }
    }
  } else if (action === "leave") {
    let player = raid.players.find((p) => p.userId === userId);
    if (player && player.count > 1) {
      player.count--;
    } else {
      raid.players = raid.players.filter((p) => p.userId !== userId);
    }
  }

  // Aggiorna il messaggio
  await ctx.editMessageText(formatRaid(raid), {
    reply_markup: new InlineKeyboard()
      .text("✈️", `join:${raidId}:✈️`)
      .text("👤", `join:${raidId}:👤`)
      .text("🚗", `join:${raidId}:🚗`)
      .row()
      .text("❌", `leave:${raidId}`),
  });

  await ctx.answerCallbackQuery();
});

// Funzione che formatta il messaggio
function formatRaid(raid: Raid): string {
  const link = `https://www.pogoitalianleague.com/raid-boss-${raid.pokemon.toLowerCase()}/`;
  const players = raid.players
    .map((p, i) => `${i + 1}. ${p.icon} ${p.name}${p.count > 1 ? " +" + (p.count - 1) : ""}`)
    .join("\n");

  return `🔰 ✨${raid.pokemon.toUpperCase()} (${link}) 🔰
───────
Palestra : ${raid.palestra}
Location : Gorizia
Ritrovo  : ${raid.start}
Scadenza : ${raid.end || "?"}
───────
${raid.players.length} giocatori confermati:
${players || "Nessuno ancora"}
───────
${raid.notes ? raid.notes + "\n───────\n" : ""}
Creatore: ${raid.creator}
ID Raid: ${raid.id}`;
}

bot.start({ drop_pending_updates: true });