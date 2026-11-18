
// const API_URL = "http://127.0.0.1:3333/api";
const API_URL = "https://ep-royal-recipe-b60f6bbv.apirest.c-2.sa-east-1.aws.neon.tech/neondb/rest/v1";

const formulario = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");
const botao = document.getElementById("loginButton");

document.getElementById("ano").textContent =
    new Date().getFullYear();

// Verifica se já existe uma sessão ativa.
async function verificarSessao() {
    try {
        const resposta = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        });

        if (resposta.ok) {
            window.location.href = "./admin.html";
        }
    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
    }
}

// Executa a verificação ao abrir a página.
verificarSessao();

// Evento de envio do formulário.
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagem.textContent = "";
    mensagem.className = "message";

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
        const resposta = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem || "Não foi possível realizar o login."
            );
        }

        mensagem.textContent = "Login realizado! Redirecionando...";
        mensagem.classList.add("success");

        // Aguarda a resposta do servidor antes de redirecionar.
        window.location.href = "./admin.html";

    } catch (erro) {
        mensagem.textContent = erro.message;
        mensagem.classList.add("error");

        botao.disabled = false;
        botao.textContent = "Entrar no painel";
    }
});
