export async function dataPokemon(pokemon) {
    // if (pokemon === "shaymin") pokemon = "shaymin-land";
    // if (pokemon === "deoxys") pokemon = "deoxys-normal";
    // if (pokemon === "giratina") pokemon = "giratina-altered";

    const API_POKEMON = "https://pokeapi.co/api/v2/pokemon/";
    let count;
    try {
        const res = await fetch(API_POKEMON + "?limit=1");
        if (!res.ok) throw new Error("PokeAPI non raggiungibile");
        let data = await res.json();
        count = data.count;
    } catch (err) {
        console.error("Errore durante la chiamata API: ", err);
        return ctx.answerCallbackQuery({ 
            text: "❌ Database non raggiungibile",
            show_alert: true 
        });
    }

    try {
        const res = await fetch(API_POKEMON + "?limit=" + count);
        if (!res.ok) throw new Error("Pokemon non trovato nella lista");
        let data = await res.json();
        return data.results.filter(p => p.name.includes(pokemon.toLowerCase()));
    } catch (err) {
        console.error("Pokemon non trovato nella lista", err);
        return ctx.answerCallbackQuery({ 
            text: "❌ Pokemon non trovato nella lista",
            show_alert: true 
        });
    }
}
