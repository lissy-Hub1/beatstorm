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

/**
 * Ajusta el tamaño del lienzo (canvas) en función de las dimensiones de la ventana.
 * Cambia el tamaño de los círculos según el tamaño del lienzo.
 */
function adjustCanvasSize() {
    if (window.innerHeight > window.innerWidth) {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.7;
        baseRadius = Math.min(canvas.width, canvas.height) * 0.18;
    } else {
        canvas.width = window.innerWidth * 0.7;
        canvas.height = window.innerHeight * 0.8;
        baseRadius = Math.min(canvas.width, canvas.height) * 0.11;
    }
}

adjustCanvasSize();
// Inicialización de las variables de juego
let circles = [];
let score = 0;
let gameActive = false;
let gameOver = false;
let circleSpawnInterval = 600;  // Intervalo de tiempo entre la aparición de círculos
let currentCircleIndex = 0;  // Índice del círculo actual en la secuencia
let sequence = [];  // Secuencia de colores para la secuencia de círculos
let intervalID = null;
let timeLimit = 3000;  // Tiempo límite para que un círculo desaparezca

// Reproducción del audio seleccionado
const audio = new Audio();
const selectedSong = localStorage.getItem("selectedSong");

// Si se ha seleccionado una canción, se establece su ruta para cargarla
if (selectedSong) {
    audio.src = `../media/audio/${selectedSong}`; 
} else {
    console.error("No se seleccionó ninguna canción.");
} 

let songDuration = 0;  // Duración de la canción

// Sonido que se reproduce cuando el jugador hace clic en un círculo correctamente
const hitSound = new Audio("../media/audio/tap.mp3"); 

// Obtener la duración de la canción cuando se carga completamente
audio.addEventListener("loadedmetadata", () => {
    songDuration = audio.duration * 1000; 
});


const circleImage = new Image();
circleImage.src = "https://cdn-icons-png.flaticon.com/512/17290/17290802.png"; 

// Clase que representa un círculo en el juego
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
        if (circleImage.complete) { 
            ctx.globalAlpha = this.opacity;
            ctx.shadowColor = this.color ;
            ctx.shadowBlur = 20;
            ctx.drawImage(circleImage, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            circleImage.onload = () => {
                ctx.globalAlpha = this.opacity;
                ctx.shadowColor = this.color ;
                ctx.shadowBlur = 20;
                ctx.drawImage(circleImage, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            };
        }
    }
}

// Función para obtener un color aleatorio
function getRandomColor() {
    const colors = ["#ff69b4", "#00bfff", "#ffff00"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Función para dibujar las ondas de sonido alrededor del lienzo
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

// Verifica si las ondas deben ser mostradas en función del puntaje
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

// Función para agregar un nuevo círculo al juego
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
    let currentTime = audio.currentTime * 1000; // Obtener el tiempo actual de la canción en milisegundos
    let discoState = document.getElementById("discoState"); // Elemento HTML que muestra el estado del disco
    let disco = document.getElementById("disco"); // Elemento HTML que representa el disco

    // Si el tiempo actual está en la primera etapa de la canción
    if (currentTime < songDuration / 3) {
        // Cambiar a la etapa inicial si no es la etapa actual
        if (currentStage !== "Etapa Inicial") {
            currentStage = "Etapa Inicial"; // Establecer la etapa actual
            colorStat = "#d69bfe"; // Color específico para la etapa inicial
            discoState.textContent = currentStage; // Actualizar el texto del estado
            disco.style.borderColor = colorStat; // Cambiar el color del borde del disco
            discoState.style.color = colorStat; // Cambiar el color del texto
        }
        circleSpawnInterval = 600; // Establecer intervalo de aparición de círculos para la etapa inicial
    } 
    // Si el tiempo actual está en la segunda etapa de la canción
    else if (currentTime < (2 * songDuration) / 3) {
        // Cambiar a la segunda etapa si no es la etapa actual
        if (currentStage !== "Segunda Etapa") {
            currentStage = "Segunda Etapa"; // Establecer la etapa actual
            drawSoundWaves(); // Dibujar ondas de sonido para la segunda etapa
            colorStat = getRandomColor(); // Obtener un color aleatorio para la etapa
            discoState.textContent = currentStage; // Actualizar el texto del estado
            disco.style.borderColor = colorStat; // Cambiar el color del borde del disco
            discoState.style.color = colorStat; // Cambiar el color del texto
        }
        circleSpawnInterval = 500; // Establecer intervalo de aparición de círculos para la segunda etapa
    } 
    // Si el tiempo actual está en la tercera etapa de la canción
    else {
        // Cambiar a la etapa final si no es la etapa actual
        if (currentStage !== "Etapa Final") {
            currentStage = "Etapa Final"; // Establecer la etapa actual
            colorStat = getRandomColor(); // Obtener un color aleatorio para la etapa final
            drawSoundWaves(); // Dibujar ondas de sonido para la etapa final
            discoState.textContent = currentStage; // Actualizar el texto del estado
            disco.style.borderColor = colorStat; // Cambiar el color del borde del disco
            discoState.style.color = colorStat; // Cambiar el color del texto
        }
        circleSpawnInterval = 400; // Establecer intervalo de aparición de círculos para la etapa final
    }

    // Detener cualquier intervalo existente antes de establecer uno nuevo
    clearInterval(intervalID);

    // Crear un nuevo intervalo que aparece círculos según el intervalo de la etapa actual
    intervalID = setInterval(() => {
        if (gameActive && !gameOver) {
            addCircle(); // Llamar a la función para agregar un círculo al juego
        }
    }, circleSpawnInterval); // Intervalo de aparición de círculos determinado por la etapa
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
