
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Descobre o caminho da pasta atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria a pasta de destino, caso ainda não exista
const pastaUploads = path.resolve(
    __dirname,
    "../../uploads/noticias"
);

fs.mkdirSync(pastaUploads, { recursive: true });

// Tipos de imagem permitidos
const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// Configuração de armazenamento
const armazenamento = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, pastaUploads);
    },

    filename: (req, file, callback) => {
        const extensoes = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        const nomeArquivo =
            `${randomUUID()}${extensoes[file.mimetype]}`;

        callback(null, nomeArquivo);
    }
});

// Validação do tipo de arquivo
function validarArquivo(req, file, callback) {
    if (!tiposPermitidos.includes(file.mimetype)) {
        return callback(
            new Error("Formato inválido. Envie JPG, PNG ou WEBP.")
        );
    }

    callback(null, true);
}

// Configuração principal do Multer
const upload = multer({
    storage: armazenamento,
    fileFilter: validarArquivo,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export const uploadImagemNoticia = upload.single("imagem");
