const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dbPath = path.join(__dirname, "db.json");

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// GERAR ID SEQUENCIAL
function generateId(items) {
    const ids = items.map(item => item.id);

    let id = 1;

    while (ids.includes(id)) {
        id++;
    }

    return id;
}

//
// ========================
// GET POKEMONS (FILTER + ID)
// ========================
app.get("/api/pokemons", (req, res) => {
    const db = readDB();
    let result = db.pokemons;

    const { id, name, attack, defense, speed } = req.query;

    // filtro por ID
    if (id !== undefined) {
        result = result.filter(p =>
            Number(p.id) === Number(id)
        );
        return res.json(result);
    }

    // filtro por nome
    if (name !== undefined) {
        result = result.filter(p =>
            p.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    // filtro por attack
    if (attack !== undefined) {
        result = result.filter(p =>
            Number(p.attack) >= Number(attack)
        );
    }

    // filtro por defense
    if (defense !== undefined) {
        result = result.filter(p =>
            Number(p.defense) >= Number(defense)
        );
    }

    // filtro por speed
    if (speed !== undefined) {
        result = result.filter(p =>
            Number(p.speed) >= Number(speed)
        );
    }

    res.json(result);
});

//
// ========================
// CALCULAR SCORE
// ========================
app.post("/api/calculate", (req, res) => {
    const db = readDB();
    const team = req.body.team;

    let score = 0;

    team.forEach(p => {
        const pokemon = db.pokemons.find(x => x.name === p.name);
        if (pokemon) {
            score += pokemon.attack + pokemon.defense + pokemon.speed;
        }
    });

    res.json({ score });
});

//
// ========================
// SALVAR TIME
// ========================
app.post("/api/save-team", (req, res) => {
    const db = readDB();

    const { name, team } = req.body;

    // validação básica
    if (!name || !team || !Array.isArray(team)) {
        return res.status(400).json({
            error: "name e team (array) são obrigatórios"
        });
    }

    // recalcula score baseado no DB (fonte confiável)
    let score = 0;

    team.forEach(p => {
        const pokemon = db.pokemons.find(x => x.name === p.name);

        if (pokemon) {
            score += pokemon.attack + pokemon.defense + pokemon.speed;
        }
    });

    const newTeam = {
        id: generateId(db.teams),
        name,
        team,   // 🔥 mantém Pokémon completo (img + stats)
        score
    };

    db.teams.push(newTeam);
    writeDB(db);

    return res.status(201).json(newTeam);
});

//
// ========================
// DELETE TIME
// ========================
app.delete("/api/teams/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    const teamIndex = db.teams.findIndex(t => t.id === id);

    if (teamIndex === -1) {
        return res.status(404).json({
            ok: false,
            error: "Time não encontrado"
        });
    }

    db.teams.splice(teamIndex, 1);

    writeDB(db);

    return res.json({ ok: true });
});

//
// ========================
// GET TEAMS (FILTER + ID)
// ========================
app.get("/api/teams", (req, res) => {
    const db = readDB();
    let result = db.teams;

    const { id, name, minScore, maxScore, pokemon } = req.query;

    // filtro por ID (prioridade máxima)
    if (id !== undefined) {
        result = result.filter(t =>
            Number(t.id) === Number(id)
        );

        return res.json(result);
    }

    // filtro por nome
    if (name !== undefined) {
        result = result.filter(t =>
            t.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    // score mínimo
    if (minScore !== undefined) {
        result = result.filter(t =>
            Number(t.score) >= Number(minScore)
        );
    }

    // score máximo
    if (maxScore !== undefined) {
        result = result.filter(t =>
            Number(t.score) <= Number(maxScore)
        );
    }

    // filtro por pokémon dentro do time
    if (pokemon !== undefined) {
        result = result.filter(t =>
            t.team.some(p =>
                p.name.toLowerCase().includes(pokemon.toLowerCase())
            )
        );
    }

    res.json(result);
});

//
// ========================
// PATCH TEAM
// ========================
app.patch("/api/teams/:id", (req, res) => {
    const db = readDB();

    const id = Number(req.params.id);

    const teamIndex = db.teams.findIndex(t => t.id === id);

    // time não encontrado
    if (teamIndex === -1) {
        return res.status(404).json({
            error: "Time não encontrado"
        });
    }

    const currentTeam = db.teams[teamIndex];

    // atualiza nome se vier
    if (req.body.name !== undefined) {
        currentTeam.name = req.body.name;
    }

    // atualiza team se vier
    if (req.body.team !== undefined) {
        currentTeam.team = req.body.team;

        // recalcula score
        let score = 0;

        currentTeam.team.forEach(p => {
            const pokemon = db.pokemons.find(x => x.name === p.name);

            if (pokemon) {
                score += pokemon.attack + pokemon.defense + pokemon.speed;
            }
        });

        currentTeam.score = score;
    }

    db.teams[teamIndex] = currentTeam;

    writeDB(db);

    res.json(currentTeam);
});

//
// ========================
app.listen(3000, () => {
    console.log("Rodando em http://localhost:3000");
});