class Raid {
    #id;
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
    
    constructor ({id, pokemon, gym, lat, lon, start, end, notes, creator}) {
        this.#id = id;
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