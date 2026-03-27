
const canvas = document.getElementById('schemas-grue');

var data = {}
socket.on('data', (data) => {
    data = data;
});
const canvasSize = 1.2;
canvas.width = 1200;
canvas.height = 700;
// on load
window.addEventListener('resize', () => {
    // mettre a la taille le canvas

    // canvas.width = $('#v-pills-tabContent').width() *canvasSize;
    // canvas.height = canvas.width * (9/16);
    const ctx = canvas.getContext('2d');
});


$('#anglez-input').on('input', function() {
    data.angleZ = -parseFloat($(this).val()) * Math.PI / 180;
    console.log(data.angleZ)
});
$('#angle-input').on('input', function () {
    data.angle = parseFloat($(this).val()) * Math.PI / 180;
});
$('#ldroite-input').on('input', function () {
    data.ldroite = $(this).val()


    let Z = obtenirAngleBrasPourLigne(data.ldroite - 45) * Math.PI / 180;
    
    data.angleZ = -Z
    console.log(Z)
    data.angle = (parseFloat(-data.ldroite) + 45) * Math.PI / 180

    $('#angle-input').val(parseFloat(-data.ldroite) + 45)
    $('#anglez-input').val(obtenirAngleBrasPourLigne(data.ldroite - 45))

});

function obtenirAngleBrasPourLigne(angleBase) {
    const rayonCercle = 125; // Car diamètre = 250
    const distanceAuCote = rayonCercle * Math.cos(Math.PI / 4); // env. 88.39

    // 1. Conversion de l'angle de la base en radians
    const thetaRad = angleBase * (Math.PI / 180);

    // 2. Calcul de la portée horizontale (r) nécessaire pour rester sur la ligne
    const r = distanceAuCote / Math.cos(thetaRad);

    // 3. Calcul de l'angle de levée (phi) pour obtenir cette portée r
    // cos(phi) = r / rayonCercle
    const ratio = r / rayonCercle;

    // Sécurité pour éviter les erreurs d'arrondi (ne pas dépasser 1 ou -1)
    const phiRad = Math.acos(Math.min(1, Math.max(-1, ratio)));

    // 4. Retour en degrés
    return phiRad * (180 / Math.PI);
}



$('#length-input').on('input', function() {data.length = parseFloat($(this).val()); });
const ctx = canvas.getContext('2d');
draw();
function draw() {
// temporaire

    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // dessiner un cercle rouge pas plein au centre du canvas


    // SHEMAS VUE DE DESSUS
    var centerX = canvas.width / 2 - 250;
    var centerY = canvas.height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 250, 0, 2 * Math.PI);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();


    //cercle vue dessus
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;
    ctx.stroke();

    // fleche vue dessus
    const angle = data.angle || 0;
    const x = (centerX + 250 * Math.cos(angle) * Math.cos(-data.angleZ || 0))
    const y = (centerY + 250 * Math.sin(angle) * Math.cos(-data.angleZ || 0));
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;
    ctx.stroke();

    var vecX = centerX - 300;
    var vecY = centerY + 300;
    drawLine(vecX, vecY, vecX + 100, vecY, 'red', 2);
    drawText('X', vecX + 110, vecY + 5, 'red');
    drawLine(vecX, vecY, vecX, vecY - 100, 'green', 2);
    drawText('Z', vecX - 10, vecY - 110, 'green');

    drawLine(centerX + 250 * Math.cos(Math.PI / 4), centerY + 250 * Math.sin(Math.PI / 4), centerX + 250 * Math.cos(-Math.PI / 4), centerY + 250 * Math.sin(-Math.PI / 4), 'white', 2);





    // SHEMAS VUE DE COTE
    centerX = canvas.width / 2 + 250;

    drawRect(centerX - 25, centerY - 100, 10, 300, 'wheat')

    const x2 = centerX - 20 + Math.abs(300 * Math.cos(data.angleZ || 0));
    const y2 = centerY - 80 + (300 * Math.sin(data.angleZ || 0));
    drawLine(centerX - 20, centerY - 80, x2, y2, 'orange', 2);



    const length = data.length / 70 * 280 || 0;
    // ligne de longueur du cable
    drawLine(x2, y2, x2, y2 + length, 'blue', 2);

    //Ligne verticale de 200cm en blanc au centre du canvas
    drawLine(centerX - 25, centerY + 200, centerX + 300, centerY + 200, 'blue', 1);


    //ecrire la longueur de la ligne en orange en bas du canvas
    ctx.fillStyle = 'blue';
    ctx.font = '20px Arial';
    ctx.fillText('80cm', centerX + 285, centerY + 220);


    ctx.fillStyle = 'blue';
    ctx.font = '15px Arial';
    ctx.fillText(Math.abs(Math.floor(Math.cos(data.angleZ || 0) * 80)) +'cm', x2, centerY + 180);


    ctx.fillStyle = 'blue';
    ctx.font = '15px Arial';
    ctx.fillText((data.length || 0) + 'cm', x2, y2 + length + 10);

    var vecX = centerX - 50;
    var vecY = centerY + 300;
    drawLine(vecX, vecY, vecX + 100, vecY, 'red', 2);
    drawText('X', vecX + 110, vecY + 5, 'red');
    drawLine(vecX, vecY, vecX, vecY - 100, 'blue', 2);
    drawText('Y', vecX - 10, vecY - 110, 'blue');


    requestAnimationFrame(draw);
}


function drawLine(x1, y1, x2, y2, color, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}
function drawRect(x1, y1, x2, y2, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1, x2, y2);
}
function drawText(text, x, y, color, font) {ctx.fillStyle = color || "white"; ctx.font = font || "15px Arial"; ctx.fillText(text, x, y); }