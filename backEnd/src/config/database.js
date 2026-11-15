
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Cria um conjunto de conexões com o PostgreSQL.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testa a conexão com o banco.
export async function testarConexao() {
  try {
    const resultado = await pool.query("SELECT NOW()");

    console.log("PostgreSQL conectado com sucesso!");
    console.log("Horário do banco:", resultado.rows[0].now);

    return true;
  } catch (erro) {
    console.error("Erro ao conectar com PostgreSQL:", erro.message);
    return false;
  }
}
