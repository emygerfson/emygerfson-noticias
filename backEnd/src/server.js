
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";

import { pool, testarConexao } from "./config/database.js";
import { prepararBanco } from "./config/database-bootstrap.js";

import authRoutes from "./routes/auth.routes.js";

import noticiasRoutes from "./routes/noticias.routes.js";

import noticiasPublicasRoutes from "./routes/noticias-publicas.routes.js";

import mensagensRoutes from "./routes/mensagens.routes.js";

import mensagensAdminRoutes from "./routes/mensagens-admin.routes.js";

import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;
const emProducao = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

// Caminho da pasta de uploads.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pastaUploads = path.resolve(__dirname, "../uploads");

// Configuração do armazenamento de sessões no PostgreSQL.
const PgSession = connectPgSimple(session);

// Segurança básica dos cabeçalhos HTTP.
app.use(helmet());

// Permite que o frontend carregue imagens hospedadas na API.
app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(pastaUploads));

// Permite que o frontend acesse a API.
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://emygerfson-noticias.infinityfree.io",
    ].filter(Boolean),
    credentials: true,
  })
);

// Permite receber JSON nas requisições.
app.use(express.json({ limit: "1mb" }));

// Limita requisições para reduzir abusos.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", limiter);

// Configuração das sessões.

app.use(
  session({
    name: "emygerfson.sid",

    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: emProducao,
      sameSite: emProducao ? "none" : "lax",
      partitioned: emProducao,
      maxAge: 1000 * 60 * 60 * 8,
      path: "/",
    },
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/admin/noticias", noticiasRoutes);
app.use("/api/noticias", noticiasPublicasRoutes);
app.use("/api/mensagens", mensagensRoutes);
app.use("/api/admin/mensagens", mensagensAdminRoutes);
// Rota para verificar o funcionamento da API.
app.get("/api/health", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        to_regclass('public.admins') IS NOT NULL AS admins,
        to_regclass('public.noticias') IS NOT NULL AS noticias,
        to_regclass('public.mensagens') IS NOT NULL AS mensagens
    `);

    const esquemaCompleto = Object.values(resultado.rows[0]).every(
      (tabelaExiste) => tabelaExiste
    );

    if (!esquemaCompleto) {
      return res.status(503).json({
        status: "erro",
        message: "O banco está conectado, mas o esquema está incompleto.",
        database: "esquema_incompleto",
      });
    }

    return res.status(200).json({
      status: "online",
      message: "API e PostgreSQL funcionando!",
      database: "conectado",
    });
  } catch (erro) {
    console.error("Erro na verificação:", erro.message);

    return res.status(503).json({
      status: "erro",
      message: "API disponível, mas sem conexão com o banco.",
      database: "desconectado",
    });
  }
});

// Inicialização do servidor.
async function iniciarServidor() {
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    console.error("Configure DATABASE_URL e SESSION_SECRET no arquivo .env.");
    process.exit(1);
  } 

  const conectado = await testarConexao();

  if (!conectado) {
    console.error("Servidor não iniciado: verifique o PostgreSQL.");
    process.exit(1);
  }

  try {
    await prepararBanco();
  } catch (erro) {
    console.error("Servidor não iniciado: falha ao preparar o banco:", erro.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Verificação: http://localhost:${PORT}/api/health`);
  });
}
// Rotas de autenticação.


iniciarServidor();
