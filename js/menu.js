// Escucha el evento "DOMContentLoaded", que se ejecuta cuando el contenido HTML ha sido completamente cargado
document.addEventListener("DOMContentLoaded", () => {

    // Obtiene el elemento de audio con el ID "bgMusic" y ajusta su volumen
    let bgMusic = document.getElementById("bgMusic");
    bgMusic.volume = 0.8; // Ajusta el volumen de la música al 80%

    /**
     * Función que reproduce la música de fondo cuando se invoca.
     * Si hay un error al intentar reproducir la música, se captura y se muestra en la consola.
     */
    function playMusic() {
        bgMusic.play().catch(error => {
            console.log("Error al reproducir automáticamente el audio:", error); // Muestra un mensaje de error en consola
        });

        // Elimina los escuchadores de eventos de click y touchstart después de que se haya reproducido la música
        document.removeEventListener("click", playMusic);
        document.removeEventListener("touchstart", playMusic);
    }

    // Muestra un cuadro de diálogo de bienvenida con información sobre el juego y un botón para aceptarlo
    Swal.fire({
        title: "¡Bienvenido a Beatstorm! 🎵", // Título del cuadro de diálogo
        text: "Sumérgete en el beat, afina tus reflejos y deja que la música te guíe. ¡Haz clic en 'Comenzar' para entrar en el ritmo!", // Texto con la descripción
        icon: "info", // Icono de información
        allowOutsideClick: false, // Deshabilita el cierre del cuadro de diálogo haciendo clic fuera de él
        allowEscapeKey: false, // Deshabilita el cierre del cuadro de diálogo presionando la tecla "Esc"
        confirmButtonText: "Aceptar" // Texto del botón que permite continuar
    }).then(() => {
        playMusic(); // Cuando el usuario presiona "Aceptar", se llama a la función playMusic()
    });

    // Agrega un evento de clic a un enlace para verificar si el usuario está autenticado antes de acceder a la página del juego
    document.querySelector("a[href='screens/game.html']").addEventListener("click", function(event) {
        // Obtiene el valor de "user" del almacenamiento local
        const user = localStorage.getItem("user");

        // Si el usuario no está autenticado, previene la acción predeterminada del enlace y muestra una advertencia
        if (!user) {
            event.preventDefault(); // Bloquea la redirección al juego
            Swal.fire({
                title: "Inicia sesión", // Título del cuadro de advertencia
                text: "Debes iniciar sesión para guardar tu progreso en el juego.", // Mensaje de advertencia
                icon: "warning", // Icono de advertencia
                confirmButtonText: "Iniciar sesión" // Texto del botón para iniciar sesión
            }).then(() => {
                loginWithGoogle(); // Si el usuario acepta, se llama a la función para iniciar sesión con Google
            });
        }
    });

});
