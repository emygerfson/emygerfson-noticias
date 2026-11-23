
import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";

export async function enviarImagemNoticia(req, res) {
    try {
        // Verifica se algum arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({
                mensagem: "Selecione uma imagem para enviar."
            });
        }

        const extensoes = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };
        const nome = `${randomUUID()}${extensoes[req.file.mimetype]}`;

        await pool.query(
            `INSERT INTO noticias_imagens (nome, mime_type, dados)
             VALUES ($1, $2, $3)`,
            [nome, req.file.mimetype, req.file.buffer]
        );

        // Caminho público persistido no PostgreSQL.
        const imagemUrl = `/api/noticias/imagem/${nome}`;

        return res.status(201).json({
            mensagem: "Imagem enviada com sucesso!",
            imagem_url: imagemUrl,
            arquivo: nome
        });

    } catch (erro) {
        console.error("Erro no upload da imagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível enviar a imagem."
        });
    }
}
