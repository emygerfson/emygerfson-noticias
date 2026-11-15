
import { pool } from "../config/database.js";

export async function exigirAutenticacao(req, res, next) {
  try {
    // Verifica se existe um administrador na sessão.
    if (!req.session?.adminId) {
      return res.status(401).json({
        autenticado: false,
        mensagem: "Você precisa realizar login.",
      });
    }

    // Confirma que o administrador continua ativo no banco.
    const resultado = await pool.query(
      `SELECT id, nome, email
       FROM admins
       WHERE id = $1 AND ativo = TRUE
       LIMIT 1`,
      [req.session.adminId]
    );

    const admin = resultado.rows[0];

    if (!admin) {
      return req.session.destroy(() => {
        return res.status(401).json({
          autenticado: false,
          mensagem: "Usuário não autorizado.",
        });
      });
    }

    // Disponibiliza os dados do administrador para a rota.
    req.admin = admin;

    next();
  } catch (erro) {
    console.error("Erro no middleware de autenticação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao verificar autorização.",
    });
  }
}
