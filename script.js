document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación
  checkAuthentication()

  // Configurar menú de usuario
  setupUserMenu()

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

  // Funciones de autenticación
  function checkAuthentication() {
    // Verificar si estamos en una página de autenticación
    const isAuthPage =
      window.location.pathname.includes("login.html") || window.location.pathname.includes("registro.html")

    // Verificar si estamos en la página de inicio
    const isHomePage =
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname.endsWith("/")

    // Verificar si estamos en la página de administración
    const isAdminPage = window.location.pathname.includes("admin.html")

    // Obtener sesión
    const session = JSON.parse(localStorage.getItem("meditime_session") || "null")

    if (session) {
      // Si ya está autenticado y está en una página de autenticación, redirigir a la página principal
      if (isAuthPage) {
        window.location.href = "index.html"
      }

      // Si está en la página de administración pero no es administrador, redirigir a la página principal
      if (isAdminPage && session.isAdmin !== true) {
        window.location.href = "index.html"
      }
    } else {
      // Si no está autenticado y no está en la página de inicio ni en una página de autenticación, redirigir a login
      if (!isAuthPage && !isHomePage) {
        window.location.href = "login.html"
      }
    }
  }

  function setupUserMenu() {
    // Obtener sesión
    const session = JSON.parse(localStorage.getItem("meditime_session") || "null")

    console.log("Sesión recuperada:", session) // Verificar la sesión recuperada
    console.log("isAdmin en sesión:", session?.isAdmin, "tipo:", typeof session?.isAdmin) // Verificar el valor y tipo

    // Obtener elementos del DOM
    const navLinks = document.querySelector(".nav-links")
    const authButtons = document.getElementById("auth-buttons")

    if (!navLinks) return

    if (session) {
      // Si el usuario está autenticado, ocultar botones de autenticación
      if (authButtons) {
        authButtons.style.display = "none"
      }

      // Crear menú de usuario
      const userMenu = document.createElement("li")
      userMenu.className = "user-menu"

      // Mostrar el nombre o el nombre completo si hay apellidos
      const displayName = session.apellidos ? `${session.nombre} ${session.apellidos.charAt(0)}.` : session.nombre

      // Preparar los elementos del menú
      let menuItems = `
        <li><a href="recordatorios.html"><i class="fas fa-pills"></i> Mis Recordatorios</a></li>
        <li><a href="calendario.html"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
        <li><a href="mi-perfil.html"><i class="fas fa-user"></i> Mi Perfil</a></li>
      `

      // Añadir enlace al panel de administración si el usuario es administrador
      if (session.isAdmin === true) {
        // Usar comparación estricta
        menuItems = `
          <li><a href="admin.html"><i class="fas fa-users-cog"></i> Panel de Administración</a></li>
          ${menuItems}
        `
      }

      // Añadir opción de cerrar sesión
      menuItems += `<li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>`

      userMenu.innerHTML = `
        <div class="user-menu-toggle">
          <span class="user-name">${displayName}</span>
          <i class="fas fa-user-circle"></i>
          <i class="fas fa-chevron-down"></i>
        </div>
        <ul class="user-dropdown">
          ${menuItems}
        </ul>
      `

      navLinks.appendChild(userMenu)

      // Manejar clic en el menú de usuario
      const userMenuToggle = userMenu.querySelector(".user-menu-toggle")
      const userDropdown = userMenu.querySelector(".user-dropdown")

      if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener("click", () => {
          userDropdown.classList.toggle("active")
        })

        // Cerrar al hacer clic fuera
        document.addEventListener("click", (e) => {
          if (!userMenu.contains(e.target)) {
            userDropdown.classList.remove("active")
          }
        })
      }

      // Manejar cerrar sesión
      const logoutBtn = document.getElementById("logout-btn")

      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault()
          logout()
        })
      }
    } else {
      // Si el usuario no está autenticado, mostrar botones de autenticación
      if (authButtons) {
        authButtons.style.display = "flex"
      }
    }
  }

  function logout() {
    // Eliminar sesión
    localStorage.removeItem("meditime_session")

    // Redirigir a login
    window.location.href = "login.html"
  }
})

