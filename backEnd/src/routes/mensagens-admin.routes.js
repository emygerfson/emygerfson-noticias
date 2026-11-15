
import { Router } from "express";

import {
    listarMensagens,
    buscarMensagem,
    atualizarStatusMensagem
} from "../controllers/mensagens-admin.controller.js";

import { exigirAutenticacao } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas as rotas abaixo exigem autenticação
router.use(exigirAutenticacao);

// Listar mensagens
router.get("/", listarMensagens);

// Buscar mensagem pelo ID
router.get("/:id", buscarMensagem);

// Atualizar status
router.patch("/:id/status", atualizarStatusMensagem);

export default router;
