
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";

import {
  exigirAutenticacao,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Limita tentativas de login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    mensagem: "Muitas tentativas. Tente novamente mais tarde.",
  },
});

// Protege operações de autenticação contra requisições
// originadas de outros sites.
function verificarOrigem(req, res, next) {
  const origem = req.get("Origin");

  if (origem && origem !== process.env.FRONTEND_URL) {
    return res.status(403).json({
      mensagem: "Origem não autorizada.",
    });
  }

  next();
}

// Realizar login.
router.post("/login", verificarOrigem, loginLimiter, login);

// Consultar usuário autenticado.
router.get("/me", exigirAutenticacao, me);

// Encerrar sessão.
router.post("/logout", verificarOrigem, exigirAutenticacao, logout);

export default router;
