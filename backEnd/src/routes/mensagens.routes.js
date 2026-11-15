
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { cadastrarMensagem } from "../controllers/mensagens.controller.js";

const router = Router();

const limiteMensagens = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        mensagem: "Muitas tentativas. Aguarde alguns minutos."
    }
});

router.post("/", limiteMensagens, cadastrarMensagem);

export default router;
