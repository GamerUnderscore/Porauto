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

let communicationStatus = false;
let superAdminMode = false;
let port = {};
let TEMP = [];
let actionList = [];

function initPort() {
    columns.forEach(c => {
        rows.forEach(r => {
            port[`${c}${r}`] = [];
        });
    });
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

    const dropdownButtons = document.querySelectorAll('.request-drpdwn-btn');
    dropdownButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputField = document.querySelector('.input-group .form-control');
            inputField.innerText = button.value;
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
function findContainer(id) {
    for (let pos in port) {
        const index = port[pos].findIndex(c => c.id === id);
        if (index !== -1) return { pos, index };
    }
}


// Menu déplacement contenneur 

// (force à choisir LETTRE/CHIFFRE)
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
// SIMULATION EXÉCUTION (temp)
// ----------------------
function executeActions() {

    if (!communicationStatus) return showNotification("Erreur", "Impossible d'exécuter les actions : pas de communication avec l'Arduino", "danger");
    if (actionList.length === 0) return showNotification("Erreur", "Aucune action planifiée", "danger");
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
    renderTemp();
    renderActions();
}
function ReloadPorts() { // COM
    socket.emit("getPorts");
}


window.addEventListener("load", (event) => {
   ReloadPorts()

    $("#btn-download-data").click(() => {
        alert('ok')
        const data = hot.getData();
        const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tableData.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    $("#btn-import-data").click(() => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".csv";
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const rows = text.split("\n").map(row => row.split(","));
                const tableData = rows.map(row => ({
                    id: row[0],
                    position: row[1],
                    hauteur: row[2],
                    company: row[3],
                    arrivalDate: row[4],
                    departureDate: row[5],
                    destination: row[6],
                    status: row[7],
                    description: row[8],
                }));
                hot.loadData(tableData);
                sendTableDataToServer();
            };
            reader.readAsText(file);
        });
        fileInput.click();
    });

    isAdminMode = function () {
        return superAdminMode;
    };
   
});






// Partie log
socket.on("log", (data) => {
    const logList = document.getElementById("logList");
    const logList2 = document.getElementById("logList_2");
    const li = document.createElement("li");
    li.classList.add(levelString[data.level].toLowerCase());
    li.innerText = `[${levelString[data.level]}] ${data.message}`;
    logList.appendChild(li);

    const li2 = document.createElement("li");
    li2.classList.add(levelString[data.level].toLowerCase());
    li2.innerText = `[${levelString[data.level]}] ${data.message}`;
    logList2.appendChild(li2);
    
    showNotification(levelString[data.level], data.message, levelNotificationType[data.level]);
});
socket.on("oldLog", (logs) => {
    const logList = document.getElementById("logList");
    const logList2 = document.getElementById("logList_2");

    logs.forEach(data => {
        const li = document.createElement("li");
        li.classList.add(levelString[data.level].toLowerCase());
        li.innerText = `[${levelString[data.level]}] ${data.message}`;
        logList.appendChild(li);
    });
    logs.forEach(data => {
        const li = document.createElement("li");
        li.classList.add(levelString[data.level].toLowerCase());
        li.innerText = `[${levelString[data.level]}] ${data.message}`;
        logList2.appendChild(li);
    });
});

// Autre
socket.on("portsList", (ports) => {
    var html = "";
    ports.forEach((port, index) => {
        html += `<li><button class="dropdown-item" type="button" onclick="setActivePort('${port.path}')">${port.path} (${port.manufacturer})</button></li>`;
    });
    setActivePort("...");
    $("#arduino-ports-dropdown").html(html);
});
socket.on("setCommunicationStatus", (status, noModal) => {
    communicationStatus = status;
    const circleStatus = document.getElementById("communication-status");
    circleStatus.style.backgroundColor = status ? "#00ff0a" : "red";
    $('#arduino-cmd-input').prop('disabled', !status);
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
socket.on('getTableData', (data) => {
    const tableData = data.map(row => ({
        id: row[0],
        position: row[1],
        hauteur: row[2],
        company: row[3],
        arrivalDate: row[4],
        departureDate: row[5],
        destination: row[6],
        status: row[7],
        description: row[8],
    }));
    hot.loadData(tableData);
    tableData.forEach(container => {
        if (container.position) {
            port[container.position].push(container);
        };
    });
    renderPort();
});

var input = document.getElementById("arduino-cmd-input");
input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        socket.emit("sendArduinoCommand", input.value);
        input.value = "";
    }
});

$('#btn-stop').click(() => {
    if (!communicationStatus) return showNotification("Erreur", "Impossible d'arrêter : pas de communication avec l'Arduino", "danger");
    socket.emit("stopArduino");
});
socket.on('onStopArduino', () => {
    showNotification("Information", "Demande reçue: ARRÊT D'URGENCE", "info");
});

function sendTableDataToServer() {
    const tableData = hot.getData();
    socket.emit("tableData", tableData);
    renderPort()
}

$("#acm_cp_i").autocomplete({
    source: function (request, response) {
        const companies = [...new Set(hot.getData().map(row => row[3]).filter(c => c))];
        const results = companies.filter(c => c.toLowerCase().includes(request.term.toLowerCase()));
        response(results);
    },
    minLength: 0,
    select: function (event, ui) {
        $("#acm_cp_i").val(ui.item.value);
        return false;
    }
});
$("#acm_dest_i").autocomplete({
    source: function (request, response) {
        const destinations = [...new Set(hot.getData().map(row => row[6]).filter(d => d))];
        const results = destinations.filter(d => d.toLowerCase().includes(request.term.toLowerCase()));
        response(results);
    },
    minLength: 0,
    select: function (event, ui) {
        $("#acm_dest_i").val(ui.item.value);
        return false;
    }
});
$("#btn-add-container").click(() => {
    const lastRowIndex = hot.countRows() - 1;
    const lastRowData = hot.getDataAtRow(lastRowIndex);
    const id = parseInt(lastRowData[0] || 0 )+ 1
    hot.alter("insert_row_below");
    const newRowIndex = hot.countRows() - 1;
    hot.setDataAtCell(newRowIndex, 0, id);
});
$("#btn-superadmin").click(() => {
    superAdminMode = !superAdminMode;
    if (superAdminMode) {
        //activer la modification de toutes les cellules
        //hot.setCellMeta(1, 1, 'readOnly', false);
        hot.updateSettings({
            cells: function (row, col) {
                const cellProperties = {};
                cellProperties.readOnly = false;
                return cellProperties;
            }
        });
        showNotification("Mode SuperAdmin activé", "Attention!", "warning");
    } else {
        hot.updateSettings({
            cells: function (row, col) {
                const cellProperties = {};
                if (col === 0 || col === 1 || col === 2) {
                    cellProperties.readOnly = true;
                } else {
                    cellProperties.readOnly = false;
                }
                return cellProperties;
            }
        });
        showNotification("Mode SuperAdmin désactivé", "Le port est désormais protégé contre les modifications manuelles", "success");
    }
});
$('#activateLogsBottom').on('click', function (event, state) { 
    const value = event.target.checked

    if (value) {
        $("#logList_2").show()
        $("#mainContent").css("height", "80%")
    }else{
        $("#logList_2").hide()
        $("#mainContent").css("height", "100%")

    }
})
