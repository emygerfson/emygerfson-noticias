
// const API_URL = "http://127.0.0.1:3333/api";

const API_URL = "https://ep-royal-recipe-b60f6bbv.apirest.c-2.sa-east-1.aws.neon.tech/neondb/rest/v1";

const nomeUsuario = document.getElementById("nomeUsuario");
const nomeBoasVindas = document.getElementById("nomeBoasVindas");
const logoutButton = document.getElementById("logoutButton");
const totalNoticias = document.getElementById("totalNoticias");
const noticiasPublicadas = document.getElementById("noticiasPublicadas");
const noticiasRascunho = document.getElementById("noticiasRascunho");
const noticiasRecentesDashboard = document.getElementById("noticiasRecentesDashboard");
const mensagemDashboard = document.getElementById("mensagemDashboard");
const atualizarDashboard = document.getElementById("atualizarDashboard");

// Verifica a sessão antes de exibir o painel.
async function carregarPainel() {
    try {
        const resposta = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        });

        if (resposta.status === 401) {
            window.location.href = "./admin-login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível verificar sua sessão.");
        }

        const dados = await resposta.json();

        nomeUsuario.textContent = dados.usuario.nome;
        nomeBoasVindas.textContent = dados.usuario.nome;

        await carregarEstatisticasNoticias();

    } catch (erro) {
        console.error(erro);

        mensagemDashboard.textContent =
            "Não foi possível carregar o painel. Verifique a conexão e tente novamente.";
    }
}

async function carregarEstatisticasNoticias() {
    mensagemDashboard.textContent = "Carregando notícias...";
    atualizarDashboard.disabled = true;
    totalNoticias.textContent = "--";
    noticiasPublicadas.textContent = "--";
    noticiasRascunho.textContent = "--";
    noticiasRecentesDashboard.replaceChildren();

    try {
        const resposta = await fetch(`${API_URL}/admin/noticias`, {
            credentials: "include"
        });

        if (resposta.status === 401) {
            window.location.href = "./admin-login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as notícias.");
        }

        const noticias = await resposta.json();

        totalNoticias.textContent = noticias.length;
        noticiasPublicadas.textContent =
            noticias.filter((noticia) => noticia.status === "publicada").length;
        noticiasRascunho.textContent =
            noticias.filter((noticia) => noticia.status === "rascunho").length;

        noticiasRecentesDashboard.replaceChildren();

        if (noticias.length === 0) {
            mensagemDashboard.textContent = "Nenhuma notícia cadastrada.";
            return;
        }

        mensagemDashboard.textContent = "";
        noticias.slice(0, 5).forEach((noticia) => {
            const item = document.createElement("li");
            const titulo = document.createElement("span");
            const status = document.createElement("span");

            titulo.textContent = noticia.titulo;
            status.textContent = noticia.status;
            item.append(titulo, status);
            noticiasRecentesDashboard.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao atualizar notícias do dashboard:", erro);
        mensagemDashboard.textContent =
            erro.message || "Não foi possível carregar as notícias.";
    } finally {
        atualizarDashboard.disabled = false;
    }
}

// Encerra a sessão.
logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Saindo...";

    try {
        const resposta = await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (!resposta.ok) {
            throw new Error("Não foi possível encerrar a sessão.");
        }

        window.location.href = "./admin-login.html";

    } catch (erro) {
        alert(erro.message);

        logoutButton.disabled = false;
        logoutButton.textContent = "Sair";
    }
});

atualizarDashboard.addEventListener("click", carregarPainel);
window.addEventListener("pageshow", carregarPainel);
