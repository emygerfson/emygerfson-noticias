
import { Router } from "express";

import {
  listarNoticias,
  cadastrarNoticia,
  buscarNoticiaPorId,
  atualizarNoticia,
  alterarStatusNoticia
} from "../controllers/noticias.controller.js";

import { exigirAutenticacao } from "../middlewares/auth.middleware.js";

import { uploadImagemNoticia } from "../middlewares/upload.middleware.js";
import { enviarImagemNoticia } from "../controllers/upload.controller.js";

const router = Router();

// Todas estas rotas exigem administrador autenticado
router.use(exigirAutenticacao);

router.post(
    "/imagem",
    uploadImagemNoticia,
    enviarImagemNoticia
);

router.get("/", listarNoticias);
router.post("/", cadastrarNoticia);
router.get("/:id", buscarNoticiaPorId);
router.put("/:id", atualizarNoticia);
router.patch("/:id/status", alterarStatusNoticia);


export default router;
