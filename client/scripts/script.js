// ----------------------
// DONNÉES
// ----------------------
const socket = io();
const columns = ["A", "B", "C", "D"];
const rows = [1, 2, 3, 4];
const notification = document.getElementById('liveToast')
const levelString = {
    0: "INFO",
    1: "WARN",
    2: "ERROR",
    3: "SUCCESS"
}
const levelNotificationType = {
    0: "primary",
    1: "warning",
    2: "danger",
    3: "success"
}

const offcanvasElementList = document.querySelectorAll('.offcanvas')
const offcanvasList = [...offcanvasElementList].map(offcanvasEl => new bootstrap.Offcanvas(offcanvasEl))


let port = {};
let TEMP = [];
let actionList = [];

function initPort() {
    columns.forEach(c => {
        rows.forEach(r => {
            port[`${c}${r}`] = [];
        });
    });

    // conteneurs de démo
    port["A1"].push({ id: "C1" });
    port["A2"].push({ id: "C2" });
    port["A2"].push({ id: "C3" });
    port["B1"].push({ id: "C4" });

}
initPort();



// ----------------------
// RENDU
// ----------------------
function renderPort() {
    const portDiv = document.getElementById("port");
    portDiv.innerHTML = "";



    columns.forEach(c => {
        rows.forEach(r => {
            const key = `${c}${r}`;
            const cell = document.createElement("div");
            cell.className = "cell card text-bg-dark mb-3";

            const title = document.createElement("div");
            title.className = "card-header";
            title.innerText = key;
            cell.appendChild(title);

            const body = document.createElement("div");
            body.className = "card-body";
            cell.appendChild(body);

            port[key].forEach(cont => {
                const div = document.createElement("div");
                div.className = "container";
                div.innerText = cont.id;
                body.appendChild(div);
            });

       
            portDiv.appendChild(cell);
        });
    });
}



function renderTemp() {
    const tempDiv = document.getElementById("temp");
    tempDiv.innerHTML = TEMP.map(c => c.id).join(", ");
}

function renderActions() {
    document.getElementById("actions").innerText =
        actionList.map(a => `${a.type} ${a.container} : ${a.from} → ${a.to}`).join("\n");
}

// ----------------------
// LOGIQUE MÉTIER
// ----------------------
function findContainer(id) {
    for (let pos in port) {
        const index = port[pos].findIndex(c => c.id === id);
        if (index !== -1) return { pos, index };
    }
}


const dropdownButtons = document.querySelectorAll('.request-drpdwn-btn');
dropdownButtons.forEach(button => {
    button.addEventListener('click', () => {
        const inputField = document.querySelector('.input-group .form-control');
        inputField.innerText = button.value;
    });
});

const inputLetter = document.querySelector('.r-i-letter');
const inputNumber = document.querySelector('.r-i-number');

inputLetter.addEventListener('input', () => {
    inputLetter.value = inputLetter.value.toUpperCase();
    // limit to one character A-D
    if (inputLetter.value.length > 1) {
        inputLetter.value = inputLetter.value.charAt(0);
    }
    if (!['A', 'B', 'C', 'D'].includes(inputLetter.value)) {
        inputLetter.value = '';
    }
});
inputNumber.addEventListener('input', () => {
    // limit to one character 1-4
    if (inputNumber.value.length > 1) {
        inputNumber.value = inputNumber.value.charAt(0);
    }
    if (!['1', '2', '3', '4'].includes(inputNumber.value)) {
        inputNumber.value = '';
    }
});

const rInputDropdownInfo = document.getElementById('r-drpdwn-info');

const rInfoX = document.getElementById('r-drpdwn-info-x');
const rInfoY = document.getElementById('r-drpdwn-info-y');

const rInputX = document.querySelector('.r-i-letter');
const rInputY = document.querySelector('.r-i-number');

function planMove(containerId) {
    rInputDropdownInfo.innerText = containerId;
    const found = findContainer(containerId);
    rInfoX.innerText = found.pos.charAt(0);
    rInfoY.innerText = found.pos.charAt(1);
    rInputX.value = "";
    rInputY.value = "";
}

const rSubmitButton = document.getElementById('r-submit');
rSubmitButton.addEventListener('click', () => {
    const targetX = inputLetter.value;
    const targetY = inputNumber.value;
    const target = targetX + targetY;
    const containerId = rInputDropdownInfo.innerText;
    planMove2(containerId, target);

    // close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestPosition'));
    modal.hide();
});
function planMove2(containerId, target) {
    if (actionList.length > 0) {
        if (!confirm("Des actions sont déjà planifiées. En planifier une nouvelle action les effacera. Continuer ?")) {
            return;
        }
    }
    if (!port[target]) return alert("Position invalide");

    actionList = [];

    const found = findContainer(containerId);
    const stack = port[found.pos];

    const above = stack.slice(found.index + 1);

    // 1. déplacer ceux du dessus vers TEMP
    for (let i = above.length - 1; i >= 0; i--) {
        actionList.push({
            type: "MOVE",
            container: above[i].id,
            from: found.pos,
            to: "TEMP"
        });
    }

    // 2. déplacer le conteneur cible
    actionList.push({
        type: "MOVE",
        container: containerId,
        from: found.pos,
        to: target
    });

    // 3. reposer ceux du dessus
    above.forEach(c => {
        actionList.push({
            type: "MOVE",
            container: c.id,
            from: "TEMP",
            to: found.pos
        });
    });

    renderActions();
}

// ----------------------
// SIMULATION EXÉCUTION
// ----------------------
function executeActions() {
    actionList.forEach(a => {
        if (a.from !== "TEMP") {
            const stack = port[a.from];
            const idx = stack.findIndex(c => c.id === a.container);
            if (idx !== -1) {
                const [c] = stack.splice(idx, 1);
                if (a.to === "TEMP") TEMP.push(c);
                else port[a.to].push(c);
            }
        } else {
            const idx = TEMP.findIndex(c => c.id === a.container);
            const [c] = TEMP.splice(idx, 1);
            port[a.to].push(c);
        }
    });

    showNotification("Information", "Lancement de l'action en cours...", "info");

    actionList = [];
    renderAll();
}

// function showNotification(text) {
//     notification.querySelector('.toast-body').innerText = text
//     const toast = new bootstrap.Toast(notification)
//     toast.show()
// }

function showNotification(title, message, type = 'primary') {
    const container = document.getElementById('toastContainer');

    // 1. Création de l'élément unique pour ce toast
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">${title}</strong>
                <small>À l'instant</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    // 2. Injection dans le container
    container.insertAdjacentHTML('beforeend', toastHtml);

    // 3. Initialisation du Toast Bootstrap
    const toastElement = document.getElementById(toastId);
    const bootstrapToast = new bootstrap.Toast(toastElement, {
        delay: 10000 // 5 secondes
    });

    // 4. Affichage
    bootstrapToast.show();

    // 5. Nettoyage du DOM après la disparition pour ne pas ralentir l'app
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ----------------------
function renderAll() {
    renderPort();
    renderTable();
    renderTemp();
    renderActions();
}
function ReloadPorts() {
    socket.emit("getPorts");
}


window.addEventListener("load", (event) => {
   renderAll();
    ReloadPorts()
   
});


const container = document.querySelector('#table');
const contextMenuSettings = {
  callback(key, selection, clickEvent) {
    console.log(key, selection, clickEvent);
  },
  items: {
    about: {
      name() {
        return 'Déplacer';
      },
      hidden() {
          return this.getSelectedLast()?.[0] - this.getSelectedLast()?.[2] != 0;
      },
      callback() {
        setTimeout(() => {
            const cell = this.getSelectedLast();
            const id = this.getDataAtCell(cell[0], 0);

            
            $('#requestPosition').modal('show')
            

            planMove(id);
        }, 1);
      },
    },

    // credits: {
    //   // Own custom property
    //   // Custom rendered element in the context menu
    //   renderer() {
    //     const elem = document.createElement('marquee');
    //     elem.textContent = 'Petit message';

    //     return elem;
    //   },
    //   disableSelection: true,
    //   isCommand: false, // Prevent clicks from executing command and closing the menu
    // },
  },
};

const hot = new Handsontable(container, {

  themeName: 'ht-theme-main-dark-auto',
  data: [],
  stretchH: 'all',
  height: 'auto',
  colHeaders: ['ID', 'Position', 'Hauteur', 'Companie', 'Date d\'arrivée', 'Date de départ', 'Destination','Statut', 'Description'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
        data: 'id',
        editor: false,
        readOnly: true,
    },
    {
        data: 'position',
        editor: 'text',
        readOnly: true,
    },
    {
        data: 'hauteur',
        editor: 'text',
        readOnly: true,
    },
    {
        data: 'company',
        editor: 'text',
    },
    {
        data: 'arrivalDate',
        type: 'date',
        dateFormat: 'DD/MM/YYYY',
        correctFormat: true,
        defaultDate: '01/01/2024',
    },
    {  
        data: 'departureDate',
        type: 'date',
        dateFormat: 'DD/MM/YYYY',
        correctFormat: true,
        defaultDate: '01/01/2024',
    },
    {  
        data: 'destination',
        editor: 'text',
    },
    {  
        data: 'status',
        editor: 'text',
    },
    {   
        data: 'description',
        editor: 'text',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation', // for non-commercial use only
  contextMenu: contextMenuSettings
});


function renderTable() {
    const tableData = [];

    // On parcourt ton objet 'port'
    Object.entries(port).forEach(([pos, stack]) => {
        // stack est le tableau de conteneurs à cette position
        stack.forEach((c, z) => {
            // On crée un objet pour chaque ligne du tableau
            tableData.push({
                id: c.id,          // L'identifiant du conteneur (ex: "CONT123")
                position: pos,  // La clé de ton objet (ex: "A1")
                hauteur: z      // L'index dans le stack (la hauteur Z)
            });
        });
    });

    // On envoie tout d'un coup au tableau
    hot.loadData(tableData);
}

socket.on("log", (data) => {
    const logList = document.getElementById("logList");
    const li = document.createElement("li");
    li.classList.add(levelString[data.level].toLowerCase());

    li.innerText = `[${levelString[data.level]}] ${data.message}`;
    logList.appendChild(li);

    showNotification(levelString[data.level], data.message, levelNotificationType[data.level]);
});

socket.on("oldLog", (logs) => {
    const logList = document.getElementById("logList");
    logs.forEach(data => {
        const li = document.createElement("li");
        li.classList.add(levelString[data.level].toLowerCase());
        li.innerText = `[${levelString[data.level]}] ${data.message}`;
        logList.appendChild(li);
    });
});
socket.on("portsList", (ports) => {
    var html = "";
    ports.forEach((port, index) => {
        html += `<li><button class="dropdown-item" type="button" onclick="setActivePort('${port.path}')">${port.path} (${port.manufacturer})</button></li>`;
    });
    setActivePort("...");
    $("#arduino-ports-dropdown").html(html);
});



socket.on("setCommunicationStatus", (status, noModal) => {
    const circleStatus = document.getElementById("communication-status");
    circleStatus.style.backgroundColor = status ? "#00ff0a" : "red";

    if (status && !noModal) {
        const modal = new bootstrap.Modal(document.getElementById('arduinoPortModal'));
        if (document.querySelector(".modal-backdrop")) {
            document.querySelector(".modal-backdrop").remove();
        }
        modal.show();
    }
});

function setActivePort(path) {
    $('#arduino-port-selected').text(path);
    if (path === "...") {return}
    socket.emit("setActivePort", path);
}

socket.on("arduino-data", (data) => {
    console.log("Donnée reçue de l'Arduino:", data);
    const logList = document.getElementById("arduino-cmd");
    const li = document.createElement("li");
    li.innerText = `[ARDUINO] ${data}`;
    logList.appendChild(li);
});
var input = document.getElementById("arduino-cmd-input");
input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        socket.emit("sendArduinoCommand", input.value);
        input.value = "";
    }
});