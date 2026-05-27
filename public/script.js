let pokemons = [];
let team = [];

async function loadPokemons() {
    const res = await fetch("/api/pokemons");
    pokemons = await res.json();
}

window.onload = loadPokemons;

// AUTOCOMPLETE
function autoComplete() {
    const input = document.getElementById("pokemonInput").value.toLowerCase();
    const box = document.getElementById("suggestions");

    box.innerHTML = "";

    if (!input) return;

    const filtered = pokemons.filter(p =>
        p.name.toLowerCase().includes(input)
    );

    filtered.slice(0, 5).forEach(p => {
        const div = document.createElement("div");
        div.textContent = p.name;

        div.onclick = () => {
            document.getElementById("pokemonInput").value = p.name;
            box.innerHTML = "";
        };

        box.appendChild(div);
    });
}

// ADD POKEMON
function addPokemon() {

    const name = document.getElementById("pokemonInput").value;

    const pokemon = pokemons.find(p => p.name === name);

    // não encontrado
    if (!pokemon) {
        showPopup("Erro", "Pokémon não encontrado!");
        return;
    }

    // time cheio
    if (team.length >= 6) {
        showPopup("Erro", "Seu time já possui 6 pokémons!");
        return;
    }

    // adiciona no time
    team.push(pokemon);

    renderTeam();

    // limpa input
    document.getElementById("pokemonInput").value = "";

    // limpa autocomplete
    document.getElementById("suggestions").innerHTML = "";
}

// RENDER TEAM
function renderTeam() {
    const div = document.getElementById("team");
    div.innerHTML = "";

    team.forEach((p, i) => {
        const card = document.createElement("div");
        card.className = "pokemon-card";

        card.innerHTML = `
            <img src="${p.img}">
            <span>${p.name}</span>
            <button onclick="removePokemon(${i})">X</button>
        `;

        div.appendChild(card);
    });
}

function removePokemon(i) {
    team.splice(i, 1);
    renderTeam();
}

// SCORE
async function calculateTeam() {
    const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team })
    });

    const data = await res.json();
    document.getElementById("score").innerText = "Score: " + data.score;
}

// SALVAR TIME
async function saveTeam() {

    showPopup(
        "Salvar Time",
        "Digite o nome do time:",
        true,

        async (name) => {

            if (!name) return;

            const res = await fetch("/api/calculate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ team })
            });

            const data = await res.json();

            await fetch("/api/save-team", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    team,
                    score: data.score
                })
            });

            showPopup("Sucesso", "Time salvo com sucesso!");

            loadTeams();
        }
    );
}

// LISTAR TIMES
async function loadTeams() {
    const res = await fetch("/api/teams");
    const teams = await res.json();

    const div = document.getElementById("savedTeams");
    div.innerHTML = "";

    teams.forEach(t => {

        const el = document.createElement("div");
        el.className = "saved-team";

        // nome do time
        const name = document.createElement("span");
        name.textContent = `⚡ ${t.name} (${t.team.length})`;

        name.onclick = () => openTeamModal(t);

        // botão remover
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "🗑";
        removeBtn.className = "delete-btn";

        removeBtn.onclick = async (e) => {
            e.stopPropagation();

            await fetch(`/api/teams/${t.id}`, {
                method: "DELETE"
            });

            loadTeams();
        };

        el.appendChild(name);
        el.appendChild(removeBtn);

        div.appendChild(el);
    });
}

// MODAL
function openTeamModal(teamData) {
    document.getElementById("modal").classList.remove("hidden");

    document.getElementById("modalTitle").textContent = teamData.name;
    document.getElementById("modalScore").textContent = "Score: " + teamData.score;

    const box = document.getElementById("modalPokemons");
    box.innerHTML = "";

    teamData.team.forEach(p => {
        const div = document.createElement("div");
        div.className = "modal-pokemon";

        div.innerHTML = `
            <img src="${p.img}">
            <span>${p.name}</span>
        `;

        box.appendChild(div);
    });
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

loadTeams();

// POPUP CUSTOM

function showPopup(title, message, showInput = false, callback = null) {

    const popup = document.getElementById("customPopup");

    popup.classList.remove("hidden");

    document.getElementById("popupTitle").innerText = title;
    document.getElementById("popupMessage").innerText = message;

    const input = document.getElementById("popupInput");

    if (showInput) {
        input.classList.remove("hidden");
        input.value = "";
    } else {
        input.classList.add("hidden");
    }

    const confirmBtn = document.getElementById("popupConfirm");

    confirmBtn.onclick = () => {

        const value = input.value;

        popup.classList.add("hidden");

        if (callback) {
            callback(value);
        }
    };
}

function closePopup() {
    document.getElementById("customPopup")
        .classList.add("hidden");
}