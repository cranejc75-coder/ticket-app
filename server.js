/**
 * APP DE TICKETS TÉCNICOS - Responsive + EN/ES + Fotos
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Crear carpeta uploads si no existe
if (!fs.existsSync(path.join(__dirname,'uploads'))){
    fs.mkdirSync(path.join(__dirname,'uploads'));
}

// DB
let db;
(async()=>{
  db = await open({filename:path.join(__dirname,'tickets.db'),driver:sqlite3.Database});
  await db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    idioma TEXT DEFAULT 'es',
    cliente TEXT,
    tecnico TEXT,
    ubicacion TEXT,
    fecha_hora TEXT,
    problema TEXT NOT NULL,
    diagnostico TEXT,
    solucion TEXT,
    observaciones TEXT,
    images TEXT,
    id_equipo TEXT
    );
  `);
})();

// Multer para fotos
const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,'uploads/'),
  filename: (req,file,cb)=>{
    const ext = path.extname(file.originalname);
    const name = Date.now()+'-'+Math.round(Math.random()*1E9)+ext;
    cb(null,name);
  }
});
const upload = multer({
  storage,
  limits:{fileSize:5*1024*1024},
  fileFilter:(req,file,cb)=>{
    const allowed = ['.jpg','.jpeg','.png'];
    if(allowed.includes(path.extname(file.originalname).toLowerCase())){
      cb(null,true);
    } else {
      cb(new Error('Solo se permiten jpg/png/jpeg'));
    }
  }
});

// Nodemailer
function createTransporter(){
  const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,SMTP_SECURE} = process.env;
  return nodemailer.createTransport({
    host:SMTP_HOST,
    port:Number(SMTP_PORT)||587,
    secure:String(SMTP_SECURE).toLowerCase()==='true',
    auth:{user:SMTP_USER,pass:SMTP_PASS}
  });
}

// Traducciones
const TEXTS = {
  es:{title:"Registro de Tickets Técnicos",subtitle:"Completa la información del servicio técnico.",cliente:"Cliente",tecnico:"Técnico",ubicacion:"Ubicación",fecha_hora:"Fecha y hora",problema:"Problema (requerido)",diagnostico:"Diagnóstico",solucion:"Solución",observaciones:"Observaciones",limpiar:"Limpiar",guardar:"Guardar y Enviar",ver_tickets:"Ver tickets",nuevo_ticket:"Nuevo ticket",ticket_guardado:"Ticket guardado",enviado_info:"Se ha almacenado en la base de datos y se intentó enviar un correo (si SMTP está configurado).",exportar:"Exportar JSON",idioma_label:"Idioma"},
  en:{title:"Technical Service Tickets",subtitle:"Fill in the on-site service info.",cliente:"Client",tecnico:"Technician",ubicacion:"Location",fecha_hora:"Date & Time",problema:"Problem (required)",diagnostico:"Diagnosis",solucion:"Solution",observaciones:"Notes",limpiar:"Clear",guardar:"Save & Send",ver_tickets:"View tickets",nuevo_ticket:"New ticket",ticket_guardado:"Ticket saved",enviado_info:"Stored in DB and email was attempted (if SMTP configured).",exportar:"Export JSON",idioma_label:"Language"}
};

// HTML
const baseStyles = `
:root{--bg:#0b132b;--card:#0f1724;--muted:#9aa4b2;--text:#e6eef6;--accent:#5bc0be}*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial;background:var(--bg);color:var(--text)}.container{max-width:980px;margin:18px auto;padding:12px}.card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:14px;padding:18px;box-shadow:0 8px 30px rgba(2,6,23,0.6)}.topnav{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px}.brand{display:flex;flex-direction:column}.brand h1{margin:0;font-size:18px}.brand p{margin:0;font-size:12px;color:var(--muted)}.lang-select{display:flex;gap:8px;align-items:center}.lang-select select{background:#0b1220;color:var(--text);border:1px solid #23304f;padding:8px;border-radius:8px}.form{display:grid;gap:12px}.grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:720px){.grid{grid-template-columns:1fr}}label{font-size:13px;color:#cbd6e8;margin-bottom:6px;display:block}input,textarea,select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid #21314f;background:#071028;color:var(--text);font-size:14px}textarea{min-height:90px;resize:vertical}.actions{display:flex;gap:10px;justify-content:flex-end}.btn{border:0;padding:10px 14px;border-radius:10px;font-weight:600;cursor:pointer}.btn-primary{background:var(--accent);color:#071028}.btn-secondary{background:#23314a;color:var(--text)}.table{overflow:auto;margin-top:12px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #142034;text-align:left;font-size:13px}th{color:#cbd6e8}.small{font-size:12px;color:var(--muted)}.thumb{width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer}.img-container{display:flex;gap:6px;flex-wrap:wrap}`;

function escapeHTML(str=''){return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");}

function renderFormHTML(lang='es'){
  const t = TEXTS[lang]||TEXTS.es;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHTML(t.title)}</title>
<style>${baseStyles}</style>
</head>
<body>
<div class="container">
<div class="topnav">
<div class="brand">
<h1>${escapeHTML(t.title)}</h1>
<p class="small">${escapeHTML(t.subtitle)}</p>
</div>
<div class="lang-select">
<label for="lang">${escapeHTML(t.idioma_label)}:</label>
<select id="lang">
<option value="es" ${lang==='es'?'selected':''}>Español</option>
<option value="en" ${lang==='en'?'selected':''}>English</option>
</select>
<a href="/tickets?lang=${lang}" style="color:var(--accent);text-decoration:none;margin-left:8px">${escapeHTML(t.ver_tickets)}</a>
</div>
</div>
<div class="card">
<form id="ticketForm" class="form" method="POST" action="/tickets?lang=${lang}" enctype="multipart/form-data">
<div class="grid">
<div><label>${escapeHTML(t.cliente)}</label><input name="cliente"/></div>
<div><label>${escapeHTML(t.tecnico)}</label><input name="tecnico"/></div>
<div><label>${escapeHTML(t.ubicacion)}</label><input name="ubicacion"/></div>
<div><label>ID del Equipo</label><input name="id_equipo"/></div>
<div><label>${escapeHTML(t.fecha_hora)}</label><input name="fecha_hora" type="datetime-local"/></div>
</div>
<div><label>${escapeHTML(t.problema)}</label><textarea name="problema" required></textarea></div>
<div class="grid">
<div><label>${escapeHTML(t.diagnostico)}</label><textarea name="diagnostico"></textarea></div>
<div><label>${escapeHTML(t.solucion)}</label><textarea name="solucion"></textarea></div>
</div>
<div><label>${escapeHTML(t.observaciones)}</label><textarea name="observaciones"></textarea></div>
<div><label>Fotos (máx 3)</label><input type="file" name="images" multiple/></div>
<div class="actions">
<button type="reset" class="btn btn-secondary">${escapeHTML(t.limpiar)}</button>
<button type="submit" class="btn btn-primary">${escapeHTML(t.guardar)}</button>
</div>
</form>
</div>
</div>
<script>
document.getElementById('lang').addEventListener('change',function(){window.location='/?lang='+this.value});
</script>
</body>
</html>`;
}

// Rutas
app.get('/', (req,res)=>{
  const lang = req.query.lang||'es';
  res.send(renderFormHTML(lang));
});

app.post('/tickets', upload.array('images', 3), async (req, res) => {
  const lang = req.query.lang || 'es';
  const { cliente, tecnico, ubicacion, fecha_hora, problema, diagnostico, solucion, observaciones, id_equipo } = req.body;
  
  // Guardar nombres de archivos de fotos
  const images = req.files.map(f => f.filename).join(',');

  // Guardar en la base de datos, incluyendo id_equipo
  await db.run(`
    INSERT INTO tickets 
      (idioma, cliente, tecnico, ubicacion, fecha_hora, problema, diagnostico, solucion, observaciones, images, id_equipo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `, [lang, cliente, tecnico, ubicacion, fecha_hora, problema, diagnostico, solucion, observaciones, images, id_equipo]);

  // Intento enviar correo
  let emailStatus = '';
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: `Nuevo ticket: ${problema} (Equipo: ${id_equipo})`,
      text: JSON.stringify(req.body, null, 2),
      attachments: req.files.map(f => ({ filename: f.originalname, path: f.path }))
    });
    emailStatus = "Correo enviado correctamente.";
  } catch(err) {
    console.log("Error enviando email:", err.message);
    emailStatus = `Error enviando email: ${err.message}`;
  }

  // Respuesta al usuario
  res.send(`
    <div class="container">
      <p>${TEXTS[lang].ticket_guardado}</p>
      <p>${emailStatus}</p>
      <p><a href="/?lang=${lang}">${TEXTS[lang].nuevo_ticket}</a></p>
      <p><a href="/tickets?lang=${lang}">${TEXTS[lang].ver_tickets}</a></p>
    </div>
  `);
});

app.listen(PORT,()=>console.log(`Servidor corriendo en http://localhost:${PORT}`));
