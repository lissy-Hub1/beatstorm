const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

let circles = [];
let score = 0;
let gameActive = false;
let gameOver = false;
let circleSpawnInterval = 600;
let currentCircleIndex = 0;
let sequence = [];
let intervalID = null;
let timeLimit = 3000;

const audio = new Audio();
const selectedSong = localStorage.getItem("selectedSong");

if (selectedSong) {
    audio.src = `../media/audio/${selectedSong}`; // Ruta donde están las canciones
} else {
    console.error("No se seleccionó ninguna canción.");
} 

let songDuration = 0;

// Sonido al tocar un círculo
const hitSound = new Audio("../media/audio/tap.mp3"); // Ruta del sonido al tocar

audio.addEventListener("loadedmetadata", () => {
    songDuration = audio.duration * 1000; // Convertir a milisegundos
});

// Clase de Círculos
class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.originalRadius = radius;
        this.radius = radius;
        this.color = color;
        this.timeCreated = Date.now();
        this.timeToDisappear = Date.now() + timeLimit;
        this.isDisappearing = false;
    }

    update() {
        let now = Date.now();
        let timeRemaining = this.timeToDisappear - now;

        if (timeRemaining > 100) {
            this.radius = this.originalRadius * (timeRemaining / timeLimit);
        } else if (!this.isDisappearing) {
            this.isDisappearing = true;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function getRandomColor() {
    const colors = ["#ff69b4", "#00bfff", "#ffff00"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Verifica si un círculo se solapa con otros
function isOverlapping(x, y, radius) {
    for (let circle of circles) {
        let distancia = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
        if (distancia < radius * 2) {
            return true; // Está demasiado cerca de otro círculo
        }
    }
    return false;
}

function addCircle() {
    if (circles.length >= 6 || gameOver) return;

    let x, y, color;
    let attempts = 0;

    do {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        attempts++;
    } while (isOverlapping(x, y, 80) && attempts < 20); // Evitar solapamientos

    color = getRandomColor();
    let circle = new Circle(x, y, 80, color);
    circles.push(circle);
    sequence.push(color);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles.forEach(circle => circle.draw());
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
}

function updateGame() {
    circles.forEach(circle => {
        if (circle.isDisappearing && !gameOver) {
            gameOver = true;
            clearInterval(intervalID);
            Swal.fire({
                title: "¡Juego Terminado!",
                text: `Puntaje final: ${score}`,
                confirmButtonText: "Volver",
            }).then(() => {
                window.history.back(); // Regresar a la página anterior
            });
        }
    });

    circles.forEach(circle => circle.update());
    drawGame();

    if (gameActive && !gameOver) {
        requestAnimationFrame(updateGame);
    }
}

// Manejo de clics
canvas.addEventListener("click", function (event) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    let clickedCorrectly = false;

    circles.forEach((circle, index) => {
        const distancia = Math.sqrt((clickX - circle.x) ** 2 + (clickY - circle.y) ** 2);
        if (distancia < circle.radius) {
            if (circle.color === sequence[currentCircleIndex]) {
                score++;
                currentCircleIndex++;
                circles.splice(index, 1);
                clickedCorrectly = true;
                
                // Reproducir sonido al tocar
                hitSound.currentTime = 0;
                hitSound.play();
            } else {
                gameOver = true;
                clearInterval(intervalID);
                audio.pause(); // Detener la música
                audio.currentTime = 0; // Reiniciar la música
                Swal.fire({
                    title: "¡Juego Terminado!",
                    text: `Puntaje final: ${score}`,
                    confirmButtonText: "Volver",
                }).then(() => {
                    window.history.back(); // Regresar a la página anterior
                });
            }
        }
    });

    if (clickedCorrectly && currentCircleIndex === sequence.length) {
        adjustGameSpeed();
    }
});

function adjustGameSpeed() {
    let currentTime = audio.currentTime * 1000; // Convertir a milisegundos

    if (currentTime < songDuration / 3) {
        circleSpawnInterval = 600;
    } else if (currentTime < (2 * songDuration) / 3) {
        circleSpawnInterval = 500;
    } else {
        circleSpawnInterval = 400;
    }

    clearInterval(intervalID);
    intervalID = setInterval(() => {
        if (gameActive && !gameOver) {
            addCircle();
        }
    }, circleSpawnInterval);
}

function startGame() {
    gameActive = true;
    gameOver = false;
    score = 0;
    currentCircleIndex = 0;
    circles = [];
    sequence = [];

    if (audio.paused) {
        audio.play();
    }

    adjustGameSpeed();
    updateGame();
}

function resetGame() {
    audio.currentTime = 0;
    startGame();
}

Swal.fire({
    title: "¡Bienvenido a Twistune!",
    text: "Haz clic en los círculos al ritmo de la música para ganar puntos.",
    confirmButtonText: "Jugar",
}).then(() => {
    startGame();
});
