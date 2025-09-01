// Importa le librerie necessarie
import dotenv from 'dotenv';
import { Bot, InlineKeyboard } from "grammy";
import bosses from './ScrapedDuck/boss-names.json' assert { type: 'json' };
import ScrapedDuck from 'ScrapedDuck';
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

// Struttura dei raid memorizzati in memoria
const raids = new Map();

// COMANDI del bot
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
	const raid = {
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
	.text("🚶", `join:${raidId}:🚶`)
	.text("✈️", `join:${raidId}:✈️`)
	.text("📡", `join:${raidId}:📡`)
	.text("✉️", `join:${raidId}:✉️`)
	.text("❌", `leave:${raidId}:❌`)
	.row()
	.text("⚙️", `join:${raidId}:⚙️`)
	.text("🔄", `join:${raidId}:🔄`);

	await ctx.reply(formatRaid(raid), { 
		reply_markup: keyboard,
		parse_mode: "Markdown"
	});
});

bot.command("id", async (ctx) => {
	if (ctx.msg?.reply_to_message) {
		const repliedMessageId = ctx.msg.reply_to_message.message_id;

		await ctx.reply(`🆔 L'ID del messaggio è: \`${repliedMessageId}\``, {
			parse_mode: "Markdown",
			reply_to_message_id: ctx.msg.message_id, // opzionale: risponde al comando
		});
	} else {
		await ctx.reply("❌ Devi rispondere a un messaggio per usare questo comando.", {
			reply_to_message_id: ctx.msg?.message_id,
		});
	}
});

bot.command("d", async (ctx) => {
  if (!ctx.message?.reply_to_message) {
    return ctx.reply("❌ Devi rispondere a un messaggio con /d per eliminarlo.");
  }

  const repliedMessageId = ctx.message.reply_to_message.message_id;

  try {
    // Elimina il messaggio a cui l'utente ha risposto
    await ctx.api.deleteMessage(ctx.chat.id, repliedMessageId);

    // Elimina anche il comando /delete
    await ctx.deleteMessage();

    // Manda un messaggio di conferma
    await ctx.reply(`✅ Messaggio con ID ${repliedMessageId} eliminato con successo.`);
  } catch (err) {
    console.error("Errore:", err);
    await ctx.reply("⚠️ Non sono riuscito a eliminare quel messaggio. Forse non ho i permessi?");
  }
});

bot.command("delete", async (ctx) => {
    const args = ctx.match?.split(" ") || [];
    if (args.length < 1) {
        return ctx.reply("Uso: /delete [ID del raid]");
    }
    const raidId = args[0];
    const raid = raids.get(raidId);
    if (!raid) {
        return ctx.reply("Raid non trovato!");
    }
	const raidMessageId = raid.message_id;

    // Prova a cancellare il messaggio del raid
    try {
        await ctx.api.deleteMessage(ctx.chat.id, raidMessageId);
    } catch (err) {
        console.error("Errore cancellazione messaggio:", err);
    	await ctx.reply("Errore durante la cancellazione del messaggio: " + err.description);
    }

    raids.delete(raidId);
    await ctx.reply(`Raid ${raidId} eliminato con successo.`);
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
			player = { userId, name, icon: icon, count: 1 };
			raid.players.push(player);
		} else {
			if (player.icon === icon) {
			player.count++;
			} else {
			player.icon = icon;
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
		.text("🚶", `join:${raidId}:🚶`)
		.text("✈️", `join:${raidId}:✈️`)
		.text("📡", `join:${raidId}:📡`)
		.text("✉️", `join:${raidId}:✉️`)
		.text("❌", `leave:${raidId}:❌`)
		.row()
		.text("⚙️", `join:${raidId}:⚙️`)
		.text("🔄", `join:${raidId}:🔄`),
	parse_mode: "Markdown"
	});

	await ctx.answerCallbackQuery();
});

// Funzione che formatta il messaggio
function formatRaid(raid) {
	const link = `https://www.pogoitalianleague.com/raid-boss-${raid.pokemon.toLowerCase()}/`;
	const players = raid.players
		.map((p, i) => `${i + 1}. ${p.icon} ${p.name}${p.count > 1 ? " +" + (p.count - 1) : ""}`)
		.join("\n");
	// Calcola il totale dei giocatori sommando tutti i count
	const totalPlayers = raid.players.reduce((total, player) => total + player.count, 0);

	return `🔰 [${raid.pokemon.toUpperCase()}](${link}) 🔰
	───────
	Palestra : ${raid.palestra}
	Location : ${process.env.LOCATION || "Gorizia"}
	Ritrovo  : ${raid.start}
	Scadenza : ${raid.end || "?"}
	───────
	${totalPlayers} giocatori confermati:
	${players || "Nessuno ancora"}
	───────
	${raid.notes ? raid.notes + "\n───────\n" : ""}
	Creatore: ${raid.creator}
	ID Raid: ${raid.id}`;
}

bot.start({ drop_pending_updates: true });

console.log("Bot avviato!");