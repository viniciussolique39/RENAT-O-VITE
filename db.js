import { openDB } from "idb";
// criando o db
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
//criando evento para colocar dados no db apos clicar no botao de cadastrar
//e no botao de listar os dados aparecem no html
window.addEventListener('DOMContentLoaded', async event => {
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarEscola);
    document.getElementById('btnCarregar').addEventListener('click', listarEscola);

});
//função adicionarEscola é a função que vai cadastrar as escolas ou seja, ela ira pegar os dados do formulario e ira colocar
//todos eles no db
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




//essa função exibir mapa ainda não está funcionando corretamente!
function exibirNoMapa(latitude, longitude) {
    if (isNaN(latitude) || isNaN(longitude)) {
        console.error('Coordenadas inválidas.');
        return;
    }

    const capturarLocalizacao = document.getElementById('localizacao');
const map = document.getElementById('mapa')


const sucesso = () => {
  let lat, lon;
  lat =   document.getElementById('latitude').value;
  lon =  document.getElementById('longitude').value;

  map.src = `http://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`
};

const erro = (error) => {
    let errorMessage;
    switch(error.code){
      case 0:
        errorMessage = "Erro desconhecido"
      break;
      case 1:
        errorMessage = "Permissão negada!"
      break;
      case 2:
        errorMessage = "Captura de posição indisponível!"
      break;
      case 3:
        errorMessage = "Tempo de solicitação excedido!"
      break;
    }
    console.log('Ocorreu um erro: ' + errorMessage);
  };
  
  capturarLocalizacao.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(sucesso, erro);
  });
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
                    <p>Escola: ${escola.endereco}</p>
                    <button class="btnMostrarMapa" 
                    style="width: 100px; height: 30px; border-radius: 10px; margin-top: 10px; background: #002bff; color: #000000;"
                    data-latitude="${escola.latitude}" data-longitude="${escola.longitude}">Mostrar Mapa</button>
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

function listagem(text) {
    document.getElementById('resultados').innerHTML = text;
}