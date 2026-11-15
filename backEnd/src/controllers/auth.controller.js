
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/database.js";

// Validação dos dados recebidos no login.
const loginSchema = z.object({
  email: z.string().email().max(180),
  senha: z.string().min(1).max(200),
});

// POST /api/auth/login
export async function login(req, res) {
  try {
    const validacao = loginSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        mensagem: "Informe um e-mail e uma senha válidos.",
      });
    }

    const email = validacao.data.email.trim().toLowerCase();
    const senha = validacao.data.senha;

    // Busca o administrador pelo e-mail.
    const resultado = await pool.query(
      `SELECT id, nome, email, senha_hash, ativo
       FROM admins
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const admin = resultado.rows[0];

    // Não revela se o e-mail existe ou não.
    if (!admin || !admin.ativo) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos.",
      });
    }

    // Compara a senha digitada com o hash armazenado.
    const senhaCorreta = await bcrypt.compare(
      senha,
      admin.senha_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha incorretos.",
      });
    }

    // Cria uma nova sessão para evitar session fixation.
    req.session.regenerate((erro) => {
      if (erro) {
        console.error("Erro ao criar sessão:", erro);

        return res.status(500).json({
          mensagem: "Não foi possível iniciar sua sessão.",
        });
      }

      req.session.adminId = admin.id;

      req.session.save((erroSalvar) => {
        if (erroSalvar) {
          console.error("Erro ao salvar sessão:", erroSalvar);

          return res.status(500).json({
            mensagem: "Não foi possível salvar sua sessão.",
          });
        }

        return res.status(200).json({
          mensagem: "Login realizado com sucesso!",
          usuario: {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
          },
        });
      });
    });
  } catch (erro) {
    console.error("Erro no login:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login.",
    });
  }
}

// GET /api/auth/me
export async function me(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, email
       FROM admins
       WHERE id = $1 AND ativo = TRUE
       LIMIT 1`,
      [req.session.adminId]
    );

    const admin = resultado.rows[0];

    if (!admin) {
      return res.status(401).json({
        mensagem: "Sessão inválida.",
      });
    }

    return res.status(200).json({
      autenticado: true,
      usuario: admin,
    });
  } catch (erro) {
    console.error("Erro ao consultar sessão:", erro);

    return res.status(500).json({
      mensagem: "Erro ao verificar autenticação.",
    });
  }
}

// POST /api/auth/logout
export function logout(req, res) {
  req.session.destroy((erro) => {
    if (erro) {
      console.error("Erro ao encerrar sessão:", erro);

      return res.status(500).json({
        mensagem: "Não foi possível encerrar a sessão.",
      });
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      mensagem: "Logout realizado com sucesso!",
    });
  });
}
