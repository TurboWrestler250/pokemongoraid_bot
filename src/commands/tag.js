import { raids } from '../commands/raid.js';

export function tagCommand(bot) {
    bot.command("tag", async (ctx) => {
        const flag = true;
        // Controlla che il comando sia in risposta a un messaggio
        console.assert(flag, ctx.message.reply_to_message);
        if (!ctx.message?.reply_to_message) {
            return ctx.reply("❌ Devi rispondere a un messaggio di raid con /tag.");
        }

        // Prendi il testo passato come parametro
        const tagText = ctx.match?.trim();
        console.assert(flag, tagText);
        if (!tagText) {
            return ctx.reply("❌ Devi specificare il testo da inviare.");
        }

        // Ricerca del Raid (Usando il getter)
        const message_id = ctx.message.reply_to_message.message_id;
        const raid = raids.find(r => r.getIdMessagge() === message_id);

        if (!raid) {
            console.log(`❌ Tentativo di tag su message_id: ${message_id}`);
            console.log("ID Messaggio dei raid in memoria:", raids.map(r => r.getIdMessagge()));
            return ctx.reply("❌ Raid non trovato (il messaggio potrebbe essere troppo vecchio o non è un raid valido).");
        }

        // Generazione dei Tag (Usa il getter e filtra)
        const usernames = raid.getPlayers()
            // Filtra solo quelli che hanno un username valido per il tag (@)
            .filter(p => p.username)
            // Mappa al formato @username e unisce con spazio
            .map(p => `@${p.username}`) 
            .join(' '); 

        if (!usernames) {
            // Se non ci sono utenti taggabili
            return ctx.reply("Non ci sono utenti con un username Telegram nel raid da taggare.");
        }

        // Risposta finale
        await ctx.reply(`${tagText}\n\n${usernames}`);
    });
}