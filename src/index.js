// Nuestro querido servidor Express

// IMPORTAR BIBLIOTECAS
const express = require("express");
const cors = require("cors");

const mysql = require("mysql2/promise");
// CONEXIÓN A MYSQL
const getConnection = require("./db/db");

// CREAR VARIABLES
const app = express();
const port = 4000;

// CONFIGURACIÓN DE EXPRESS
app.use(cors());
app.use(express.json({ limit: "25mb" }));

//ARANCAR EL SERVIDOR
app.listen(port, () => {
  console.log(`Servidor iniciado escuchando en http://localhost:${port}`);
});

//ENDPOINTS API
app.get("/api/alumno", async (req, res) => {
  console.log(req.query);

  // Obtener conn con MySQL

  const conn = await getConnection();

  if (!conn) {
    res.status(500).json({ success: false, error: "Error con la conexion." });

    return;
  }

  // Lanzar una query

  let selectStmt = "SELECT * FROM alumno";
  const values = [];

  if (req.query.incluir_estudio === "true") {
    selectStmt = `SELECT m.*, v.nombre_de_estudio nombre_de_estudio
    FROM evaluacion.alumno m
    JOIN evaluacion.estudio_admitido v ON (m.idalumno=v.idestudio)`;
  }
  if (req.query.search) {
    selectStmt += " WHERE nombre LIKE ?";
    values.push(`%${req.query.search}%`);
  }

  console.log("lanzando:", selectStmt, values);
  const [results] = await conn.query(selectStmt, values);
  // Devolvemos los resultados como JSON

  res.json(results);

  // Cerrar la conn

  await conn.close();
});

// POST   /api/alumno    <-- body={}  --> { success: true, id:1 } ó { success: false, error: 'No hay nombre' }

app.post("/api/alumno", async (req, res) => {
  console.log(req.body);

  // Obtener una conn

  const conn = await getConnection();

  if (!conn) {
    res.status(500).json({ success: false, error: "Error con la conexion." });

    return;
  }
  // Comprobar los campos

  if (!req.body.nombre) {
    res.json({ success: false, error: "Falta el nombre" });
    return;
  }

  // Insert
  const [results] = await conn.execute(
    `
    INSERT alumno (nombre, apellidos)
    VALUES (?,?);`,
    [req.body.nombre, req.body.apellidos]
  );

  console.log(results);

  // Devolvemos un JSON success: true, o success: false

  if (results.affectedRows === 1) {
    res.json({ success: true, id: results.insertId });
  } else {
    res.json({ success: false, error: "No insertado" });
  }

  // Cerramos la conn
  await conn.close();
});

// PUT    /api/alumno/1  <-- body={}  --> { success: true } ó { success: false, error: 'No hay nombre' }

app.put("/api/alumno/:idalumno", async (req, res) => {
  console.log(req.params, req.body);

  // Obtener una conn

  const conn = await getConnection();

  if (!conn) {
    res.status(500).json({ success: false, error: "Error con la conexion." });

    return;
  }

  // Actualizo en la bbdd con UPDATE

  const [results] = await conn.execute(
    `
      UPDATE alumno
      SET nombre=?, apellidos=?,
      WHERE idalumno=?
      `,
    [req.body.nombre, req.body.apellidos, req.params.idalumno]
  );

  // Devuelvo un json, success:true, success:false

  console.log(results);

  if (results.changedRows === 0) {
    res.json({ success: false });
  } else {
    res.json({ success: true });
  }

  // Cierro la conn
  await conn.close();
});

// DELETE /api/alumno/1               --> { success: true } ó { success: false, error: 'No hay nombre' }

app.delete("/api/alumno/:idalumno", async (req, res) => {
  // Obtener una conn

  const conn = await getConnection();

  if (!conn) {
    res.status(500).json({ success: false, error: "Error con la conexion." });

    return;
  }

  // Borro una fila en la bbdd con DELETE FROM

  const [results] = await conn.execute(
    `
      DELETE FROM alumno
      WHERE idalumno = ?`,
    [req.params.idalumno]
  );

  // Devuelvo un json, success:true, success:false

  console.log(results);

  if (results.affectedRows === 0) {
    res.json({ success: false });
  } else {
    res.json({ success: true });
  }

  // Cierro la conn
  await conn.close();
});
