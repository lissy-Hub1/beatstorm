document.addEventListener("DOMContentLoaded", () => {

    
    let bgMusic = document.getElementById("bgMusic");
    bgMusic.volume = 0.1;

    function playMusic() {
        bgMusic.play().catch(error => {
            console.log("Error al reproducir automáticamente el audio:", error);
        });

        document.removeEventListener("click", playMusic);
        document.removeEventListener("touchstart", playMusic);
    }

    Swal.fire({
        title: "¡Bienvenido a Beatstorm! 🎵",
        text: "Sumérgete en el beat, afina tus reflejos y deja que la música te guíe. ¡Haz clic en 'Comenzar' para entrar en el ritmo!",
        icon: "info",
        allowOutsideClick: false, 
        allowEscapeKey: false, 
        confirmButtonText: "Aceptar"
    }).then(() => {
        playMusic();
    });
});