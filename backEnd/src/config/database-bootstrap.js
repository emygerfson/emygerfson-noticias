import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";

import { pool } from "./database.js";

export async function prepararBanco() {
  const schemaUrl = new URL("../../database/schema.sql", import.meta.url);
  const schema = await readFile(schemaUrl, "utf8");

  await pool.query(schema);
  await criarAdminInicial();
}

async function criarAdminInicial() {
  const nomeConfigurado = process.env.BOOTSTRAP_ADMIN_NAME;
  const emailConfigurado = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const senhaConfigurada = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const redefinirSenhaConfigurado =
    process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD;
  const configuracaoSolicitada = [
    nomeConfigurado,
    emailConfigurado,
    senhaConfigurada,
    redefinirSenhaConfigurado,
  ];

  if (configuracaoSolicitada.every((valor) => valor === undefined)) {
    return;
  }

  const credenciaisBootstrap = [
    nomeConfigurado,
    emailConfigurado,
    senhaConfigurada,
  ];

  if (credenciaisBootstrap.some((valor) => !valor?.trim())) {
    throw new Error(
      "Configure BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD."
    );
  }

  const redefinirSenha =
    redefinirSenhaConfigurado?.toLowerCase() === "true";

  if (
    redefinirSenhaConfigurado !== undefined &&
    !["true", "false"].includes(redefinirSenhaConfigurado.toLowerCase())
  ) {
    throw new Error(
      "BOOTSTRAP_ADMIN_RESET_PASSWORD precisa ser true ou false."
    );
  }

  const nome = nomeConfigurado.trim();
  const email = emailConfigurado.trim().toLowerCase();
  const senha = senhaConfigurada;

  if (nome.length < 3 || nome.length > 150) {
    throw new Error("BOOTSTRAP_ADMIN_NAME precisa ter de 3 a 150 caracteres.");
  }

  if (
    email.length > 180 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL precisa ser um e-mail válido.");
  }

  if (senha.length < 12 || senha.length > 200) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD precisa ter de 12 a 200 caracteres."
    );
  }

  const adminExistente = await pool.query(
    `SELECT id
     FROM admins
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

  if (adminExistente.rows.length > 0) {
    if (redefinirSenha) {
      const senhaHash = await bcrypt.hash(senha, 12);

      await pool.query(
        `UPDATE admins
         SET senha_hash = $1,
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [senhaHash, adminExistente.rows[0].id]
      );

      console.log("Senha do administrador redefinida.");
      return;
    }

    console.log("Administrador inicial já existe; criação ignorada.");
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  await pool.query(
    `INSERT INTO admins (nome, email, senha_hash)
     VALUES ($1, $2, $3)`,
    [nome, email, senhaHash]
  );

  console.log("Administrador inicial criado.");
}
