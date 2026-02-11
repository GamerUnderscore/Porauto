import { app, BrowserWindow } from 'electron' // Correction 1
import './server.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url' // Nécessaire pour __dirname

// --- Reconstruction de __dirname pour la syntaxe ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            // Utilise le chemin reconstruit ici
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Sécurité : recommandé à false
            contextIsolation: true  // Sécurité : recommandé à true
        }
    })

    win.removeMenu()

    // Petit délai ou gestion d'erreur pour laisser le temps au serveur de démarrer
    win.loadURL('http://localhost:5456/').catch(err => {
        console.log("Le serveur n'est pas encore prêt, nouvelle tentative dans 1s...");
        setTimeout(() => win.loadURL('http://localhost:5456/'), 1000);
    });
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})