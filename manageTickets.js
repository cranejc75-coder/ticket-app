const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./tickets.db");

// --- Borrar todos los tickets ---
function deleteAllTickets() {
  db.run("DELETE FROM tickets", function (err) {
    if (err) {
      console.error("❌ Error borrando tickets:", err.message);
    } else {
      console.log(`✅ Todos los tickets fueron eliminados.`);
    }
  });
}

// --- Borrar un ticket por ID ---
function deleteTicketById(id) {
  db.run("DELETE FROM tickets WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("❌ Error borrando ticket:", err.message);
    } else if (this.changes === 0) {
      console.log(`⚠️ No se encontró ningún ticket con ID ${id}.`);
    } else {
      console.log(`✅ Ticket con ID ${id} eliminado correctamente.`);
    }
  });
}

// --- Agregar equipo_id a un ticket ---
function updateEquipoId(ticketId, equipoId) {
  db.run("UPDATE tickets SET equipo_id = ? WHERE id = ?", [equipoId, ticketId], function (err) {
    if (err) {
      console.error("❌ Error actualizando equipo_id:", err.message);
    } else if (this.changes === 0) {
      console.log(`⚠️ No se encontró ningún ticket con ID ${ticketId}.`);
    } else {
      console.log(`✅ Ticket ${ticketId} actualizado con equipo_id = ${equipoId}.`);
    }
  });
}

