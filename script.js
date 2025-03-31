document.addEventListener("DOMContentLoaded", () => {
  // Menú móvil
  const menuToggle = document.querySelector(".menu-toggle")
  const navLinks = document.querySelector(".nav-links")

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active")

      // Cambiar el ícono del menú
      const icon = menuToggle.querySelector("i")
      if (icon.classList.contains("fa-bars")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  }

  // Testimonios slider simple
  const dots = document.querySelectorAll(".dot")
  const testimonials = document.querySelectorAll(".testimonial")

  if (dots.length && testimonials.length) {
    // Mostrar solo el primer testimonio inicialmente
    testimonials.forEach((testimonial, index) => {
      if (index !== 0) {
        testimonial.style.display = "none"
      }
    })

    // Manejar clics en los puntos
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        // Ocultar todos los testimonios
        testimonials.forEach((testimonial) => {
          testimonial.style.display = "none"
        })

        // Mostrar el testimonio seleccionado
        testimonials[index].style.display = "block"

        // Actualizar la clase activa
        dots.forEach((d) => d.classList.remove("active"))
        dot.classList.add("active")
      })
    })
  }

  // Desplazamiento suave para enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Ajuste para la barra de navegación
          behavior: "smooth",
        })

        // Cerrar el menú móvil si está abierto
        if (navLinks && navLinks.classList.contains("active")) {
          navLinks.classList.remove("active")
          const icon = menuToggle.querySelector("i")
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      }
    })
  })

  // Mejoras de accesibilidad para el teclado
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  focusableElements.forEach((element) => {
    element.addEventListener("keydown", (e) => {
      // Activar elementos con la tecla Enter o Space
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        element.click()
      }
    })
  })
})

