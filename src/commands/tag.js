import { raids } from './raid.js';

export function tagCommand(bot) {
    bot.command("tag", async (ctx) => {
        // Controlla che il comando sia in risposta a un messaggio
        if (!ctx.message?.reply_to_message) {
            return ctx.reply("❌ Devi rispondere a un messaggio di raid con /tag.");
        }

        // Prendi il testo passato come parametro
        const tagText = ctx.match?.trim();
        if (!tagText) {
            return ctx.reply("❌ Devi specificare il testo da inviare.");
        }

        // Cerca l'ID raid nel messaggio a cui si sta rispondendo
        const repliedText = ctx.message.reply_to_message.text;
        const raidIdMatch = repliedText.match(/ID Raid: (\S+)/);
        if (!raidIdMatch) {
            return ctx.reply("❌ Non riesco a trovare l'ID del raid nel messaggio a cui hai risposto.");
        }
        const raidId = raidIdMatch[1];
        const raid = raids.get(raidId);

        if (!raid) {
            return ctx.reply("❌ Raid non trovato!");
        }

        // Prendi le menzioni degli utenti Telegram presenti nel raid
        const usernames = raid.players.map(p => {
            // Se hai salvato user_id e username
            if (p.user_id && p.username) {
                return `@${p.username}`;
            }
            // Fallback: solo username
            return `@${p.username || p.name || "utente"}`;
        }).join('\n') || "Nessun utente nel raid.";

        // Rispondi con il testo e i username
        await ctx.reply(`${tagText}\n\n${usernames}`);
    });
}