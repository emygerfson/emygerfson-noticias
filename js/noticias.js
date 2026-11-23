
const API_URL = window.API_URL;

function definirImagemIndisponivel(imagem) {
    if (imagem.dataset.fallback === "true") return;

    imagem.dataset.fallback = "true";
    imagem.alt = "Imagem indisponível";
    imagem.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520">' +
            '<rect width="100%" height="100%" fill="#E5EAF0"/>' +
            '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"' +
            ' fill="#64748B" font-family="Arial" font-size="24">Imagem indisponível</text>' +
            '</svg>'
        );
}

function obterUrlImagem(imagemUrl) {
    if (/^https?:\/\//i.test(imagemUrl)) return imagemUrl;

    const origemApi = API_URL.replace(/\/api\/?$/, "");
    const caminhoImagem = imagemUrl.startsWith("/")
        ? imagemUrl
        : `/${imagemUrl}`;

    return `${origemApi}${caminhoImagem}`;
}

// Elementos da página
const gridNoticias = document.getElementById("gridNoticias");
const campoPesquisa = document.getElementById("pesquisaNoticias");
const filtroCategoria = document.getElementById("filtroCategoria");
const contadorNoticias = document.getElementById("contadorNoticias");
const mensagemVazia = document.getElementById("mensagemVazia");

let noticias = [];

// Formata a data para o padrão brasileiro
function formatarData(data) {
    if (!data) return "Data não informada";

    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// Cria um card de notícia
function criarCard(noticia) {
    const artigo = document.createElement("article");
    artigo.className = "noticia-card";

    if (noticia.imagem_url) {
        const imagem = document.createElement("img");
        imagem.src = obterUrlImagem(noticia.imagem_url);
        imagem.alt = noticia.titulo;
        imagem.loading = "lazy";

        imagem.onerror = () => definirImagemIndisponivel(imagem);

        artigo.appendChild(imagem);
    }

    const conteudo = document.createElement("div");
    conteudo.className = "noticia-card-conteudo";

    const categoria = document.createElement("span");
    categoria.className = "noticia-categoria";
    categoria.textContent = noticia.categoria;

    const titulo = document.createElement("h3");
    titulo.textContent = noticia.titulo;

    const resumo = document.createElement("p");
    resumo.textContent = noticia.resumo;

    const data = document.createElement("small");
    data.textContent = formatarData(noticia.publicada_em);

    const link = document.createElement("a");
    link.href = `./noticia.html?slug=${encodeURIComponent(noticia.slug)}`;
    link.textContent = "Ler notícia";

    conteudo.append(categoria, titulo, resumo, data, link);
    artigo.appendChild(conteudo);

    return artigo;
}

// Mostra as notícias na tela
function renderizarNoticias(lista) {
    gridNoticias.replaceChildren();

    contadorNoticias.textContent =
        `${lista.length} notícia(s) encontrada(s)`;

    if (lista.length === 0) {
        mensagemVazia.hidden = false;
        return;
    }

    mensagemVazia.hidden = true;

    lista.forEach((noticia) => {
        gridNoticias.appendChild(criarCard(noticia));
    });
}

// Pesquisa e filtra as notícias
function filtrarNoticias() {
    const pesquisa = campoPesquisa.value
        .trim()
        .toLowerCase();

    const categoriaSelecionada = filtroCategoria.value;

    const resultado = noticias.filter((noticia) => {
        const correspondePesquisa =
            noticia.titulo.toLowerCase().includes(pesquisa) ||
            noticia.resumo.toLowerCase().includes(pesquisa);

        const correspondeCategoria =
            !categoriaSelecionada ||
            noticia.categoria === categoriaSelecionada;

        return correspondePesquisa && correspondeCategoria;
    });

    renderizarNoticias(resultado);
}

// Carrega as notícias da API
async function carregarNoticias() {
    try {
        gridNoticias.textContent = "Carregando notícias...";

        const resposta = await fetch(`${API_URL}/noticias`);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as notícias.");
        }

        noticias = await resposta.json();

        // Ordena da mais recente para a mais antiga
        noticias.sort((a, b) => {
            return new Date(b.publicada_em) - new Date(a.publicada_em);
        });

        renderizarNoticias(noticias);

    } catch (erro) {
        console.error(erro);

        gridNoticias.textContent =
            "Não foi possível carregar as notícias. Tente novamente mais tarde.";
    }
}

// Eventos dos filtros
campoPesquisa.addEventListener("input", filtrarNoticias);
filtroCategoria.addEventListener("change", filtrarNoticias);

// Inicia a página
carregarNoticias();
