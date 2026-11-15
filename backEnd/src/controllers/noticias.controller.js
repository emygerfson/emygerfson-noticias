
import { pool } from "../config/database.js";
import { z } from "zod";

// Validação dos dados recebidos
const noticiaSchema = z.object({
  titulo: z.string().min(5).max(200),
  resumo: z.string().min(10).max(500),
  conteudo: z.string().min(10),
  categoria: z.string().min(2).max(100),
  imagem_url: z.string().optional().nullable(),
  fonte: z.string().optional().nullable(),
  status: z.enum(["rascunho", "publicada", "arquivada"]).optional()
});

// Gera um slug a partir do título
function gerarSlug(titulo) {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// LISTAR NOTÍCIAS
export async function listarNoticias(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT
        n.id,
        n.titulo,
        n.slug,
        n.resumo,
        n.categoria,
        n.status,
        n.imagem_url,
        n.fonte,
        n.publicada_em,
        n.criado_em,
        a.nome AS autor
      FROM noticias n
      JOIN admins a ON a.id = n.autor_id
      ORDER BY n.criado_em DESC
    `);

    return res.json(resultado.rows);

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro ao listar notícias."
    });
  }
}

// CADASTRAR NOTÍCIA
export async function cadastrarNoticia(req, res) {
  try {
    const dados = noticiaSchema.parse(req.body);

    const slugBase = gerarSlug(dados.titulo);
    const slug = `${slugBase}-${Date.now()}`;

    const status = dados.status || "rascunho";

    const resultado = await pool.query(
      `INSERT INTO noticias (
        titulo,
        slug,
        resumo,
        conteudo,
        categoria,
        imagem_url,
        fonte,
        status,
        autor_id,
        publicada_em
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
        CASE WHEN $8::varchar = 'publicada' THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING *`,
      [
        dados.titulo,
        slug,
        dados.resumo,
        dados.conteudo,
        dados.categoria,
        dados.imagem_url || null,
        dados.fonte || null,
        status,
        req.admin.id
      ]
    );

    return res.status(201).json({
      mensagem: "Notícia cadastrada com sucesso!",
      noticia: resultado.rows[0]
    });

  } catch (erro) {
    if (erro instanceof z.ZodError) {
      return res.status(400).json({
        mensagem: "Verifique os dados informados.",
        erros: erro.issues
      });
    }

    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro ao cadastrar notícia."
    });
  }
}

// BUSCAR NOTÍCIA POR ID
export async function buscarNoticiaPorId(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        mensagem: "ID inválido."
      });
    }

    const resultado = await pool.query(
      "SELECT * FROM noticias WHERE id = $1",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Notícia não encontrada."
      });
    }

    return res.json(resultado.rows[0]);

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro ao buscar notícia."
    });
  }
}

// EDITAR NOTÍCIA
export async function atualizarNoticia(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        mensagem: "ID inválido."
      });
    }

    const dados = noticiaSchema.parse(req.body);

    const resultado = await pool.query(
      `UPDATE noticias
       SET titulo = $1,
           resumo = $2,
           conteudo = $3,
           categoria = $4,
           imagem_url = $5,
           fonte = $6,
           status = $7,
           publicada_em = CASE
             WHEN $7 = 'publicada'
               THEN COALESCE(publicada_em, CURRENT_TIMESTAMP)
             ELSE NULL
           END,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        dados.titulo,
        dados.resumo,
        dados.conteudo,
        dados.categoria,
        dados.imagem_url || null,
        dados.fonte || null,
        dados.status || "rascunho",
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Notícia não encontrada."
      });
    }

    return res.json({
      mensagem: "Notícia atualizada com sucesso!",
      noticia: resultado.rows[0]
    });

  } catch (erro) {
    if (erro instanceof z.ZodError) {
      return res.status(400).json({
        mensagem: "Verifique os dados informados.",
        erros: erro.issues
      });
    }

    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro ao atualizar notícia."
    });
  }
}

// ALTERAR STATUS
export async function alterarStatusNoticia(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        mensagem: "ID inválido."
      });
    }

    if (!["rascunho", "publicada", "arquivada"].includes(status)) {
      return res.status(400).json({
        mensagem: "Status inválido."
      });
    }

    const resultado = await pool.query(
      `UPDATE noticias
       SET status = $1,
           publicada_em = CASE
             WHEN $1 = 'publicada'
               THEN COALESCE(publicada_em, CURRENT_TIMESTAMP)
             ELSE NULL
           END,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Notícia não encontrada."
      });
    }

    return res.json({
      mensagem: "Status atualizado com sucesso!",
      noticia: resultado.rows[0]
    });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro ao alterar status."
    });
  }
}

// =====================================
// API PÚBLICA - LISTAR NOTÍCIAS PUBLICADAS
// =====================================

export async function listarNoticiasPublicas(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                titulo,
                slug,
                resumo,
                conteudo,
                categoria,
                imagem_url,
                fonte,
                publicada_em
            FROM noticias
            WHERE status = 'publicada'
            ORDER BY publicada_em DESC NULLS LAST
        `);

        return res.json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao listar notícias públicas:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível carregar as notícias."
        });
    }
}

// =====================================
// API PÚBLICA - BUSCAR NOTÍCIA POR SLUG
// =====================================

export async function buscarNoticiaPublica(req, res) {
    try {
        const { slug } = req.params;

        const resultado = await pool.query(
            `SELECT
                id,
                titulo,
                slug,
                resumo,
                conteudo,
                categoria,
                imagem_url,
                fonte,
                publicada_em
             FROM noticias
             WHERE slug = $1
             AND status = 'publicada'`,
            [slug]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Notícia não encontrada."
            });
        }

        return res.json(resultado.rows[0]);

    } catch (erro) {
        console.error("Erro ao buscar notícia pública:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível carregar a notícia."
        });
    }
}
