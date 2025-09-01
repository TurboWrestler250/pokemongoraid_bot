// Importa le librerie necessarie
import dotenv from 'dotenv';
import fs from "fs";

import { Bot, InlineKeyboard } from "grammy";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
// import bosses from './ScrapedDuck/boss-names.json' assert { type: 'json' };
// import ScrapedDuck from 'ScrapedDuck';
dotenv.config();

// Leggi il JSON
const rawData = fs.readFileSync('./ScrapedDuck/boss-names.json', 'utf-8');
const bosses = JSON.parse(rawData);

// console.log("Raid Bosses:", bosses.raidBosses);
// console.log("Shadow Raid Bosses:", bosses.shadowRaidBosses);

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIKmAkbVox16DFHqUK-wvsOP8-yoqs5LpKxBbz0RV-KaUpTD_99kDsfqSEB2j2xm4qGqsYopYlvVBi/pub?output=csv';

let gyms = []; // variabile globale che contiene i dati del foglio

export async function readGoogleSheet() {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    gyms = parse(text, {
        columns: true, // prima riga per intestazioni
        skip_empty_lines: true
    });
}

// Prima di far partire il bot, carica le palestre
await readGoogleSheet();

// Funzione per trovare la palestra a partire dalle parole chiave
function findGymByKeywords(keywords) {
    keywords = keywords.map(k => k.toLowerCase());

    for (const gym of gyms) {
        if (!gym['Parole chiave']) continue;

        const gymKeywords = gym['Parole chiave'].toLowerCase().split(" "); // dividi per parole
        const matched = keywords.some(k => gymKeywords.includes(k));
        if (matched) {
            const coords = [
                parseFloat(gym['Latitudine']),
                parseFloat(gym['Longitudine'])
            ];
            return { nome: gym['Nome palestra'], coords };
        }
    }

    return null; // nessuna corrispondenza
}

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
	 // Trova il primo valore con pattern "00:00" (orario)
    const timePattern = /^\d{1,2}:\d{2}$/;
    let startIndex = args.findIndex(a => timePattern.test(a));
    if (startIndex === -1) return ctx.reply("Orario di inizio non trovato.");

    const palestraWords = args.slice(1, startIndex); // parole relative alla palestra
	const palestraInfo = findGymByKeywords(palestraWords);
	const palestra = palestraInfo.nome;
	const coordinates = palestraInfo.coords;
	const start = args[2] ? args[2] : "";
	const end = args[3] && args[3].match(/^\d{1,2}:\d{2}$/) ? args[3] : "";
	const notes = args[4] ? args.slice(4).join(" ") : args.slice(3).join(" ");

	if (!palestra) {
        return ctx.reply("Nome palestra errato, riprova con un nuovo comando.");
    }

	const raidId = Math.floor(Math.random() * 1000000).toString();
	const raid = {
		id: raidId,
		pokemon,
		palestra,
		coordinates,
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

bot.command("note", async (ctx) => {
    // Controlla se si sta rispondendo a un messaggio
    if (!ctx.message?.reply_to_message) {
        return ctx.reply("❌ Devi rispondere a un messaggio raid per aggiornare le note.", {
            reply_to_message_id: ctx.message?.message_id
        });
    }

    const newNote = ctx.match?.trim();
    if (!newNote) {
        return ctx.reply("❌ Devi fornire il nuovo testo per le note.", {
            reply_to_message_id: ctx.message?.message_id
        });
    }

    // Trova il raid corrispondente al messaggio reply
    const repliedMsgId = ctx.message.reply_to_message.message_id;
    const raidEntry = Array.from(raids.values()).find(r => r.message_id === repliedMsgId);

    if (!raidEntry) {
        return ctx.reply("❌ Questo messaggio non è un raid valido.", {
            reply_to_message_id: ctx.message?.message_id
        });
    }

    // Aggiorna le note
    raidEntry.notes = newNote;

    // Aggiorna il messaggio originale
    const keyboard = new InlineKeyboard()
        .text("🚶", `join:${raidEntry.id}:🚶`)
        .text("✈️", `join:${raidEntry.id}:✈️`)
        .text("📡", `join:${raidEntry.id}:📡`)
        .text("✉️", `join:${raidEntry.id}:✉️`)
        .text("❌", `leave:${raidEntry.id}:❌`)
        .row()
        .text("⚙️", `join:${raidEntry.id}:⚙️`)
        .text("🔄", `join:${raidEntry.id}:🔄`);

    await ctx.editMessageText(formatRaid(raidEntry), {
        reply_markup: keyboard,
        parse_mode: "MarkdownV2"
    });

    // Conferma all'utente
    await ctx.reply("✅ Note aggiornate con successo!", {
        reply_to_message_id: ctx.message?.message_id
    });
});

bot.command("raids", async (ctx) => {
    if (raids.size === 0) {
        return ctx.reply("❌ Non ci sono raid attivi al momento.");
    }

    const raidList = Array.from(raids.values())
        .map(r => `🆔 ${r.id} - ${r.pokemon} @ ${r.palestra}`)
        .join("\n");

    await ctx.reply(`📋 Raid attivi:\n\n${raidList}`);
});

bot.command("raidsinfo", async (ctx) => {
    if (raids.size === 0) {
        return ctx.reply("❌ Non ci sono raid attivi al momento.");
    }

    const raidList = Array.from(raids.values())
        .map(r => `🆔 ${r.id} - ${raidMessageMap.get(r.id)}`)
        .join("\n");

    await ctx.reply(`📋 Raid attivi:\n\n${raidList}`);
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
	// Calcola il totale dei giocatori sommando tutti i coun
	const totalPlayers = raid.players.reduce((total, player) => total + player.count, 0);

	return `🔰 [${raid.pokemon.toUpperCase()}](${link}) 🔰
	───────
	Palestra : ${raid.palestra}
	Coord.	 : \`${raid.coordinates[0].toFixed(6)}, ${raid.coordinates[1].toFixed(6)}\`
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
// Coord.	 : [${raid.coordinates[0].toFixed(5)}, ${raid.coordinates[1].toFixed(5)}](https://www.google.com/maps/search/?api=1&query=${raid.coordinates[0]},${raid.coordinates[1]})

// Dizionario per associare raid ID -> Telegram message ID
const raidMessageMap = new Map();

// Middleware per intercettare tutti i messaggi
bot.on("message", (ctx) => {
    const text = ctx.message?.text;
    if (!text) return; // solo messaggi di testo

    // Cerca pattern "ID Raid: <numero>"
    const match = text.match(/ID Raid: (\d+)/);
    if (match) {
        const raidId = match[1];
        const messageId = ctx.message.message_id;

        // Salva l'associazione
        raidMessageMap.set(raidId, messageId);
        console.log(`Associato Raid ${raidId} al messaggio ${messageId}`);
    }
});

bot.start({ drop_pending_updates: true });

console.log("Bot avviato!");