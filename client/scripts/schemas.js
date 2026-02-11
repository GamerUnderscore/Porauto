
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
draw();
function draw() {
// temporaire
    data.angle = Date.now() / 3000;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // dessiner un cercle rouge pas plein au centre du canvas


    // SHEMAS VUE DE DESSUS
    var centerX = canvas.width / 2 - 250;
    const centerY = canvas.height / 2;

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
    const x = centerX + 250 * Math.cos(angle);
    const y = centerY + 250 * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();



    centerX = canvas.width / 2 + 250;

    ctx.fillStyle = 'red';
    ctx.fillRect(centerX - 25, centerY - 250, 10, 500);

    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY - 220);
    const x2 = centerX - 20 + Math.abs(400 * Math.cos(angle));
    const y2 = centerY - 220 + (400 * Math.sin(angle));
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();


    //...

    requestAnimationFrame(draw);
}