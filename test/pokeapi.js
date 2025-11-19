const pokemon = "Deoxys";
const API_POKEMON = "https://pokeapi.co/api/v2/pokemon/";
let count;
const flag = true;
try {
    const res = await fetch(API_POKEMON + "?limit=1");
    // console.log(typeof(res), "fetch:", res);
    if (!res.ok) throw new Error("PokeAPI non raggiungibile");
    let data = await res.json();
    console.assert(flag, typeof(data), "data-json:", data);
    count = data.count;
} catch (err) {
    console.error("Errore durante la chiamata API: ", err);
    throw new Error('PokeAPI non raggiungibile', err);
}

try {
    const res = await fetch(API_POKEMON + "?limit=" + count);
    if (!res.ok) throw new Error("Pokemon non trovato nella lista");
    const data = await res.json();

    const pkm = data.results.filter(p => p.name.includes(pokemon.toLowerCase()))

    console.assert(flag, "pkm: ", typeof(pkm), pkm);
    console.assert(flag, "lunghezza pkm: ", typeof(pkm), pkm.length);
    console.assert(flag, "pkm[0]: ", typeof(pkm[0]), pkm[0]);
    console.assert(flag, "pkm[0].name: ", typeof(pkm[0].name), pkm[0].name);

    if (!pkm || pkm.length === 0) {
        throw new Error('Pokemon non trovato nella lista');
    }

    // Se c'è un solo risultato, ritorna i dati completi (fetch al dettaglio)
    if (pkm.length === 1) {
        try {
            const detailRes = await fetch(API_POKEMON + pkm[0].name);
            if (!detailRes.ok) throw new Error('Dettagli Pokemon non disponibili');
            const detail = await detailRes.json();
            console.assert(flag, "dettagli pokemon:", { id: detail.id, name: detail.name });
        } catch (err) {
            console.error('Errore fetching dettaglio Pokemon', err);
            throw new Error('Dettagli Pokemon non disponibili');
        }
    }

    // Più risultati: ritorna lista di opzioni (solo name e url)
    if (pkm.length > 1) {
        // posso fare anche pkm.map(p => p) perché ci sono solo name e url nell'oggetto
        console.assert(flag, "pkm map name-url: ", pkm.map(p => ({ name: p.name, url: p.url })));
    }
        
} catch (err) {
    console.error("Errore nella ricerca Pokemon", err);
    throw err;
}