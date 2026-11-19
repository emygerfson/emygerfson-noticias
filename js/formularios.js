
const API_URL = window.API_URL;

document.addEventListener("DOMContentLoaded", () => {
    const anoAtual = document.getElementById("anoAtual");

    if (anoAtual) {
        anoAtual.textContent = new Date().getFullYear();
    }

    configurarFormularioComunidade();
    configurarFormularioContato();
});

// Formulário da página Comunidade
function configurarFormularioComunidade() {
    const formulario = document.getElementById("formComunidade");

    if (!formulario) return;

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const botao = formulario.querySelector('button[type="submit"]');
        const retorno = document.getElementById("retornoComunidade");

        const dados = {
            nome: document.getElementById("nomeComunidade").value.trim(),
            bairro: document.getElementById("bairroComunidade").value.trim(),
            tipo: "comunidade",
            assunto: document.getElementById("tipoComunidade").value,
            mensagem: document.getElementById("textoComunidade").value.trim(),
            consentimento: document.getElementById("aceiteComunidade").checked
        };

        await enviarFormulario(formulario, botao, retorno, dados);
    });
}

// Formulário da página Contato
function configurarFormularioContato() {
    const formulario = document.getElementById("formContato");

    if (!formulario) return;

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const botao = formulario.querySelector('button[type="submit"]');
        const retorno = document.getElementById("retornoContato");

        const dados = {
            nome: document.getElementById("nomeContato").value.trim(),
            email: document.getElementById("emailContato").value.trim(),
            tipo: "contato",
            assunto: document.getElementById("assuntoContato").value,
            mensagem: document.getElementById("mensagemContato").value.trim(),
            consentimento: document.getElementById("aceiteContato").checked
        };

        await enviarFormulario(formulario, botao, retorno, dados);
    });
}

// Função compartilhada para enviar os dados à API
async function enviarFormulario(formulario, botao, retorno, dados) {
    if (!formulario.reportValidity()) return;

    botao.disabled = true;
    botao.textContent = "Enviando...";
    retorno.textContent = "Enviando sua mensagem...";

    try {
        const resposta = await fetch(`${API_URL}/mensagens`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem || "Não foi possível enviar sua mensagem."
            );
        }

        retorno.textContent = "Mensagem enviada com sucesso! Obrigado pela participação.";
        formulario.reset();

    } catch (erro) {
        console.error("Erro ao enviar formulário:", erro);

        retorno.textContent =
            erro.message || "Erro de conexão. Tente novamente.";

    } finally {
        botao.disabled = false;
        botao.textContent = formulario.id === "formComunidade"
            ? "Enviar contribuição"
            : "Enviar mensagem";
    }
}
