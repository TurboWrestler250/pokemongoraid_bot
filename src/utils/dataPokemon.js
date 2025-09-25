const API_POKEMON = "https://pokeapi.co/api/v2/pokemon/";

export async function dataPokemon(pokemon) {
    const res = await fetch(API_POKEMON + pokemon.toLowerCase());
    if (!res.ok) throw new Error("Pokémon non trovato");
    const dataPokemon = await res.json();
    return dataPokemon;
}