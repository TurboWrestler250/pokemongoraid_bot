import { formatRaid } from "../utils/formatRaid.js";
import { raidKeyboard } from "../utils/keyboards.js";

import { raids, raidMessageMap } from '../commands/raid.js';
import { resolvePicker } from './picker.js';

const refreshCooldown = new Map(); // userId -> timestamp ultimo uso

export function callback(bot) {
    bot.on("callback_query:data", async (ctx) => {
        // Gestione selezione picker (callback_data form: 'pickpoke|<token>|<name>')
        try {
            const data = ctx.callbackQuery.data;
            if (data && data.startsWith('pickpoke|')) {
                const parts = data.split('|');
                const token = parts[1];
                const selection = parts.slice(2).join('|');
                const resolved = resolvePicker(token, selection);
                if (resolved) {
                    await ctx.answerCallbackQuery({ text: `Selezionato: ${selection}` });
                    try { await ctx.deleteMessage(); } catch (e) { /* ignore */ }
                } else {
                    await ctx.answerCallbackQuery({ text: 'Selezione non valida o scaduta', show_alert: true });
                }
                return;
            }
        } catch (err) {
            console.error('Errore gestione picker callback:', err);
        }

        console.log(ctx.callbackQuery.data);
        const [action, raidId, icon] = ctx.callbackQuery.data.split(":");
        if (!raidId) return ctx.answerCallbackQuery();
        
        const raid = raids.get(Number(raidId));
        console.log(raid);
        if (!raid) return ctx.answerCallbackQuery("Raid non trovato!");

        const userId = ctx.from.id;
        const name = ctx.from.first_name;
        const username = ctx.from.username;

        if (action === "join") {
            handleJoin(raid, userId, name, username, icon);
        } else if (action === "leave") {
            const left = handleLeave(raid, userId);
            if (!left) {
                return ctx.answerCallbackQuery({ text: "Non sei iscritto a questo raid.", show_alert: true });
            }
        } else if (action === "refresh") {
            const now = Date.now();
            const lastUse = refreshCooldown.get(userId) || 0;

            if (now - lastUse < 15000) {
                const remaining = Math.ceil((15000 - (now - lastUse)) / 1000);
                return ctx.answerCallbackQuery({
                    text: `⏳ Puoi aggiornare di nuovo tra ${remaining} secondi.`,
                    show_alert: true
                });
            }

            // Salva il nuovo timestamp
            refreshCooldown.set(userId, now);

            try {
                // Cancella il messaggio raid originale
                await ctx.deleteMessage();
                
                const newMessage = await ctx.reply(await formatRaid(raid), { 
                    reply_markup: raidKeyboard(raidId),
                    parse_mode: "Markdown",
                    disable_web_page_preview: true
                });

                // Aggiorna la mappa messaggi raid
                raidMessageMap.set(raidId, newMessage.message_id);

                return ctx.answerCallbackQuery({ text: "🔄 Raid aggiornato!" });
            } catch (err) {
                console.error("Errore durante il refresh:", err);
                return ctx.answerCallbackQuery({ 
                    text: "❌ Errore durante l'aggiornamento del raid.", 
                    show_alert: true 
                });
            }
        }

        // Aggiorna il messaggio
        try {
            await ctx.editMessageText(await formatRaid(raid), {
                reply_markup: raidKeyboard(raidId),
                parse_mode: "Markdown",
                disable_web_page_preview: true
            });
            await ctx.answerCallbackQuery();
        } catch (err) {
            console.error("Errore durante l'aggiornamento:", err);
            await ctx.answerCallbackQuery({ 
                text: "❌ Errore durante l'aggiornamento.", 
                show_alert: true 
            });
        }
    })
};

function handleJoin(raid, userId, name, username, icon) {
    // Usa il metodo findPlayer della classe Raid
    let player = raid.findPlayer(userId);
    
    if (!player) {
        // Aggiungi un nuovo player usando il metodo addPlayer
        raid.addPlayer({ userId, name, username, icon, count: 1 });
    } else {
        // Aggiorna il player esistente
        if (player.icon === icon) {
            raid.updatePlayer(userId, { count: player.count + 1 });
        } else {
            raid.updatePlayer(userId, { icon, count: player.count + 1 });
        }
    }
}

function handleLeave(raid, userId) {
    // Usa il metodo findPlayer della classe Raid
    let player = raid.findPlayer(userId);
    
    if (!player) {
        return false;
    }
    
    if (player.count > 1) {
        // Decrementa il contatore
        raid.updatePlayer(userId, { count: player.count - 1 });
    } else {
        // Rimuovi il player completamente
        raid.removePlayer(userId);
    }
    
    return true;
}