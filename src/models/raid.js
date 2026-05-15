class Raid {
    #id;
    #id_messagge;
    #pokemon;
    #gym;
    #latitudine;
    #longitudine;
    #time_start;
    #time_end;
    #players;
    #notes;
    #creator_first_name;
    #created_at;
    #updated_at;
    
    constructor ({pokemon, gym, lat, lon, start, end, notes, creator}) {
        this.#id = Math.floor(Math.random()*1000000);
        this.#id_messagge = 0;
        this.#pokemon = pokemon;
        this.#gym = gym;
        this.#latitudine = typeof lat === 'number' ? lat : parseFloat(lat);
        this.#longitudine = typeof lat === 'number' ? lat : parseFloat(lon);
        this.#time_start = start;
        this.#time_end = end;
        this.#players = [];
        this.#notes = notes;
        this.#creator_first_name = creator;
        this.#created_at = new Date().toLocaleString();
        this.#updated_at = new Date().toLocaleString();
    }

    getId() { return this.#id; }
    getIdMessagge() { return this.#id_messagge; }
    getPokemon() { return this.#pokemon; }
    getGym() { return this.#gym; }
    getCoordinates() { return [this.#latitudine, this.#longitudine]; }
    getLatitudine() { return this.#latitudine; }
    getLongitudine() { return this.#longitudine; }
    getTimeStart() { return this.#time_start; }
    getTimeEnd() { return this.#time_end; }
    getPlayers() { return this.#players; }
    getNotes() { return this.#notes; }
    getCreator() { return this.#creator_first_name; }

    setPokemon(name) {
        this.#pokemon = name;
        this.#updated_at = new Date().toLocaleString();
    }

    toJSON() {
        return {
            id: this.#id,
            id_message: this.#id_messagge,
            pokemon: this.#pokemon,
            gym: this.#gym,
            coordinates: [this.#latitudine, this.#longitudine],
            latitudine: this.#latitudine,
            longitudine: this.#longitudine,
            time_start: this.#time_start,
            time_end: this.#time_end,
            players: this.#players,
            notes: this.#notes,
            creator_first_name: this.#creator_first_name,
            created_at: this.#created_at,
            updated_at: this.#updated_at
        };
    }

    setIdMessagge(id) { this.#id_messagge = id; }

    addPlayer(player) {
        this.#players.push(player);
        this.#updated_at = new Date().toLocaleString();
    }

    removePlayer(userId) {
        this.#players = this.#players.filter(p => p.userId !== userId);
        this.#updated_at = new Date().toLocaleString();
    }

    updatePlayer(userId, updates) {
        const player = this.#players.find(p => p.userId === userId);
        if (player) {
            Object.assign(player, updates);
            this.#updated_at = new Date().toLocaleString();
        }
    }

    findPlayer(userId) {
        return this.#players.find(p => p.userId === userId);
    }
}

export default Raid;