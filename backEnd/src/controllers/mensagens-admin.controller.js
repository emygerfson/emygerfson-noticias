
import { pool } from "../config/database.js";

// Lista todas as mensagens recebidas
export async function listarMensagens(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT
                id,
                nome,
                email,
                telefone,
                bairro,
                tipo,
                assunto,
                mensagem,
                status,
                consentimento,
                criado_em,
                atualizado_em
            FROM mensagens
            ORDER BY criado_em DESC
        `);

        return res.status(200).json({
            total: resultado.rowCount,
            mensagens: resultado.rows
        });

    } catch (erro) {
        console.error("Erro ao listar mensagens:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível carregar as mensagens."
        });
    }
}

// Busca uma mensagem específica
export async function buscarMensagem(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        const resultado = await pool.query(
            `SELECT * FROM mensagens WHERE id = $1`,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Mensagem não encontrada."
            });
        }

        return res.status(200).json(resultado.rows[0]);

    } catch (erro) {
        console.error("Erro ao buscar mensagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível buscar a mensagem."
        });
    }
}

// Atualiza o status de uma mensagem
export async function atualizarStatusMensagem(req, res) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const statusPermitidos = [
            "nova",
            "em_analise",
            "respondida",
            "arquivada"
        ];

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID inválido."
            });
        }

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                mensagem: "Status informado inválido."
            });
        }

        const resultado = await pool.query(
            `UPDATE mensagens
             SET status = $1,
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, status, atualizado_em`,
            [status, id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Mensagem não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Status atualizado com sucesso.",
            dados: resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao atualizar mensagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível atualizar o status."
        });
    }
}
