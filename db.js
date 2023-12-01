import { openDB } from "idb";

let db;

async function criarDB() {
    try {
        db = await openDB('escola', 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion === 0) {
                    const store = db.createObjectStore('escola', {
                        keyPath: 'nomeEscola'
                    });
                    store.createIndex('id', 'nomeEscola');
                    console.log("Banco de dados criado!");
                }
            }
        });
        console.log("Banco de dados aberto!");
    } catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event => {
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarEscola);
    document.getElementById('btnCarregar').addEventListener('click', listarEscola);
    document.getElementById('btnBuscar').addEventListener('click', buscarEscola);
});

async function adicionarEscola() {
    let nomeEscola = document.getElementById("nomeEscola").value;
    let endereco = document.getElementById("endereco").value;
    let latitude = document.getElementById("latitude").value;
    let longitude = document.getElementById("longitude").value;

    if (!nomeEscola || !endereco ||! latitude ||!longitude ) {
        console.log('Preencha todos os campos obrigatórios.');
        return;
    }
    if (!latitude || !longitude) {
        console.log('Preencha os campos de latitude e longitude.');
        return;
    }
    const tx = await db.transaction('escola', 'readwrite');
    const store = tx.objectStore('escola');
    
    try {
        await store.add({
            nomeEscola: nomeEscola,
            endereco: endereco,
            latitude: latitude, 
            longitude: longitude 
        });
        await tx.done;
        limparCampos();
        exibirNoMapa(parseFloat(latitude), parseFloat(longitude));
        console.log('Escola cadastrada com sucesso!');
    } catch (error) {
        console.error('Erro ao cadastrar Escola:', error);
        tx.abort();
    }
}
function exibirNoMapa(latitude, longitude) {
    if (isNaN(latitude) || isNaN(longitude)) {
        console.error('Coordenadas inválidas.');
        return;
    }

    const myLatlng = new google.maps.LatLng(latitude, longitude);
    const mapOptions = {
        zoom: 10,
        center: myLatlng,
    };

    const map = new google.maps.Map(document.getElementById('map'), mapOptions);

    const marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Local da Escola',
    });
    document.getElementById('map').style.display = 'block';
}

async function listarEscola() {
    if (db === undefined) {
        console.log("O banco de dados está fechado.");
    }

    const tx = await db.transaction('escola', 'readonly');
    const store = await tx.objectStore('escola');
    const escolas = await store.getAll();

    if (escolas) {
        const divLista = escolas.map(escola => {
            return `<div class="item">
                    <p>Nome da Escola: ${escola.nomeEscola}</p>
                    <p>País: ${escola.endereco}</p>
                    <button class="btnMostrarMapa" data-latitude="${escola.latitude}" data-longitude="${escola.longitude}">Mostrar Mapa</button>
                    </div>`;
        });
        listagem(divLista.join(' '));
        document.querySelectorAll('.btnMostrarMapa').forEach(button => {
            button.addEventListener('click', function () {
              const latitude = parseFloat(this.getAttribute('data-latitude'));
              const longitude = parseFloat(this.getAttribute('data-longitude'));
              exibirNoMapa(latitude, longitude);
            });
        });
      }
    }

function limparCampos() {
    document.getElementById("nomeEscola").value = '';
    document.getElementById("endereco").value = '';
    document.getElementById("longitude").value = '';
    document.getElementById("latitude").value = '';
}

async function buscarEscola() {
    const nomeEscola = document.getElementById('inputBuscar').value;
    if (!nomeEscola) {
        console.log('Nome da escola não fornecido para busca.');
        return;
    }

    const tx = await db.transaction('escola', 'readonly');
    const store = tx.objectStore('escola');
    const index = store.index('id');

    try {
        const nomeEscolaBusca = await index.get(nomeEscolaBusca);
        if (nomeEscolaBusca) {
            const divEscola = `<div class="item">
                <p>Nome da Escola: ${nomeEscolaBusca.nomeEscola}</p>
                <p>Endereço: ${nomeEscolaBusca.enderecoEscola}</p>
            </div>`;
            listagem(divEscola);
        } else {
            console.log(`Escola com o nome '${nomeEscolaBusca}' não encontrada.`);
            listagem(''); 
        }
    } catch (error) {
        console.error('Erro ao buscar Escola:', error);
    }
}

function listagem(text) {
    document.getElementById('resultados').innerHTML = text;
}