const express = require('express');
const path = require('path');

const app = express();

// Statische Dateien aus dem 'bilder'-Ordner bereitstellen
app.use('/bilder', express.static(path.join(__dirname, 'bilder')));

// Alle statischen Dateien im Hauptverzeichnis bereitstellen
app.use(express.static(__dirname));

// Route für die Index-Datei
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Server starten
const port = 8080;
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});







