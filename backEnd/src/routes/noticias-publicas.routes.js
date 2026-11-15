
import { Router } from "express";

import {
    listarNoticiasPublicas,
    buscarNoticiaPublica
} from "../controllers/noticias.controller.js";

const router = Router();

// Não exige login: são rotas públicas.
router.get("/", listarNoticiasPublicas);
router.get("/:slug", buscarNoticiaPublica);

export default router;
