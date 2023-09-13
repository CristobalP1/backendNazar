import express from "express";
import cors from 'cors';
import { pool } from "./db.js";
import { PORT } from "./config.js";
import basicAuth from 'express-basic-auth';

const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(basicAuth({
  users:{'admin':'Cps@246'},
  challenge:true,
  unauthorizedResponse:'Access Denied'
}));

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

app.post("/fotos", async (req, res) => {
  const { camionero_id, nombre_foto, nombre_archivo } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Fotos (camionero_id, nombre_foto, nombre_archivo) VALUES (?,?,?)`,
    [camionero_id, nombre_foto, nombre_archivo]
  );
  res.send({ message: "Foto added successfully", fotoId: result.insertId });
});

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

app.delete('/resetdb', async (req, res) => {
  try {
      await pool.query('DELETE FROM RegistroFotos');
      await pool.query('DELETE FROM Fotos');

      res.send({ message: 'All data has been deleted' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred' });
  }
});

app.listen(PORT);
console.log("Server on Port", PORT);
