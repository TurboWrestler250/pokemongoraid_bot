import { formatRaid } from "../utils/formatRaid.js";
import { raidKeyboard } from "../utils/keyboards.js";

import { raids, raidMessageMap } from '../bot.js';

const refreshCooldown = new Map(); // userId -> timestamp ultimo uso

export function callback(bot) {
    bot.on("callback_query:data", async (ctx) => {
        const [action, raidId, icon] = ctx.callbackQuery.data.split(":");
        if (!raidId) return ctx.answerCallbackQuery();
        const raid = raids.get(raidId);
        if (!raid) return ctx.answerCallbackQuery();

        const userId = ctx.from.id;
        const name = ctx.from.first_name;

        if (action === "join") {
            handleJoin(raid, userId, name, icon);
        } else if (action === "leave") {
            const left = handleLeave(raid, userId);
            if (!left) {
                return ctx.answerCallbackQuery({ text: "Non sei iscritto a questo raid.", show_alert: true });
            }
        } else if (action === "refresh") {
            const now = Date.now();
            const lastUse = refreshCooldown.get(userId) || 0;

            if (now - lastUse < 15000) {
                return ctx.answerCallbackQuery({
                    text: "⏳ Puoi aggiornare di nuovo tra qualche secondo.",
                    show_alert: true
                });
            }

            // Salva il nuovo timestamp
            refreshCooldown.set(userId, now);

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
        }

        // Aggiorna il messaggio
        await ctx.editMessageText(await formatRaid(raid), {
            reply_markup: raidKeyboard(raidId),
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });

        await ctx.answerCallbackQuery();
    })
};

function handleJoin(raid, userId, name, icon) {
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
}

function handleLeave(raid, userId) {
    let player = raid.players.find((p) => p.userId === userId);
    if (!player) {
        return false;
    }
    if (player && player.count > 1) {
        player.count--;
    } else {
        raid.players = raid.players.filter((p) => p.userId !== userId);
    }
    return true;
}