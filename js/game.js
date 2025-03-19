import { db, collection, query, where, getDocs, getDoc,updateDoc, doc, setDoc } from './firebaseSettings.js';
const user = JSON.parse(localStorage.getItem('user'));

// Configuración del juego
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let baseRadius ;

let waveRadius = 0; // Radio de las ondas
let waveSegments = 50; // Número de segmentos para las ondas
let waveExpanding = true; // Si las ondas están expandiéndose
let waveAnimationStarted = false; // Si la animación ya comenzó
let lastWaveScore = null;

function adjustCanvasSize() {
    if (window.innerHeight > window.innerWidth) {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.7;
        baseRadius = Math.min(canvas.width, canvas.height) * 0.15;
    } else {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.8;
        baseRadius = Math.min(canvas.width, canvas.height) * 0.095;
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
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius+5 , 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle  = this.color;
        ctx.stroke();
        ctx.closePath();
    }
}

function getRandomColor() {
    const colors = ["#ff69b4", "#00bfff", "#ffff00"];
    return colors[Math.floor(Math.random() * colors.length)];
}


function drawSoundWaves() {
    if (!waveAnimationStarted) {
        waveRadius = 0;
        waveExpanding = true;
        waveAnimationStarted = true;
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Color azul claro para simular ondas de sonido
    ctx.lineWidth = 2;

    // Dibujar las ondas como líneas alrededor del borde
    for (let i = 0; i < waveSegments; i++) {
        let angle = (i / waveSegments) * Math.PI * 2;
        let startX = (canvas.width / 2) + (waveRadius * Math.cos(angle));
        let startY = (canvas.height / 2) + (waveRadius * Math.sin(angle));
        
        let endX = (canvas.width / 2) + ((waveRadius + 10) * Math.cos(angle));
        let endY = (canvas.height / 2) + ((waveRadius + 10) * Math.sin(angle));

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Expansión de las ondas
    if (waveExpanding) {
        waveRadius += 5;
        if (waveRadius >= Math.max(canvas.width, canvas.height) / 2) {
            waveExpanding = false; // Detener expansión al alcanzar el radio máximo
        }
    } else {
        waveRadius -= 5; // Reducir el tamaño de la onda
        if (waveRadius <= 0) {
            waveAnimationStarted = false; // Resetear la animación de ondas
        }
    }
}


function checkForWaves() {
    
    if ((score >= 1500 && score <= 1600 )|| (score >= 7500 && score <= 7600 ) || (score >= 10000 && score <= 10100 )|| (score >= 15000 && score <= 15100 )) {
        drawSoundWaves();  
    }
}



// Verifica si un círculo se solapa con otros
function isOverlapping(x, y, radius) {
    for (let circle of circles) {
        let distancia = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
        if (distancia < radius * 2) {
            return true;
        }
    }
    return false;
}

function addCircle() {
    if (circles.length >= 6 || gameOver) return;

    let x, y, color;
    let attempts = 0;
    const minYPosition = canvas.height * 0.2;  
    const maxYPosition = canvas.height - baseRadius * 2;

    do {
        // Generar nuevas posiciones para los círculos
        x = Math.random() * (canvas.width - baseRadius * 2) + baseRadius;
        y = Math.random() * (maxYPosition - minYPosition) + minYPosition;

        // Asegurarse de que el círculo no esté en una posición fuera del rango permitido
        if (y < 200) {
            y = 200; 
        }

        attempts++;

        // Verifica si el círculo solapa con otros
    } while (isOverlapping(x, y, baseRadius) && attempts < 20); 

    if (attempts < 20) {  
        color = getRandomColor();
        let circle = new Circle(x, y, baseRadius, color);
        circles.push(circle);
        sequence.push(color);
    } else {
        console.log("No se pudo generar un círculo sin solapamientos tras 20 intentos.");
    }
}


function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles.forEach(circle => circle.draw());
    document.getElementById('discoScore').innerText = `${score}`
   
}

function updateGame() {
    circles.forEach(circle => {
        if (circle.isDisappearing && !gameOver) {
            endGame(); // Llamamos a endGame cuando se acabe el tiempo
        }
    });

    circles.forEach(circle => circle.update());
    drawGame();
    checkForWaves(); 

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
            const timeTaken = Date.now() - circle.timeCreated; 
            if (circle.color === sequence[currentCircleIndex]) {
                let points = 0;
                
                if (timeTaken < 500) {  // Si hizo clic en menos de 500ms
                    points = 100;
                } else {
                    points = 50;  // Si hizo clic después, sumar 50 puntos
                }
                score += points;
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

let currentStage = ""; // Variable para rastrear la etapa actual
let colorStat = "";

function adjustGameSpeed() {
    let currentTime = audio.currentTime * 1000; 
    let discoState = document.getElementById("discoState");
    let disco = document.getElementById("disco");

    if (currentTime < songDuration / 3) {
        if (currentStage !== "Etapa Inicial") {
            currentStage = "Etapa Inicial";
            colorStat = "#d69bfe"; 
            discoState.textContent = currentStage;
            disco.style.borderColor = colorStat;
            discoState.style.color = colorStat;
        }
        circleSpawnInterval = 600;
    } else if (currentTime < (2 * songDuration) / 3) {
        if (currentStage !== "Segunda Etapa") { 
            currentStage = "Segunda Etapa";
            drawSoundWaves();
            colorStat = getRandomColor();
            discoState.textContent = currentStage;
            disco.style.borderColor = colorStat;
            discoState.style.color = colorStat;
        }
        circleSpawnInterval = 500;
    } else {
        if (currentStage !== "Etapa Final") { 
            currentStage = "Etapa Final";
            colorStat = getRandomColor(); 
            drawSoundWaves();
            discoState.textContent = currentStage;
            disco.style.borderColor = colorStat;
            discoState.style.color = colorStat;
        }
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
    endGame(); 
});

function endGame() {
    gameOver = true;
    clearInterval(intervalID);
    saveScoreToFirestore(score);
    audio.pause(); // Detener la música
    audio.currentTime = 0; 
    
    Swal.fire({
        title: gameOver ? "¡Juego Terminado!" : "¡Felicidades!",
        text: `Puntaje final: ${score}`,
        showCancelButton: true,
        confirmButtonText: "Reiniciar",
        cancelButtonText: "Continuar",
        allowOutsideClick: false,
    }).then((result) => {
        if (result.isConfirmed) {
            
            resetGame();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
           
            window.history.back(); 
        }
    });
}

async function saveScoreToFirestore(score) {
    try {
        if (user) {
            const userId = user.uid;
            const selectedSong = localStorage.getItem("selectedSongTitle"); 
            const userRef = doc(db, "users", userId);

            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userScores = userDoc.data().scores || {}; 

                if (userScores[selectedSong] === undefined || score > userScores[selectedSong]) {
                    
                    userScores[selectedSong] = score;

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
    title: "¡Pulse para empezar !",
    text: "Haz clic en los círculos al ritmo de la música para ganar puntos.",
    confirmButtonText: "Jugar",
    allowOutsideClick: false,
}).then(() => {
    startGame();
});
