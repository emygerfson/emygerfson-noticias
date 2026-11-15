
export async function enviarImagemNoticia(req, res) {
    try {
        // Verifica se algum arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({
                mensagem: "Selecione uma imagem para enviar."
            });
        }

        // Caminho público da imagem
        const imagemUrl = `/uploads/noticias/${req.file.filename}`;

        return res.status(201).json({
            mensagem: "Imagem enviada com sucesso!",
            imagem_url: imagemUrl,
            arquivo: req.file.filename
        });

    } catch (erro) {
        console.error("Erro no upload da imagem:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível enviar a imagem."
        });
    }
}
