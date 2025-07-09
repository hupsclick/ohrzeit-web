const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
const win = new BrowserWindow({
  width: 900,
  height: 700,
  resizable: true,          // 🟢 Fenstergröße darf geändert werden
  maximizable: true,        // 🟢 Maximieren-Button aktivieren
  fullscreenable: true,     // 🟢 Vollbild-Modus ermöglichen
  autoHideMenuBar: true,
  icon: path.join(__dirname, "www", "bilder", "cover.png"),
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false
  }
});


  // Lade die index.html aus dem 'www'-Ordner
  win.loadFile(path.join(__dirname, "www", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

