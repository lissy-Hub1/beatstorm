const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
canvas.width = 800;
canvas.height = 600;

let circles = [];  // Lista de círculos en el canvas
let currentSequence = [];  // Secuencia de colores para el jugador
let playerSequence = [];  // Secuencia de toques del jugador
let score = 0;  // Puntuación
let gameInterval;  // Intervalo para la generación de círculos
let circleColors = ['#FF00FF', '#00FFFF', '#FFFF00'];  // Colores de los círculos (rosa, azul y amarillo neón)
let gameOver = false;  // Estado del juego
let speed = 2000;  // Intervalo en milisegundos para generar nuevos círculos
let music = new Audio('ruta/a/tu/cancion.mp3');  // Música de fondo
music.loop = true;  // Reproducir música en bucle
let timeLimit = 3000;  // Tiempo límite para presionar un círculo (en milisegundos)

// Función para generar un círculo en una posición aleatoria
function createCircle() {
    const radius = 40;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = Math.random() * (canvas.height - 2 * radius) + radius;
    const color = circleColors[Math.floor(Math.random() * circleColors.length)];
    const timeOut = Date.now() + timeLimit;  // Asignar un límite de tiempo para presionar el círculo
    circles.push({ x, y, radius, color, timeOut });  // Añadir el círculo a la lista
}

// Función para dibujar los círculos en el canvas
function drawCircles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpiar el canvas
    for (const circle of circles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.stroke();
    }
}

// Detectar el clic en los círculos
canvas.addEventListener('click', (event) => {
    if (gameOver) return;  // Si el juego ha terminado, no hacer nada más

    const { offsetX, offsetY } = event;  // Obtener las coordenadas del clic con respecto al canvas
    const clickedCircleIndex = circles.findIndex(circle => {
        // Cálculo de la distancia desde el centro del círculo hasta el clic
        const distance = Math.sqrt((offsetX - circle.x) ** 2 + (offsetY - circle.y) ** 2);
        return distance < circle.radius;  // Si la distancia es menor que el radio del círculo
    });

    if (clickedCircleIndex !== -1) {
        // El jugador tocó un círculo correctamente
        const clickedCircle = circles[clickedCircleIndex];
        circles.splice(clickedCircleIndex, 1);  // Eliminar el círculo tocado
        playerSequence.push(clickedCircle.color);  // Guardar el color tocado en la secuencia del jugador

        // Comprobar si la secuencia del jugador es correcta
        if (playerSequence[playerSequence.length - 1] !== currentSequence[playerSequence.length - 1]) {
            gameOver = true;  // Si el jugador toca un círculo incorrecto, el juego termina
            clearInterval(gameInterval);
            Swal.fire({
                title: '¡Perdiste!',
                text: `Puntuación final: ${score}`,
                icon: 'error',
                confirmButtonText: 'Reiniciar',
            }).then(() => location.reload());  // Reiniciar el juego
        } else {
            // Aumentar la puntuación y mostrarla
            score++;
            scoreElement.textContent = score;

            // Verificar si el jugador ha completado la secuencia
            if (playerSequence.length === currentSequence.length) {
                playerSequence = [];  // Vaciar la secuencia del jugador
                currentSequence.push(circleColors[Math.floor(Math.random() * circleColors.length)]);  // Agregar un nuevo color a la secuencia
                spawnCircles();  // Generar nuevos círculos
            }
        }
    }
});

// Función para eliminar los círculos que no se han tocado a tiempo
function checkCircleTimeout() {
    const currentTime = Date.now();
    circles = circles.filter(circle => {
        if (currentTime > circle.timeOut) {
            // Si el tiempo se ha agotado, el jugador pierde
            gameOver = true;
            clearInterval(gameInterval);
            Swal.fire({
                title: '¡Perdiste!',
                text: `Puntuación final: ${score}`,
                icon: 'error',
                confirmButtonText: 'Reiniciar',
            }).then(() => location.reload());  // Reiniciar el juego
            return false;  // Eliminar el círculo
        }
        return true;  // Mantener el círculo
    });
}

// Función para crear y mostrar círculos
function spawnCircles() {
    createCircle();  // Crear un círculo nuevo
    drawCircles();  // Dibujar los círculos en el canvas
}

// Función para comenzar el juego
function startGame() {
    Swal.fire({
        title: '¡Estás listo para jugar?',
        text: 'El juego comenzará cuando hagas clic en "Comenzar".',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Comenzar',
        cancelButtonText: 'Cancelar',
    }).then(result => {
        if (result.isConfirmed) {
            //music.play();  // Reproducir la música
            gameInterval = setInterval(() => {
                spawnCircles();  // Crear y mostrar nuevos círculos en intervalos regulares
                checkCircleTimeout();  // Comprobar los círculos y eliminar los que se han agotado
            }, speed);

            currentSequence.push(circleColors[Math.floor(Math.random() * circleColors.length)]);  // Empezar la secuencia con un círculo
        }
    });
}

// Iniciar el juego cuando se carga la página
window.onload = () => {
    startGame();  // Llamar a la función para iniciar el juego
};
