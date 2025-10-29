export async function dataPokemon(pokemon) {
    if (pokemon === "shaymin") pokemon = "shaymin-land";
    if (pokemon === "deoxys") pokemon = "deoxys-normal";
    if (pokemon === "giratina") pokemon = "giratina-altered";

    try {
        const API_POKEMON = "https://pokeapi.co/api/v2/pokemon/";
        const res = await fetch(API_POKEMON + pokemon.toLowerCase());
        if (!res.ok) throw new Error("Pokémon non trovato");
        const dataPokemon = await res.json();
        return dataPokemon;
    } catch (err) {
        console.error("Errore durante la chiamata API per numero di pokedex: ", err);
        return ctx.answerCallbackQuery({ 
            text: "❌ Pokémon non trovato nel database", 
            show_alert: true 
        });
    }
}
