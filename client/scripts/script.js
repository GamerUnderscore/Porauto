// ----------------------
// DONNÉES

// ----------------------
gsap.registerPlugin(SplitText);

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
let port = [];
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
            cell.className = "cell card mb-3";

            const title = document.createElement("div");
            title.className = "card-header";
            title.id = "card-c-header"
            title.innerText = key;
            cell.appendChild(title);

            const body = document.createElement("div");
            body.className = "card-body";
            body.id = "card-c-body"
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
function renderActions() {
    document.getElementById("actions").innerText =
        actionList.map(a => `${a.type} ${a.container} : ${a.from} → ${a.to}`).join("\n");
}

function findContainer(id) {
    for (let pos in port) {
        console.log()
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
    containerId = parseInt(containerId)
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

    $("#newActions").show()
    renderActions();
}
$('#greneratedActions-button').on('click', function() {
    $("#newActions").hide()
})

// ----------------------
// SIMULATION EXÉCUTION (temp)
// ----------------------
function executeActions() {
    if (actionList.length === 0) return showNotification("Erreur", "Aucune action planifiée", "danger");
    if (!communicationStatus) return showNotification("Erreur", "Impossible d'exécuter les actions : pas de communication avec l'Arduino", "danger");
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
$("#btn-resetActions").click(function() {
    actionList = []
    renderActions()
})

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
    renderActions();
}
function ReloadPorts() { // COM
    socket.emit("getPorts");
}


window.addEventListener("load", (event) => {
   ReloadPorts()

    $("#btn-download-data").click(() => {
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
   


    let tl = gsap.timeline();
    tl.to("#loading-logo", { duration: 1.5, rotation: 360, backgroundColor: "white", ease: "elastic" })

        .to(".loading-container", { width: "25%", duration: 2, ease: "expo" }, 0)
        .to("#loading-bar", { width: "100%", duration: 2, ease: "expo" }, 1)

        .to("#loading-bglogo", { duration: 1, left: '50%', ease: "expo" }, 1)
        .to(".loading-scrn", { duration: 1, top: '100%', ease: "expo" }, 2)
        .to(".loading-container", { top: '100%', duration: 0.2, ease: "expo" }, 2)

        .to(".loading-scrn", { duration: 1, opacity: 0, display: 'none', onStart: function() {

            document.fonts.ready.then(() => {
                gsap.set(".defilement-texte", { opacity: 1 });
                let split = SplitText.create(".defilement-texte", { type: "words", aria: "hidden" });

                gsap.from(split.words, {
                    opacity: 0,
                    duration: 5,
                    ease: "sine.out",
                    stagger: 0.1,
                });
            });
        }})
}); // end load






// Partie log
socket.on("log", (data) => {
    const logList = document.getElementById("logList");
    const logList2 = document.getElementById("logList_2");
    const li = document.createElement("li");
    li.classList.add(levelString[data.level].toLowerCase());
    li.innerText = `[${levelString[data.level]}] ${data.message}`;
    logList.appendChild(li);

    const logList2Elem = $("#logList_2")[0];
    const isScrolledToBottom = logList2Elem.scrollTop + logList2Elem.clientHeight >= logList2Elem.scrollHeight - 1;
    

    const li2 = document.createElement("li");
    li2.classList.add(levelString[data.level].toLowerCase());
    li2.innerText = `[${levelString[data.level]}] ${data.message}`;
    logList2.appendChild(li2);

    if (isScrolledToBottom) {
        $("#logList_2").scrollTop(logList2Elem.scrollHeight);
    }
    
    showNotification(levelString[data.level], data.message, levelNotificationType[data.level]);
});

let logsInLoad = 1
socket.on("oldLog", (logs) => {
    if (!logsInLoad) return
    logsInLoad = null
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
    // Vérifie si #logList_2 est déjà scrollé tout en bas
    

    

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
    $('#connectArduinoWarn')[status ? 'hide' : 'show']()
    const circleStatus = document.getElementById("communication-status");
    $("#arduino-com").html(status ? 'Établi.' : 'Rompu.')
    $("#arduino-com-hint").html(status ? "" : "Assurez vous d'avoir bien branché la carte arduino à l'ordinateur, et d'avoir bien téléversé le code dans la carte. Note: Fermez le logiciel lorsque vous téléversez le programme dans la carte")

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
    const logList = document.getElementById("arduino-cmd");
    const li = document.createElement("li");
    li.innerText = `[ARDUINO] ${data}`;
    logList.appendChild(li);
});

let dataLoaded = false
socket.on('getTableData', (data) => {
    if (dataLoaded) return
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
    dataLoaded = true
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

    updatePort()
}
function updatePort() {
    initPort()
    var tableData = hot.getData();

    tableData = tableData.map(row => ({
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

    tableData.forEach(container => {
        console.log(container)
        if (container.position) {
            port[container.position].push(container);
        };
    });
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
        showNotification("Mode édition activé", "Attention!", "warning");
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
        showNotification("Mode édition désactivé", "Le port est désormais protégé contre les modifications manuelles", "success");
    }
});




// Settings
var settingsOnLoad = true
var settingsData = {
    "logs_bottom":false,
    "light_mode_auto": true,
    "light_mode": false
}

loaded = false
socket.on('loadSettingsData', function (_data) {

    if (!loaded) {
        settingsData = _data
        $('#activateLogsBottom').prop("checked", !settingsData.logs_bottom)
        $('#checkNight').prop("checked", !settingsData.light_mode)
        $('#themeAuto').prop("checked", !settingsData.light_mode_auto)

        $("#activateLogsBottom").trigger("click");
        $("#checkNight").trigger("click");
        $("#themeAuto").trigger("click");

        if (settingsData.light_mode_auto) {
            $('#checkNight_div').hide()
            setTheme("auto")
        }
    }
    loaded = true
    settingsOnLoad = false
})
function saveSettingsData() {
    if (settingsOnLoad) return
    settingsData = {
        "logs_bottom": $('#activateLogsBottom')[0].checked,
        "light_mode_auto": $('#themeAuto')[0].checked,
        "light_mode": !$('#themeAuto')[0].checked && $('#checkNight')[0].checked
    }

    socket.emit('saveSettingsData', settingsData)
}
$('#activateLogsBottom').on('click', function (event, state) { 
    const value = event.target.checked
    if (value) {
        $("#logList_2_c").show()
        $("#logList_2").scrollTop($("#logList_2")[0].scrollHeight);
        $("body").css("height", "calc(100vh - 16px)")
    }else{
        $("#logList_2_c").hide()
        $("body").css("height", "100%")
    }
    saveSettingsData()
})

$('#checkNight').on('click', function (event, state) {
    const value = event.target.checked
    setTheme(value ? 'dark' : 'light')
    saveSettingsData()
})

$('#themeAuto').on('click', function (event, state) {
    const value = event.target.checked
    console.log(value)
    if (!settingsOnLoad) {
        if (value) {
            $('#checkNight_div').hide()
            setTheme("auto")
        }else{
            $('#checkNight_div').show()
            $('#checkNight').prop("checked", false)
            setTheme("light")
            console.log('a')
        }
    
        
    }
    saveSettingsData()
})


const getStoredTheme = () => localStorage.getItem('theme')
const setStoredTheme = theme => localStorage.setItem('theme', theme)

const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
        return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const setTheme = theme => {
    if (theme === 'auto') {
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
        hot.useTheme('ht-theme-main-dark-auto')
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
        if (theme === "dark") {
            hot.useTheme("ht-theme-main-dark")
        }else{
            hot.useTheme("ht-theme-main")
        }

    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
        setTheme(getPreferredTheme())
    }
})


$('#closeArduioWarn').on('click', function() {
    $('#connectArduinoWarn').hide()
})


// manual control

$('#mA_plus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateX 10")
})
$('#mA_minus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateX -10")
})
$('#mB_plus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateY 10")
})
$('#mB_minus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateY -10")
})
$('#mC_plus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateZ 10")
})
$('#mC_minus').on('click', function () {
    socket.emit('sendArduinoCommand', "rotateZ -10")
})

var motorsPositions = {
    "X": 0,
    "Y": 0,
    "Z": 0
}
socket.on("heartbreath", function(data) {
    motorsPositions = data.motorsPositions
})