// import { dataPokemon } from './dataPokemon.js';

export async function multiPokemon(bot, pokemon) {
    const sendMessage = await ctx.reply(await formatRaid(raid), { 
        reply_markup: raidKeyboard(raid.getId()),
        parse_mode: "Markdown",
        disable_web_page_preview: true
    });
    return JSON.parse(pokemon);
}