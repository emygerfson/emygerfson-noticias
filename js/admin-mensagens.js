
const API_URL = "http://127.0.0.1:3333/api";

let mensagens = [];
let mensagemSelecionada = null;

document.addEventListener("DOMContentLoaded", iniciarPainel);

async function iniciarPainel() {
    await verificarAutenticacao();
    configurarEventos();
    await carregarMensagens();
}

// Verifica se o administrador está autenticado
async function verificarAutenticacao() {
    try {
        const resposta = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        });

        if (resposta.status === 401) {
            window.location.href = "./admin-login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível verificar a sessão.");
        }

        const dados = await resposta.json();
        const administrador = dados.admin || dados.usuario || dados;

        document.getElementById("nomeUsuario").textContent =
            administrador.nome || administrador.email || "Administrador";

    } catch (erro) {
        console.error("Erro de autenticação:", erro);
        document.getElementById("estadoMensagens").textContent =
            "Não foi possível verificar sua sessão. Atualize a página.";
    }
}

// Configura os eventos da tela
function configurarEventos() {
    document.getElementById("filtroStatus")
        .addEventListener("change", renderizarMensagens);

    document.getElementById("logoutButton")
        .addEventListener("click", fazerLogout);
}

// Carrega as mensagens da API
async function carregarMensagens() {
    const estado = document.getElementById("estadoMensagens");

    estado.textContent = "Carregando mensagens...";

    try {
        const resposta = await fetch(`${API_URL}/admin/mensagens`, {
            credentials: "include"
        });

        if (resposta.status === 401) {
            window.location.href = "./admin-login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as mensagens.");
        }

        const dados = await resposta.json();

        mensagens = dados.mensagens || [];

        atualizarResumo();
        renderizarMensagens();

    } catch (erro) {
        console.error("Erro ao carregar mensagens:", erro);
        estado.textContent =
            "Erro ao carregar mensagens. Tente atualizar a página.";
    }
}

// Atualiza os cartões de resumo
function atualizarResumo() {
    document.getElementById("totalMensagens").textContent =
        mensagens.length;

    document.getElementById("totalNovas").textContent =
        mensagens.filter(m => m.status === "nova").length;

    document.getElementById("totalAnalise").textContent =
        mensagens.filter(m => m.status === "em_analise").length;

    document.getElementById("totalRespondidas").textContent =
        mensagens.filter(m => m.status === "respondida").length;
}

// Mostra as mensagens na lista
function renderizarMensagens() {
    const lista = document.getElementById("listaMensagens");
    const estado = document.getElementById("estadoMensagens");
    const filtro = document.getElementById("filtroStatus").value;

    lista.replaceChildren();

    const filtradas = filtro === "todos"
        ? mensagens
        : mensagens.filter(m => m.status === filtro);

    if (filtradas.length === 0) {
        estado.textContent = "Nenhuma mensagem encontrada.";
        return;
    }

    estado.textContent = `${filtradas.length} mensagem(ns) encontrada(s).`;

    filtradas.forEach(mensagem => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "mensagem-item";

        if (mensagemSelecionada?.id === mensagem.id) {
            card.classList.add("selecionada");
        }

        const topo = document.createElement("div");
        topo.className = "mensagem-item-topo";

        const nome = document.createElement("strong");
        nome.textContent = mensagem.nome;

        const status = document.createElement("span");
        status.className = `status-mensagem status-${mensagem.status}`;
        status.textContent = formatarStatus(mensagem.status);

        const assunto = document.createElement("p");
        assunto.textContent = mensagem.assunto || "Sem assunto";

        const tipo = document.createElement("small");
        tipo.textContent = mensagem.tipo === "comunidade"
            ? "Comunidade"
            : "Contato";

        const data = document.createElement("small");
        data.textContent = formatarData(mensagem.criado_em);

        topo.append(nome, status);
        card.append(topo, assunto, tipo, data);

        card.addEventListener("click", () => {
            abrirDetalhes(mensagem);
            renderizarMensagens();
        });

        lista.appendChild(card);
    });
}

// Abre os detalhes da mensagem selecionada
function abrirDetalhes(mensagem) {
    mensagemSelecionada = mensagem;

    const painel = document.getElementById("painelDetalhes");
    painel.replaceChildren();

    const titulo = document.createElement("h2");
    titulo.textContent = "Detalhes da mensagem";

    const criarCampo = (rotulo, valor) => {
        const grupo = document.createElement("div");
        grupo.className = "detalhe-campo";

        const label = document.createElement("strong");
        label.textContent = rotulo;

        const texto = document.createElement("p");
        texto.textContent = valor || "Não informado";

        grupo.append(label, texto);
        return grupo;
    };

    painel.append(
        titulo,
        criarCampo("Nome", mensagem.nome),
        criarCampo("E-mail", mensagem.email),
        criarCampo("Telefone", mensagem.telefone),
        criarCampo("Bairro", mensagem.bairro),
        criarCampo("Origem", mensagem.tipo === "comunidade"
            ? "Comunidade"
            : "Contato"),
        criarCampo("Assunto", mensagem.assunto),
        criarCampo("Data de recebimento", formatarData(mensagem.criado_em)),
        criarCampo("Mensagem", mensagem.mensagem)
    );

    const grupoStatus = document.createElement("div");
    grupoStatus.className = "detalhe-campo";

    const labelStatus = document.createElement("label");
    labelStatus.textContent = "Situação da mensagem";
    labelStatus.htmlFor = "novoStatus";

    const select = document.createElement("select");
    select.id = "novoStatus";

    const opcoes = [
        { valor: "nova", texto: "Nova" },
        { valor: "em_analise", texto: "Em análise" },
        { valor: "respondida", texto: "Respondida" },
        { valor: "arquivada", texto: "Arquivada" }
    ];

    opcoes.forEach(opcao => {
        const option = document.createElement("option");
        option.value = opcao.valor;
        option.textContent = opcao.texto;
        select.appendChild(option);
    });

    select.value = mensagem.status;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-status";
    botao.textContent = "Salvar alteração";
    botao.addEventListener("click", atualizarStatus);

    grupoStatus.append(labelStatus, select, botao);
    painel.appendChild(grupoStatus);
}

// Atualiza o status no banco de dados
async function atualizarStatus() {
    if (!mensagemSelecionada) return;

    const novoStatus = document.getElementById("novoStatus").value;

    try {
        const resposta = await fetch(
            `${API_URL}/admin/mensagens/${mensagemSelecionada.id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ status: novoStatus })
            }
        );

        const resultado = await resposta.json();

        if (resposta.status === 401) {
            window.location.href = "./admin-login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || "Erro ao atualizar status.");
        }

        mensagemSelecionada.status = novoStatus;

        const indice = mensagens.findIndex(
            m => m.id === mensagemSelecionada.id
        );

        if (indice !== -1) {
            mensagens[indice].status = novoStatus;
        }

        atualizarResumo();
        renderizarMensagens();
        abrirDetalhes(mensagemSelecionada);

        alert("Status atualizado com sucesso!");

    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);
        alert(erro.message || "Não foi possível atualizar o status.");
    }
}

// Encerra a sessão do administrador
async function fazerLogout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (erro) {
        console.error("Erro ao sair:", erro);
    }

    window.location.href = "./admin-login.html";
}

function formatarStatus(status) {
    const nomes = {
        nova: "Nova",
        em_analise: "Em análise",
        respondida: "Respondida",
        arquivada: "Arquivada"
    };

    return nomes[status] || status;
}

function formatarData(data) {
    if (!data) return "Data não informada";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return "Data não informada";
    }

    return dataFormatada.toLocaleString("pt-BR");
}
