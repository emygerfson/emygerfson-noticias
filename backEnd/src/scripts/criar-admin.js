
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";

import { pool } from "../config/database.js";

// Cria uma interface para conversar com o usuário pelo terminal.
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

async function criarAdmin() {
  try {
    console.log("\n=================================");
    console.log(" CADASTRO DO ADMINISTRADOR");
    console.log(" EMYGERFSON NOTICIAS");
    console.log("=================================\n");

    // Solicita os dados do administrador.
    const nome = (await rl.question("Nome completo: ")).trim();
    const email = (await rl.question("E-mail: ")).trim().toLowerCase();
    const senha = await rl.question("Senha (mínimo 12 caracteres): ");
    const confirmarSenha = await rl.question("Confirme a senha: ");

    // Valida o nome.
    if (nome.length < 3) {
      throw new Error("O nome precisa ter pelo menos 3 caracteres.");
    }

    // Valida o e-mail.
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      throw new Error("Informe um endereço de e-mail válido.");
    }

    // Valida a senha.
    if (senha.length < 12) {
      throw new Error("A senha precisa ter pelo menos 12 caracteres.");
    }

    if (senha !== confirmarSenha) {
      throw new Error("As senhas não são iguais.");
    }

    // Verifica se o e-mail já está cadastrado.
    const adminExistente = await pool.query(
      "SELECT id FROM admins WHERE email = $1",
      [email]
    );

    if (adminExistente.rows.length > 0) {
      throw new Error("Já existe um administrador com esse e-mail.");
    }

    // Gera o hash da senha.
    const senhaHash = await bcrypt.hash(senha, 12);

    // Salva o administrador no banco.
    const resultado = await pool.query(
      `INSERT INTO admins (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );

    console.log("\nAdministrador criado com sucesso!");
    console.log(resultado.rows[0]);

  } catch (erro) {
    console.error("\nNão foi possível criar o administrador:");
    console.error(erro.message);

  } finally {
    rl.close();
    await pool.end();
  }
}

criarAdmin();
