import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { PORT, USER_API, USER_PASS } from "./config.js";
import basicAuth from "express-basic-auth";
import multer from "multer";
import path from "path";
// import { promises as fs } from 'fs';

const app = express();

//middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(
  basicAuth({
    users: { [USER_API]: USER_PASS },
    challenge: true,
    unauthorizedResponse: "Access Denied",
  })
);

// app.use((err, req, res, next) => {
//   res.status(500).send({ message: err.message || "Internal Server Error" });
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("Welcome to Server");
});

app.get("/camioneros", async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM Camioneros`);
  res.send(rows);
});

app.get("/camioneros/:id/fotos", async (req, res) => {
  const camionerosId = req.params.id;
  const [rows] = await pool.query(
    `SELECT * FROM Fotos WHERE camionero_id = ?`,
    [camionerosId]
  );
  res.send(rows);
});

// app.post("/fotos", async (req, res) => {
//   const { camionero_id, nombre_foto, nombre_archivo } = req.body;
//   const [result] = await pool.query(
//     `INSERT INTO Fotos (camionero_id, nombre_foto, nombre_archivo) VALUES (?,?,?)`,
//     [camionero_id, nombre_foto, nombre_archivo]
//   );
//   res.send({ message: "Foto added successfully", fotoId: result.insertId });
// });

// app.post("/fotos", upload.single("nombre_archivo"), async (req, res) => {
//   const { camionero_id, nombre_foto } = req.body;

//   const nombre_archivo = req.file ? req.file.filename : null;

//   console.log('====================================');
//   console.log(camionero_id, nombre_foto, nombre_archivo);
//   console.log('====================================');

//   if (!nombre_archivo) {
//     return res.status(400).send({ message: "La imagen es requerida" });
//   }

//   const [result] = await pool.query(
//     `INSERT INTO Fotos (camionero_id, nombre_foto, nombre_archivo) VALUES (?,?,?)`,
//     [camionero_id, nombre_foto, nombre_archivo]
//   );

//   res.send({ message: "Foto added successfully", fotoId: result.insertId });
// });

app.post("/fotos", upload.single("nombre_archivo"), async (req, res, next) => {
  try {
    const { camionero_id, nombre_foto } = req.body;
    const nombre_archivo = req.file ? req.file.filename : null;

    if (!nombre_archivo) {
      // Usar el código 400 para 'Bad Request'
      return res.status(400).send({ message: "La imagen es requerida" });
    }

    const [result] = await pool.query(
      `INSERT INTO Fotos (camionero_id, nombre_foto, nombre_archivo) VALUES (?,?,?)`,
      [camionero_id, nombre_foto, nombre_archivo]
    );

    res.send({ message: "Foto added successfully", fotoId: result.insertId });
  } catch (error) {
    console.error(error);
    // Pasar el error al middleware de manejo de errores
    next(error);
  }
});

// app.get("/uploads/:foto_id", async (req, res) => {
//   const fotoId = req.params.foto_id;

//   // Obten la entrada de la base de datos que corresponde a foto_id
//   const [rows] = await pool.query(
//     `SELECT nombre_archivo FROM Fotos WHERE foto_id = ?`,
//     [fotoId]
//   );

//   if (rows && rows.length > 0) {
//     const filepath = path.resolve(".", "uploads", rows[0].nombre_archivo);
//     res.sendFile(filepath);
//   } else {
//     res.status(404).send({ message: "Imagen no encontrada" });
//   }
// });

// app.get("/uploads/:foto_id", async (req, res) => {
//   const fotoId = req.params.foto_id;

//   // Obten la entrada de la base de datos que corresponde a foto_id
//   const [rows] = await pool.query(
//     `SELECT nombre_archivo FROM Fotos WHERE foto_id = ?`,
//     [fotoId]
//   );

//   if (rows && rows.length > 0) {
//     const filepath = path.resolve(".", "uploads", rows[0].nombre_archivo);

//     try {
//       // Leer el archivo y codificarlo en base64
//       const imageBuffer = await fs.readFile(filepath);
//       const imageBase64 = imageBuffer.toString('base64');
   
//       // Enviar la cadena base64 como respuesta
//       res.json({ imageBase64: imageBase64 });
   
//    } catch (error) {
//       console.error("Detalles del error:", error); // Esto te mostrará detalles sobre el error.
//       res.status(500).send({ message: "Error al codificar la imagen" });
//    }
//   } else {
//     res.status(404).send({ message: "Imagen no encontrada" });
//   }
// });

app.get("/registro", async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM RegistroFotos`);
  res.send(rows);
});

app.post("/registro", async (req, res) => {
  const { nombre_camionero, nombre_foto } = req.body;
  const [result] = await pool.query(
    "INSERT INTO RegistroFotos (nombre_camionero, nombre_foto) VALUES (?, ?)",
    [nombre_camionero, nombre_foto]
  );
  res.send({
    message: "Registro added successfully",
    registroId: result.insertId,
  });
});

app.delete("/resetdb", async (req, res) => {
  try {
    await pool.query("DELETE FROM RegistroFotos");
    await pool.query("DELETE FROM Fotos");

    res.send({ message: "All data has been deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "An error occurred" });
  }
});

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message || "Internal Server Error" });
});
app.listen(PORT);
console.log("Server on Port", PORT);
