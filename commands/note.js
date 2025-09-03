import { raids, raidMessageMap } from '../bot.js';

import { raidKeyboard } from "../utils/keyboards.js";

export function noteCommand(bot) {
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
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true
    });

    // Conferma all'utente
    await ctx.reply("✅ Note aggiornate con successo!", {
        reply_to_message_id: ctx.message?.message_id
    });
});
}

function escapeMarkdownV2(text/*: string*/)/*: string*/ {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s!]/g, '\\$&');
}