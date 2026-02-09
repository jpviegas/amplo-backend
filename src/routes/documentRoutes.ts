import { NextFunction, Request, Response, Router } from "express";
import { upload } from "../config/upload";
import {
  documentController,
  getAllDocuments,
} from "../controllers/documentController";

const router = Router();

// Middleware to inject type into body based on the route
const setType = (type: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body.type = type;
    next();
  };
};

// Rota: Listar todos os documentos (filtro por userId e type via query params)
router.get("/", getAllDocuments);

// Rota: Obter documento por ID (Restrito a ObjectId de 24 chars hex)
router.get("/:id", documentController.getById);

// Rota: Visualizar documento por ID
router.get("/:id/view", documentController.view);

// Rota: Download do documento por ID
router.get("/:id/download", documentController.download);

// Rota: Acessar documento diretamente pelo nome (ex: api/documents/arquivo.pdf)
router.get("/:filename", documentController.getByFilename);

// Rota: Contrato
router.post(
  "/contrato",
  upload.single("file"),
  setType("contrato"),
  documentController.upload,
);

// Rota: Código de Conduta
router.post(
  "/codigo-de-conduta",
  upload.single("file"),
  setType("codigo_conduta"),
  documentController.upload,
);

// Rota: Termos
router.post(
  "/termos",
  upload.single("file"),
  setType("termos"),
  documentController.upload,
);

// Rota: Demais Documentos
router.post(
  "/demais-documentos",
  upload.single("file"),
  setType("demais_documentos"),
  documentController.upload,
);

export default router;
