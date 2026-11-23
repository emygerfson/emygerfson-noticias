
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

const conteudoNoticia = document.getElementById("conteudoNoticia");
const btnCompartilhar = document.getElementById("btnCompartilhar");

let noticiaAtual = null;

const tagsConteudoPermitidas = new Set([
    "a", "b", "blockquote", "br", "code", "del", "em", "h1", "h2",
    "h3", "h4", "hr", "i", "li", "ol", "p", "pre", "s", "small",
    "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th",
    "thead", "tr", "u", "ul"
]);

const tagsConteudoRemovidas = new Set([
    "embed", "iframe", "math", "object", "script", "style", "svg", "template"
]);

// Formata a data
function formatarData(data) {
    if (!data) return "Data não informada";

    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

// Cria um elemento HTML com texto seguro
function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

function obterLinkSeguro(valor) {
    if (!valor) return null;

    try {
        const url = new URL(valor, window.location.href);

        return ["http:", "https:", "mailto:"].includes(url.protocol)
            ? url.href
            : null;
    } catch {
        return null;
    }
}

function copiarConteudoSeguro(origem, destino) {
    for (const no of origem.childNodes) {
        if (no.nodeType === Node.TEXT_NODE) {
            destino.appendChild(document.createTextNode(no.nodeValue || ""));
            continue;
        }

        if (no.nodeType !== Node.ELEMENT_NODE) continue;

        const tag = no.tagName.toLowerCase();

        if (tagsConteudoRemovidas.has(tag)) continue;

        if (!tagsConteudoPermitidas.has(tag)) {
            copiarConteudoSeguro(no, destino);
            continue;
        }

        const elemento = document.createElement(tag);

        if (tag === "a") {
            const href = obterLinkSeguro(no.getAttribute("href"));

            if (href) {
                elemento.href = href;
            }
        }

        copiarConteudoSeguro(no, elemento);
        destino.appendChild(elemento);
    }
}

// Renderiza a notícia na página
function renderizarNoticia(noticia) {
    conteudoNoticia.replaceChildren();

    // Categoria
    const categoria = criarElemento(
        "span",
        "noticia-categoria-detalhe",
        noticia.categoria
    );

    // Título
    const titulo = criarElemento(
        "h1",
        "titulo-noticia",
        noticia.titulo
    );

    // Resumo
    const resumo = criarElemento(
        "p",
        "resumo-noticia",
        noticia.resumo
    );

    // Data
    const data = criarElemento(
        "time",
        "data-noticia",
        formatarData(noticia.publicada_em)
    );

    if (noticia.publicada_em) {
        data.dateTime = noticia.publicada_em;
    }

    conteudoNoticia.append(
        categoria,
        titulo,
        resumo,
        data
    );

    // Imagem de destaque
    if (noticia.imagem_url) {
        const imagem = document.createElement("img");

        imagem.className = "imagem-noticia";
        imagem.src = obterUrlImagem(noticia.imagem_url);
        imagem.alt = noticia.titulo;

        imagem.onerror = () => definirImagemIndisponivel(imagem);

        conteudoNoticia.appendChild(imagem);
    }

    // Corpo da notícia
    const corpo = criarElemento("div", "corpo-noticia");
    const documentoConteudo = new DOMParser().parseFromString(
        noticia.conteudo,
        "text/html"
    );
    const contemMarcacao = Array.from(documentoConteudo.body.childNodes)
        .some(no => no.nodeType === Node.ELEMENT_NODE);

    if (contemMarcacao) {
        copiarConteudoSeguro(documentoConteudo.body, corpo);
    } else {
        const paragrafos = documentoConteudo.body.textContent
            .split(/\r?\n/)
            .map(texto => texto.trim())
            .filter(texto => texto.length > 0);

        paragrafos.forEach(texto => {
            corpo.appendChild(criarElemento("p", "", texto));
        });
    }

    conteudoNoticia.appendChild(corpo);

    // Fonte
    if (noticia.fonte) {
        const fonte = criarElemento(
            "p",
            "fonte-noticia",
            `Fonte: ${noticia.fonte}`
        );

        conteudoNoticia.appendChild(fonte);
    }

    document.title = `${noticia.titulo} | EmygerfsonNoticias`;
}

// Carrega a notícia pelo slug
async function carregarNoticia() {
    try {
        const parametros = new URLSearchParams(window.location.search);
        const slug = parametros.get("slug");

        if (!slug) {
            throw new Error("Endereço da notícia inválido.");
        }

        const resposta = await fetch(
            `${API_URL}/noticias/${encodeURIComponent(slug)}`
        );

        if (resposta.status === 404) {
            throw new Error("Esta notícia não foi encontrada ou não está publicada.");
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar a notícia.");
        }

        noticiaAtual = await resposta.json();

        renderizarNoticia(noticiaAtual);

    } catch (erro) {
        console.error(erro);

        conteudoNoticia.replaceChildren(
            criarElemento("h2", "", "Não foi possível abrir esta notícia."),
            criarElemento("p", "", erro.message)
        );

        btnCompartilhar.hidden = true;
    }
}

// Compartilhar no WhatsApp ou pelo menu nativo
async function compartilharNoticia() {
    if (!noticiaAtual) return;

    const url = window.location.href;

    const texto = `${noticiaAtual.titulo} - ${url}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: noticiaAtual.titulo,
                text: noticiaAtual.resumo,
                url
            });

        } catch (erro) {
            if (erro.name !== "AbortError") {
                console.error("Erro ao compartilhar:", erro);
            }
        }

    } else {
        const link = `https://wa.me/?text=${encodeURIComponent(texto)}`;

        window.open(link, "_blank", "noopener,noreferrer");
    }
}

btnCompartilhar.addEventListener("click", compartilharNoticia);

// Inicialização
carregarNoticia();
