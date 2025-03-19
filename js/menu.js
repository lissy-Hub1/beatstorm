document.addEventListener("DOMContentLoaded", () => {

    
    let bgMusic = document.getElementById("bgMusic");
    bgMusic.volume = 0.8;

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

    
    document.querySelector("a[href='screens/game.html']").addEventListener("click", function(event) {
        const user = localStorage.getItem("user");
        if (!user) {
            event.preventDefault(); // Bloquea la redirección
            Swal.fire({
                title: "Inicia sesión",
                text: "Debes iniciar sesión para guardar tu progreso en el juego.",
                icon: "warning",
                confirmButtonText: "Iniciar sesión"
            }).then(() => {
                loginWithGoogle();
            });
        }
    });


});