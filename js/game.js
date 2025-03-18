import { db, collection, query, where, getDocs, getDoc,updateDoc, doc, setDoc } from './firebaseSettings.js';
const user = JSON.parse(localStorage.getItem('user'));

// Configuración del juego
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


function adjustCanvasSize() {
    if (window.innerHeight > window.innerWidth) {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.7;
    } else {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.8;
    }
}

adjustCanvasSize();

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
    audio.src = `../media/audio/${selectedSong}`; 
} else {
    console.error("No se seleccionó ninguna canción.");
} 

let songDuration = 0;

const hitSound = new Audio("../media/audio/tap.mp3"); 

audio.addEventListener("loadedmetadata", () => {
    songDuration = audio.duration * 1000; 
});

const baseRadius = Math.min(canvas.width, canvas.height) * 0.15;

class Circle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.originalRadius = baseRadius;
        this.radius = baseRadius;
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
        x = Math.random() * (canvas.width - baseRadius * 2) + baseRadius;
        y = Math.random() * (canvas.height - baseRadius * 2) + baseRadius;
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
            endGame(); // Llamamos a endGame cuando se acabe el tiempo
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
                endGame(); // Llamamos a endGame cuando el usuario hace clic en un círculo incorrecto
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

audio.addEventListener("ended", () => {
    endGame(); // Llamamos a endGame cuando termine la canción
});

// Función para finalizar el juego
function endGame() {
    gameOver = true;
    clearInterval(intervalID);
    saveScoreToFirestore(score);
    audio.pause(); // Detener la música
    audio.currentTime = 0; 
    
    Swal.fire({
        title: gameOver ? "¡Juego Terminado!" : "¡Felicidades!",
        text: `Puntaje final: ${score}`,
        confirmButtonText: "Volver",
    }).then(() => {
        window.history.back(); // Regresar a la página anterior
    });
}

async function saveScoreToFirestore(score) {
    try {
        if (user) {
            const userId = user.uid;
            const selectedSong = localStorage.getItem("selectedSongTitle"); // Obtener el nombre de la canción seleccionada
            console.log("Guardar score para la canción:", selectedSong);

            // Referencia al documento del usuario
            const userRef = doc(db, "users", userId);

            // Obtener el documento del usuario
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                // Si el documento del usuario ya existe, actualizamos el puntaje de la canción
                const userScores = userDoc.data().scores || {}; // Obtener los puntajes guardados (si existen)

                // Verificar si ya existe un puntaje para la canción seleccionada
                if (userScores[selectedSong] === undefined || score > userScores[selectedSong]) {
                    // Si no existe o el nuevo puntaje es más alto, lo actualizamos
                    userScores[selectedSong] = score;

                    // Actualizar el documento del usuario con el nuevo puntaje
                    await updateDoc(userRef, {
                        scores: userScores
                    });
                    console.log("Puntaje actualizado exitosamente para la canción:", selectedSong);
                } else {
                    console.log("El puntaje actual no es más alto. No se actualiza.");
                }
            } else {
                // Si el documento del usuario no existe, crearlo con el puntaje de la canción
                const initialScores = {
                    [selectedSong]: score
                };

                // Crear un nuevo documento para el usuario con los puntajes iniciales
                await setDoc(userRef, {
                    scores: initialScores
                });
                console.log("Documento de usuario creado y puntaje guardado para la canción:", selectedSong);
            }
        } else {
            console.log("Usuario no autenticado. No se puede guardar el puntaje.");
        }
    } catch (e) {
        console.error("Error al guardar el puntaje en Firestore:", e);
    }
}



Swal.fire({
    title: "¡Bienvenido a Twistune!",
    text: "Haz clic en los círculos al ritmo de la música para ganar puntos.",
    confirmButtonText: "Jugar",
}).then(() => {
    startGame();
});
