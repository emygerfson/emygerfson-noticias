
const API_URL = window.API_URL;

const form = document.getElementById("formNoticia");
const listaNoticias = document.getElementById("listaNoticias");
const mensagemFormulario = document.getElementById("mensagemFormulario");

const noticiaId = document.getElementById("noticiaId");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");

const imagemArquivo = document.getElementById("imagemArquivo");
const previewImagem = document.getElementById("previewImagem");
const previewImagemContainer = document.getElementById("previewImagemContainer");

let imagemUrlAtual = null;
let imagemSelecionada = null;

// Inicializa o editor de conteúdo.
tinymce.init({
    selector: "#conteudo",
    license_key: "gpl",

    height: 500,
    menubar: false,
    branding: false,

    plugins: "lists link table code wordcount",

    toolbar:
        "undo redo | blocks | bold italic underline | " +
        "alignleft aligncenter alignright | " +
        "bullist numlist | link blockquote | table | removeformat",

    block_formats:
        "Parágrafo=p; Título 2=h2; Título 3=h3; Título 4=h4",

    content_style: `
        body {
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.7;
            color: #333;
        }

        h2 {
            font-size: 26px;
            margin-top: 28px;
            margin-bottom: 12px;
        }

        h3 {
            font-size: 21px;
            margin-top: 22px;
        }

        p {
            margin-bottom: 16px;
        }
    `
});

// Pré-visualiza a imagem escolhida
imagemArquivo.addEventListener("change", () => {
    const arquivo = imagemArquivo.files[0];

    imagemSelecionada = null;

    if (!arquivo) {
        previewImagemContainer.hidden = true;
        previewImagem.removeAttribute("src");
        return;
    }

    const formatosPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
        alert("Formato inválido. Escolha JPG, PNG ou WEBP.");
        imagemArquivo.value = "";
        previewImagemContainer.hidden = true;
        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5 MB.");
        imagemArquivo.value = "";
        previewImagemContainer.hidden = true;
        return;
    }

    imagemSelecionada = arquivo;

    const leitor = new FileReader();

    leitor.onload = (evento) => {
        previewImagem.src = evento.target.result;
        previewImagemContainer.hidden = false;
    };

    leitor.readAsDataURL(arquivo);
});

// Faz requisições mantendo o cookie de sessão
async function requisicao(url, opcoes = {}) {
    const headers = { ...opcoes.headers };

    if (!(opcoes.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const resposta = await fetch(`${API_URL}${url}`, {
        ...opcoes,
        credentials: "include",
        headers
    });

    if (resposta.status === 401) {
        window.location.href = "./admin-login.html";
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Ocorreu um erro.");
    }

    return dados;
}

// Verifica o administrador autenticado
async function verificarAdministrador() {
    try {
        const dados = await requisicao("/auth/me");

        document.getElementById("adminNome").textContent =
            dados.admin?.nome || dados.nome || "Administrador";

    } catch (erro) {
        console.error(erro);
    }
}

// Carrega as notícias cadastradas
async function carregarNoticias() {
    try {
        const noticias = await requisicao("/admin/noticias");

        listaNoticias.innerHTML = "";

        if (noticias.length === 0) {
            listaNoticias.innerHTML = "<p>Nenhuma notícia cadastrada.</p>";
            return;
        }

        noticias.forEach((noticia) => {
            const card = document.createElement("article");
            card.className = "noticia-admin-card";

            const titulo = document.createElement("h3");
            titulo.textContent = noticia.titulo;

            const categoria = document.createElement("p");
            categoria.textContent = `Categoria: ${noticia.categoria}`;

            const status = document.createElement("p");
            status.textContent = `Status: ${noticia.status}`;

            const autor = document.createElement("p");
            autor.textContent = `Autor: ${noticia.autor || "Administrador"}`;

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.type = "button";
            btnEditar.addEventListener("click", () => editarNoticia(noticia.id));

            const btnPublicar = document.createElement("button");
            btnPublicar.textContent =
                noticia.status === "publicada" ? "Voltar para rascunho" : "Publicar";

            btnPublicar.type = "button";
            btnPublicar.addEventListener("click", () => {
                alterarStatus(
                    noticia.id,
                    noticia.status === "publicada" ? "rascunho" : "publicada"
                );
            });

            const btnArquivar = document.createElement("button");
            btnArquivar.textContent = "Arquivar";
            btnArquivar.type = "button";
            btnArquivar.addEventListener("click", () => {
                alterarStatus(noticia.id, "arquivada");
            });

            card.append(
                titulo,
                categoria,
                status,
                autor,
                btnEditar,
                btnPublicar,
                btnArquivar
            );

            listaNoticias.appendChild(card);
        });

    } catch (erro) {
        listaNoticias.textContent = erro.message;
    }
}

// Cadastra ou atualiza uma notícia
form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = noticiaId.value;

    try {
        btnSalvar.disabled = true;
        mensagemFormulario.textContent = "Salvando...";

        const editorConteudo = tinymce.get("conteudo");

        if (!editorConteudo) {
            throw new Error("O editor do conteúdo não foi inicializado.");
        }

        const dados = {
            titulo: document.getElementById("titulo").value.trim(),
            resumo: document.getElementById("resumo").value.trim(),
            conteudo: editorConteudo.getContent().trim(),
            categoria: document.getElementById("categoria").value,
            imagem_url: imagemUrlAtual,
            fonte: document.getElementById("fonte").value.trim() || null,
            status: document.getElementById("status").value
        };

        const conteudoTexto = editorConteudo.getContent({ format: "text" }).trim();

        if (dados.titulo.length < 5) {
            throw new Error("O título precisa ter pelo menos 5 caracteres.");
        }

        if (dados.resumo.length < 10) {
            throw new Error("O resumo precisa ter pelo menos 10 caracteres.");
        }

        if (conteudoTexto.length < 10) {
            throw new Error("O conteúdo precisa ter pelo menos 10 caracteres.");
        }

        if (!dados.categoria) {
            throw new Error("Selecione uma categoria.");
        }

        if (imagemSelecionada) {
            const formularioImagem = new FormData();
            formularioImagem.append("imagem", imagemSelecionada);

            const resultadoUpload = await requisicao("/admin/noticias/imagem", {
                method: "POST",
                body: formularioImagem
            });

            dados.imagem_url = resultadoUpload.imagem_url;
        }

        if (id) {
            await requisicao(`/admin/noticias/${id}`, {
                method: "PUT",
                body: JSON.stringify(dados)
            });

            mensagemFormulario.textContent = "Notícia atualizada com sucesso!";
        } else {
            await requisicao("/admin/noticias", {
                method: "POST",
                body: JSON.stringify(dados)
            });

            mensagemFormulario.textContent = "Notícia cadastrada com sucesso!";
        }

        limparFormulario();
        await carregarNoticias();

    } catch (erro) {
        mensagemFormulario.textContent = erro.message;
    } finally {
        btnSalvar.disabled = false;
    }
});

// Busca uma notícia para edição
async function editarNoticia(id) {
    try {
        const noticia = await requisicao(`/admin/noticias/${id}`);

        noticiaId.value = noticia.id;
        document.getElementById("titulo").value = noticia.titulo;
        document.getElementById("resumo").value = noticia.resumo;
        tinymce.get("conteudo").setContent(noticia.conteudo);
        document.getElementById("categoria").value = noticia.categoria;
        imagemUrlAtual = noticia.imagem_url || null;
        imagemSelecionada = null;
        imagemArquivo.value = "";
        if (imagemUrlAtual) {
            const origemApi = API_URL.replace(/\/api$/, "");
            previewImagem.src = imagemUrlAtual.startsWith("/")
                ? `${origemApi}${imagemUrlAtual}`
                : imagemUrlAtual;
            previewImagemContainer.hidden = false;
        } else {
            previewImagem.removeAttribute("src");
            previewImagemContainer.hidden = true;
        }
        document.getElementById("fonte").value = noticia.fonte || "";
        document.getElementById("status").value = noticia.status;

        document.getElementById("formTitulo").textContent = "Editar notícia";
        btnSalvar.textContent = "Atualizar notícia";
        btnCancelar.hidden = false;

        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (erro) {
        alert(erro.message);
    }
}

// Altera o status de uma notícia
async function alterarStatus(id, status) {
    const confirmacao = confirm(
        `Deseja realmente alterar o status para "${status}"?`
    );

    if (!confirmacao) return;

    try {
        await requisicao(`/admin/noticias/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        await carregarNoticias();

    } catch (erro) {
        alert(erro.message);
    }
}

// Limpa o formulário
function limparFormulario() {
    form.reset();
    noticiaId.value = "";
    tinymce.get("conteudo").setContent("");
    imagemUrlAtual = null;
    imagemSelecionada = null;
    previewImagem.removeAttribute("src");
    previewImagemContainer.hidden = true;

    document.getElementById("formTitulo").textContent = "Cadastrar notícia";
    btnSalvar.textContent = "Salvar notícia";
    btnCancelar.hidden = true;
}

// Cancela uma edição
btnCancelar.addEventListener("click", limparFormulario);

// Logout
document.getElementById("btnLogout").addEventListener("click", async () => {
    try {
        await requisicao("/auth/logout", {
            method: "POST"
        });

        window.location.href = "./admin-login.html";

    } catch (erro) {
        alert(erro.message);
    }
});

// Inicialização
verificarAdministrador();
carregarNoticias();
