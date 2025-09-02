import { formatRaid } from "../utils/formatRaid.js";
import { raidKeyboard } from "../utils/keyboards.js";

import { raids } from '../bot.js';

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
        }

        // Aggiorna il messaggio
        await ctx.editMessageText(formatRaid(raid), {
            reply_markup: raidKeyboard(raidId),
            parse_mode: "Markdown"
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