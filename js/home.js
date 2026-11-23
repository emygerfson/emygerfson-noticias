// ========================================
// NOTÍCIAS RECENTES DA PÁGINA INICIAL
// ========================================

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

document.addEventListener("DOMContentLoaded", carregarNoticiasRecentes);

async function carregarNoticiasRecentes() {
    const newsGrid = document.getElementById("newsGrid");

    // Se a página não tiver essa seção, encerra a execução.
    if (!newsGrid) return;

    newsGrid.textContent = "Carregando notícias...";

    try {
        const resposta = await fetch(`${API_URL}/noticias`);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as notícias.");
        }

        const dados = await resposta.json();

        // Aceita tanto uma lista direta quanto uma lista dentro de "noticias".
        const noticias = Array.isArray(dados)
            ? dados
            : dados.noticias || [];

        // Mostra somente as três publicações mais recentes.
        const recentes = noticias.slice(0, 3);

        newsGrid.replaceChildren();

        if (recentes.length === 0) {
            newsGrid.textContent = "Ainda não há notícias publicadas.";
            return;
        }

        recentes.forEach(noticia => {
            const card = document.createElement("article");
            card.className = "news-card";

            const imagemContainer = document.createElement("div");
            imagemContainer.className = "news-image";

            if (noticia.imagem_url) {
                const imagem = document.createElement("img");
                imagem.src = obterUrlImagem(noticia.imagem_url);
                imagem.alt = noticia.titulo || "Imagem da notícia";
                imagem.loading = "lazy";
                imagem.onerror = () => definirImagemIndisponivel(imagem);
                imagemContainer.appendChild(imagem);
            }

            const informacoes = document.createElement("div");
            informacoes.className = "news-info";

            const categoria = document.createElement("span");
            categoria.className = "news-category";
            categoria.textContent = noticia.categoria || "Notícia";

            const titulo = document.createElement("h3");
            titulo.textContent = noticia.titulo;

            const resumo = document.createElement("p");
            resumo.textContent = noticia.resumo || "";

            const data = document.createElement("small");
            data.className = "news-date";

            if (noticia.publicada_em) {
                const dataPublicacao = new Date(noticia.publicada_em);

                data.textContent = Number.isNaN(dataPublicacao.getTime())
                    ? ""
                    : dataPublicacao.toLocaleDateString("pt-BR");
            }

            const link = document.createElement("a");
            link.href = `paginas/noticia.html?slug=${encodeURIComponent(noticia.slug)}`;
            link.textContent = "Leia mais";

            informacoes.append(
                categoria,
                titulo,
                resumo,
                data,
                link
            );

            card.append(imagemContainer, informacoes);
            newsGrid.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar notícias:", erro);
        newsGrid.textContent =
            "Não foi possível carregar as notícias. Tente novamente mais tarde.";
    }
}