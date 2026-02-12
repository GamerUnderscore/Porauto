
const canvas = document.getElementById('schemas-grue');

var data = {}
socket.on('data', (data) => {
    data = data;
});


// on load
window.addEventListener('load', () => {
    // mettre a la taille le canvas

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext('2d');
});


$('#anglez-input').on('input', function() {
    data.angleZ = -parseFloat($(this).val()) * Math.PI / 180;
});
$('#angle-input').on('input', function () {
    data.angle = parseFloat($(this).val()) * Math.PI / 180;
});
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



    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();




    // dessiner une ligne du centre du canvas vers le rayons du cercle en fonction de data.angle
    const angle = data.angle || 0;
    const x = (centerX + 250 * Math.cos(angle) * Math.cos(-data.angleZ || 0))
    const y = (centerY + 250 * Math.sin(angle) * Math.cos(-data.angleZ || 0));
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();


    var vecX = centerX - 300;
    var vecY = centerY + 300;
    drawLine(vecX, vecY, vecX + 100, vecY, 'red', 2);
    drawText('X', vecX + 110, vecY + 5, 'red');
    drawLine(vecX, vecY, vecX, vecY - 100, 'green', 2);
    drawText('Z', vecX - 10, vecY - 110, 'green');




    // SHEMAS VUE DE COTE
    centerX = canvas.width / 2 + 250;

    ctx.fillStyle = 'red';
    ctx.fillRect(centerX - 25, centerY - 100, 10, 300);

    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY - 80);
    const x2 = centerX - 20 + Math.abs(300 * Math.cos(data.angleZ || 0));
    const y2 = centerY - 80 + (300 * Math.sin(data.angleZ || 0));
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();


    const length = data.length / 70 * 280 || 0;
    // ligne de longueur du cable
    drawLine(x2, y2, x2, y2 + length, 'white', 2);

    //Ligne verticale de 200cm en blanc au centre du canvas
    drawLine(centerX - 25, centerY + 200, centerX + 300, centerY + 200, 'white', 1);


    //ecrire la longueur de la ligne en orange en bas du canvas
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('80cm', centerX + 285, centerY + 220);


    ctx.fillStyle = 'white';
    ctx.font = '15px Arial';
    ctx.fillText(Math.abs(Math.floor(Math.cos(data.angleZ || 0) * 80)) +'cm', x2, centerY + 180);


    ctx.fillStyle = 'white';
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
function drawText(text, x, y, color, font) {ctx.fillStyle = color || "white"; ctx.font = font || "15px Arial"; ctx.fillText(text, x, y); }