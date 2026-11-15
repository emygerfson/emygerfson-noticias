
// ================================
// MENU MOBILE
// ================================

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {

    navMenu.classList.toggle("active");

    const aberto = navMenu.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", aberto);

    menuToggle.setAttribute(
        "aria-label",
        aberto ? "Fechar menu" : "Abrir menu"
    );

    menuToggle.textContent = aberto ? "✕" : "☰";

});


// Fechar menu ao clicar em um link

document.querySelectorAll(".nav-menu a").forEach(link => {

    link.addEventListener("click", () => {

        navMenu.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.textContent = "☰";

    });

});


// ================================
// ANO AUTOMÁTICO NO RODAPÉ
// ================================

const currentYear = document.getElementById("currentYear");

currentYear.textContent = new Date().getFullYear();


// ================================
// NOTÍCIAS
// ================================

// Conteúdos demonstrativos.
// Substitua por publicações reais e verificadas.

const noticias = [
    {
        categoria: "Cidade",
        titulo: "Conheça os principais bairros de Alumínio",
        descricao: "Um espaço para apresentar informações e características das diferentes regiões do município.",
        imagem: "https://placehold.co/600x400/102A43/FFFFFF?text=Aluminio+SP",
        link: "paginas/noticias.html"
    },
    {
        categoria: "Comunidade",
        titulo: "A importância da participação cidadã",
        descricao: "Entenda como a população pode acompanhar assuntos públicos e participar das decisões municipais.",
        imagem: "https://placehold.co/600x400/1677D2/FFFFFF?text=Comunidade",
        link: "paginas/noticias.html"
    },
    {
        categoria: "Transparência",
        titulo: "Como acompanhar informações da prefeitura",
        descricao: "Conheça os canais oficiais para consultar informações, serviços e dados públicos.",
        imagem: "https://placehold.co/600x400/164D78/FFFFFF?text=Transparencia",
        link: "paginas/noticias.html"
    }
];


// ================================
// EXIBIR NOTÍCIAS NA TELA
// ================================

const newsGrid = document.getElementById("newsGrid");

noticias.forEach(noticia => {

    const card = document.createElement("article");

    card.classList.add("news-card");

    card.innerHTML = `
        <div class="news-image">
            <img
                src="${noticia.imagem}"
                alt="${noticia.titulo}"
                loading="lazy"
            >
        </div>

        <div class="news-info">

            <span class="news-category">
                ${noticia.categoria}
            </span>

            <h3>${noticia.titulo}</h3>

            <p>${noticia.descricao}</p>

            <a href="${noticia.link}">
                Saiba mais →
            </a>

        </div>
    `;

    newsGrid.appendChild(card);

});

