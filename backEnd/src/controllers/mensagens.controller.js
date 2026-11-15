
import { pool } from "../config/database.js";
import { z } from "zod";

const mensagemSchema = z.object({
    nome: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(180).optional().or(z.literal("")),
    telefone: z.string().trim().max(30).optional(),
    bairro: z.string().trim().max(120).optional(),
    tipo: z.enum(["comunidade", "contato"]),
    assunto: z.string().trim().max(200).optional(),
    mensagem: z.string().trim().min(5).max(5000),
    consentimento: z.literal(true)
});

export async function cadastrarMensagem(req, res) {
    try {
        const validacao = mensagemSchema.safeParse(req.body);

        if (!validacao.success) {
            return res.status(400).json({
                mensagem: "Verifique os campos enviados.",
                erros: validacao.error.flatten()
            });
        }

        const dados = validacao.data;

        const resultado = await pool.query(
            `INSERT INTO mensagens
            (nome, email, telefone, bairro, tipo, assunto, mensagem, consentimento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, criado_em`,
            [
                dados.nome,
                dados.email || null,
                dados.telefone || null,
                dados.bairro || null,
                dados.tipo,
                dados.assunto || null,
                dados.mensagem,
                dados.consentimento
            ]
        );

        return res.status(201).json({
            mensagem: "Mensagem enviada com sucesso!",
            id: resultado.rows[0].id
        });

    } catch (erro) {
        console.error("Erro ao cadastrar mensagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível enviar sua mensagem."
        });
    }
}
