// Importa le librerie necessarie
import dotenv from 'dotenv';
import fs from "fs";

import { Bot } from "grammy";
// import { Message } from "grammy/types";
// import bosses from './ScrapedDuck/boss-names.json' assert { type: 'json' };
// import ScrapedDuck from 'ScrapedDuck';

import { raidCommand } from "./commands/raid.js";

import { callback } from "./utils/callback.js";
import { readGoogleSheet } from "./utils/gyms.js";
import { raidKeyboard } from "./utils/keyboards.js";

dotenv.config();

// Leggi il JSON
const rawData = fs.readFileSync('./ScrapedDuck/boss-names.json', 'utf-8');
const bosses = JSON.parse(rawData);

// Prima di far partire il bot, carica le palestre
await readGoogleSheet();

const bot = new Bot(process.env.BOT_TOKEN);
export const raids = new Map();			// Struttura dei raid memorizzati in memoria
export const raidMessageMap = new Map();	// Dizionario per associare raid ID -> Telegram message ID

// COMANDI del bot
raidCommand(bot);
callback(bot);

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
    } else console.log(ctx.message.reply_to_message + "\n-- fine messaggio --\n")

    const newNote = ctx.match?.trim();
    if (!newNote) {
        return ctx.reply("❌ Devi fornire il nuovo testo per le note.", {
            reply_to_message_id: ctx.message?.message_id
        });
    }

    // Trova il raid corrispondente al messaggio reply
    const repliedMsgId = ctx.message.reply_to_message.message_id;
    const raidEntry = Array.from(raids.values()).find(r => raidMessageMap.get(r.id) === repliedMsgId);
	console.log(raidEntry);

    if (!raidEntry) {
        return ctx.reply("❌ Questo messaggio non è un raid valido.", {
            reply_to_message_id: ctx.message?.message_id
        });
    }

	// Recupera il raidId corrispondente al messaggio
	const raidId = Array.from(raidMessageMap.entries()).find(([key, value]) => value === repliedMsgId)?.[0];

	if (!raidId) {
		return ctx.reply("❌ Non ho trovato l'ID del raid associato.", {
			reply_to_message_id: ctx.message?.message_id
		});
	}

    // Aggiorna le note
    raidEntry.notes = newNote;

    // Aggiorna il messaggio originale
    await ctx.editMessageText(escapeMarkdownV2(raidEntry.notes), {
        reply_markup: raidKeyboard(raidId),
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




// Middleware per intercettare tutti i messaggi
// bot.on("message", (ctx) => {
//     const text = ctx.message?.text;
//     if (!text) return; // solo messaggi di testo

//     // Cerca pattern "ID Raid: <numero>"
//     const match = text.match(/ID Raid: (\d+)/);
//     if (match) {
//         const raidId = match[1];
//         const messageId = ctx.message.message_id;

//         // Salva l'associazione
//         raidMessageMap.set(raidId, messageId);
//         console.log(`Associato Raid ${raidId} al messaggio ${messageId}`);
//     }
// });

function escapeMarkdownV2(text/*: string*/)/*: string*/ {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s!]/g, '\\$&');
}

bot.start({ drop_pending_updates: true });
console.log("Bot avviato!");