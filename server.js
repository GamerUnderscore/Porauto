import http from 'http';
import fs from 'fs'
import path from 'path'
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// fichier appdata pour windows / home directory pour linux et macos
const __tempdir = path.join(process.platform === 'win32' ? process.env.APPDATA : process.env.HOME, 'porauto');


const levelString = {
    0: "INFO",
    1: "WARN",
    2: "ERROR",
    3: "SUCCESS"
}
const PORT = 5456;
const HOST = 'localhost';

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.json': 'application/json',
    '.txt': 'text/plain'
};
var logs = [];
var communicationStatus = false;

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/move.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Fichier non trouvé</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté:', socket.id);

    socket.emit('setCommunicationStatus', communicationStatus, true);
    socket.emit('getTableData', fs.existsSync(path.join(__tempdir, 'tableData.json')) ? JSON.parse(fs.readFileSync(path.join(__tempdir, 'tableData.json'))) : []);

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté:', socket.id);
    });

    socket.on('getPorts', () => {
        SerialPort.list().then(newPorts => {
            ports = newPorts;
            socket.emit('portsList', ports);
        });
    });

    socket.on('setActivePort', (path) => {
        setActivePort(path);
    });

    socket.on('sendArduinoCommand', (cmd) => {
        if (activePort && activePort.isOpen) {
            activePort.write(cmd + '\n', (err) => {
                if (err) {
                    logToClient(`Erreur lors de l'envoi de la commande Arduino : ${err.message}`, 2, true);
                }
            });
        }
    });
    socket.on('stopArduino', () => {
        if (activePort && activePort.isOpen) {
            activePort.write('STOP\n', (err) => {
                if (err) {
                    logToClient(`Erreur lors de l'envoi de la commande STOP à l'Arduino : ${err.message}`, 2, true);
                }else{
                    socket.emit('onStopArduino');
                }
            });
        }
    });
    socket.on('tableData', (tableData) => {
        const filePath = path.join(__tempdir, 'tableData.json');
        fs.mkdir(__tempdir, { recursive: true }, (err) => {
            if (err) { console.error('Erreur lors de la création du dossier temporaire :', err); return; }
            fs.writeFile(filePath, JSON.stringify(tableData), (err) => {if (err) { console.error('Erreur lors de l\'écriture du fichier tableData.json :', err); }});
        });
    });

    socket.emit("oldLog", logs);
});

server.listen(PORT, HOST, () => {
    console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});


function logToClient(message, level, noServer) {
    level = level ?? 0


    logs.push({
        message: message,
        level: level
    })

    io.emit("log", {
        message: message,
        level: level
    });

    if (noServer) { return }
    console.log("[", levelString[level], "] ", message)
}

logToClient("Démarrage du serveur...", 0, true)



var ports = await SerialPort.list();
var arduinoPath = null;
for (let i = 0; i < ports.length; i++) {
    const manufacturer = String(ports[i].manufacturer ?? '').toLowerCase();
    if (manufacturer.includes("arduino")) {
        arduinoPath = ports[i].path;
        setActivePort(arduinoPath);
        break;
    }
}





if (!arduinoPath) {
    console.warn("Aucun port Arduino trouvé. Assurez-vous que votre Arduino est connecté.");
    logToClient("Aucun port Arduino trouvé. Assurez-vous que votre Arduino est connecté.", 2, true);
}

let activePort = null;
let activeParser = null;
async function setActivePort(path) {
    communicationStatus = false;
    io.emit("setCommunicationStatus", false);
    try {
        // 1. Si un port est déjà ouvert, on le ferme proprement
        if (activePort && activePort.isOpen) {
            await new Promise((resolve) => activePort.close(resolve));
        }

        // 2. Création du nouveau port
        activePort = new SerialPort({
            path: path,
            baudRate: 9600,
            autoOpen: false // On l'ouvre manuellement pour gérer les erreurs
        });

        // 3. Configuration du Parser (pour lire ligne par ligne)
        activeParser = activePort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        // 4. Ouverture du port
        activePort.open((err) => {
            if (err) {
                logToClient(`Erreur à l'ouverture du port ${path} : ${err.message}`, 2, true);
                return console.error('Erreur à l\'ouverture :', err.message);
            }

            
            logToClient(`✅ Port série actif : ${path}`, 0);
        });

        // 5. Gestion des données reçues
        activeParser.on('data', (data) => {
            
            if (data.trim() === "READY") {
                activePort.write('PING\n', (err) => {
                    if (err) {
                        logToClient(`Erreur à l'écriture sur le port ${path} : ${err.message}`, 2, true);
                        return console.error('Erreur à l\'écriture :', err.message);
                    }
                });
            } else if (data.trim() === "PONG") {
                logToClient(`✅ Communication avec ${path} établie !`, 3);
                io.emit("setCommunicationStatus", true);
                communicationStatus = true;
            } else {
                io.emit("arduino-data", data);
            }
            // Ici, tu peux envoyer la donnée vers Handsontable via IPC
            // win.webContents.send('serial-data', data);
        });

        // 6. Gestion des erreurs imprévues (débranchement, etc.)
        activePort.on('error', (err) => {
            logToClient(`Erreur critique port série: ${err.message}`, 2);
        });

    } catch (error) {
        logToClient(`Impossible de définir le port actif : ${error.message}`, 2);
    }
}


let knownPorts = new Set();

function startAutoDetection(callback) {
    setInterval(async () => {
        try {
            const currentPorts = await SerialPort.list();
            const currentPaths = currentPorts.map(p => p.path);

            // 1. Détecter les nouveaux branchements
            currentPaths.forEach(path => {
                if (!knownPorts.has(path)) {
                    console.log(`🔌 Nouvel appareil détecté : ${path}`);
                    knownPorts.add(path);

                    // On vérifie si c'est un Arduino (souvent via le manufacturer)
                    const portInfo = currentPorts.find(p => p.path === path);
                    if (portInfo.manufacturer?.includes('Arduino')) {
                        callback(path); // On lance la connexion
                    }
                }
            });

            // 2. Nettoyer les ports débranchés
            knownPorts.forEach(path => {
                if (!currentPaths.includes(path)) {
                    logToClient(`❌ Appareil débranché : ${path}`, 1);

                    knownPorts.delete(path);
                    communicationStatus = false
                    io.emit("setCommunicationStatus", false);
                }
            });

        } catch (err) {
            console.error("Erreur lors du scan des ports:", err);
        }
    }, 2000); // Scan toutes les 2 secondes
}

startAutoDetection((newPort) => {
    logToClient(`🔌 Nouveau port détecté : ${newPort}. Tentative de connexion...`, 0, true);
    setActivePort(newPort);
});

for(let i = 0; i > 10; i++) {
    logToClient(`A`, 0, true);

}

