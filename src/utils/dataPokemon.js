export async function dataPokemon(pokemon) {
    const API_POKEMON = "https://pokeapi.co/api/v2/pokemon/";
    const flag = true;
    let count;
    // Cerca la lista di tutti i pokemon con le loro varie forme
    try {
        const res = await fetch(API_POKEMON + "?limit=1");
        console.assert(flag, typeof(res), "fetch:", res);
        if (!res.ok) throw new Error("PokeAPI non raggiungibile");
        let data = await res.json();
        console.assert(flag, typeof(data), "data-json:", data);
        count = data.count;
    } catch (err) {
        console.error("Errore durante la chiamata API: ", err);
        throw new Error('PokeAPI non raggiungibile', err);
    }

    // Cerco nella lista la corrispondenza del pokemon
    try {
        const res = await fetch(API_POKEMON + "?limit=" + count);
        if (!res.ok) throw new Error("Pokemon non trovato nella lista");
        const data = await res.json();

        const pkm = data.results.filter(p => p.name.includes(pokemon.toLowerCase()))

        console.assert(flag, "pkm: ", typeof(pkm), pkm);
        console.assert(flag, "pkm[0]: ", typeof(pkm[0]), pkm[0]);
        console.assert(flag, "pkm[0].name: ", typeof(pkm[0].name), pkm[0].name);

        if (!pkm || pkm.length === 0) {
            throw new Error('Pokemon non trovato nella lista');
        }

        return pkm.map(p => ({ name: p.name, url: p.url }));

        // // Se c'è un solo risultato, ritorna i dati completi (fetch al dettaglio)
        // if (pkm.length === 1) {
        //     try {
        //         const detailRes = await fetch(API_POKEMON + pkm[0].name);
        //         if (!detailRes.ok) throw new Error('Dettagli Pokemon non disponibili');
        //         const detail = await detailRes.json();
        //         return [{ id: detail.id, name: detail.name }];
        //     } catch (err) {
        //         console.error('Errore fetching dettaglio Pokemon', err);
        //         throw new Error('Dettagli Pokemon non disponibili');
        //     }
        // }

        // // Più risultati: ritorna lista di opzioni (solo name e url)
        // if (pkm.length > 1) {
        //     // posso fare anche pkm.map(p => p) perché ci sono solo name e url nell'oggetto
        //     return pkm.map(p => ({ name: p.name, url: p.url }));
        // }
    } catch (err) {
        console.error("Errore nella ricerca Pokemon", err);
        throw err;
    }
}