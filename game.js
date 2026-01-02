import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(30, 20, 30);

// --- ILUMINAÇÃO (DIA/NOITE) ---
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(50, 50, 20);
sun.castShadow = true;
scene.add(sun);
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// --- CENÁRIO REAL (NÃO BLOCOS) ---
const textureLoader = new THREE.TextureLoader();
const grass = textureLoader.load('https://threejs.org/examples/textures/grasslight-big.jpg');
grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
grass.repeat.set(20, 20);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ map: grass })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- LÓGICA DO REALITY ---
let peoes = [
    { nome: "Peão Alfa", naCasa: true, naBaia: false, votos: 0 },
    { nome: "Peão Beta", naCasa: true, naBaia: false, votos: 0 },
    { nome: "Peão Gamma", naCasa: true, naBaia: false, votos: 0 },
    { nome: "Peão Delta", naCasa: true, naBaia: false, votos: 0 },
    { nome: "Peão Epsilon", naCasa: true, naBaia: true, votos: 0 },
    { nome: "Peão Zeta", naCasa: true, naBaia: true, votos: 0 }
];

let paiol = ["Candidato 1", "Candidato 2", "Candidato 3"];
let fase = "CONVIVENCIA";
let selecionadoId = null;
let lampiao = null;
let fazendeiro = null;
let roca = [];

// --- FUNÇÕES DE UI ---
function msg(texto) {
    const log = document.getElementById('log-mensagens');
    log.innerHTML += `<div>> ${texto}</div>`;
    log.scrollTop = log.scrollHeight;
}

window.proximaEtapa = () => {
    document.getElementById('resultado-panel').style.display = 'none';
    processarCiclo();
};

window.confirmarVoto = () => {
    if(selecionadoId === null) return alert("Selecione alguém!");
    const alvo = document.querySelectorAll('.voto-item')[selecionadoId].innerText;
    
    if(fase === "PAIOL") {
        msg(`Você votou para ${alvo} entrar na casa!`);
        peoes.push({ nome: alvo, naCasa: true, naBaia: false, votos: 0 });
        document.getElementById('voto-panel').style.display = 'none';
        fimPaiol();
    } else if (fase === "ROCA_CASA") {
        msg(`Você votou em ${alvo} para a Roça!`);
        document.getElementById('voto-panel').style.display = 'none';
        iniciarPuxadaBaia();
    }
};

// --- CICLO DO JOGO ---
async function processarCiclo() {
    const status = document.getElementById('info-fase');
    
    if(fase === "CONVIVENCIA") {
        status.innerText = "Fase: Convivência e Paiol";
        abrirVotacao("PAIOL", paiol);
    } else if(fase === "PROVA_LAMPIAO") {
        status.innerText = "Fase: Prova do Lampião";
        const sorteados = peoes.slice(0, 3);
        lampiao = sorteados[Math.floor(Math.random()*3)];
        msg(`O vencedor do Lampião é: ${lampiao.nome}`);
        fase = "ROCA_FAZENDEIRO";
        setTimeout(processarCiclo, 3000);
    } else if(fase === "ROCA_FAZENDEIRO") {
        fazendeiro = peoes[Math.floor(Math.random()*peoes.length)];
        msg(`O Fazendeiro ${fazendeiro.nome} indicou alguém direto para a Roça!`);
        roca.push(peoes.filter(p => p !== fazendeiro)[0]);
        abrirVotacao("ROCA_CASA", peoes.filter(p => p !== fazendeiro && !roca.includes(p)));
    }
}

function abrirVotacao(tipo, lista) {
    fase = tipo;
    const painel = document.getElementById('voto-panel');
    const container = document.getElementById('lista-voto');
    container.innerHTML = "";
    painel.style.display = 'block';
    selecionadoId = null;

    lista.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = "voto-item";
        div.innerText = typeof item === 'string' ? item : item.nome;
        div.onclick = () => {
            document.querySelectorAll('.voto-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selecionadoId = idx;
        };
        container.appendChild(div);
    });
}

function fimPaiol() {
    msg("O Paiol acabou! Novos peões na sede.");
    fase = "PROVA_LAMPIAO";
    setTimeout(processarCiclo, 2000);
}

function iniciarPuxadaBaia() {
    msg("O mais votado puxou alguém da Baia!");
    const daBaia = peoes.find(p => p.naBaia);
    roca.push(daBaia);
    msg("Iniciando Resta Um...");
    setTimeout(fimRestaUm, 2000);
}

function fimRestaUm() {
    const sobrou = peoes[peoes.length-1];
    roca.push(sobrou);
    msg(`${sobrou.nome} sobrou no Resta Um e está na Roça!`);
    fase = "ELIMINACAO";
    
    const painel = document.getElementById('resultado-panel');
    const eliminado = roca[Math.floor(Math.random()*roca.length)];
    document.getElementById('res-texto').innerText = `Quem sai da Fazendix hoje é: ${eliminado.nome}`;
    document.getElementById('porcentagens').innerText = `Votos: ${Math.floor(Math.random()*20)}% contra ${Math.floor(Math.random()*80)}%`;
    painel.style.display = 'block';
    
    peoes = peoes.filter(p => p !== eliminado);
    roca = [];
    if(peoes.length <= 5) msg("ESTAMOS NA RETA FINAL! Eliminação Dupla em breve.");
}

// --- LOOP DE RENDERIZAÇÃO ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Iniciar
msg("Bem-vindo ao A Fazendix!");
processarCiclo();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
