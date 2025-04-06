document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const loginForm = document.getElementById("login-form")
  const registroForm = document.getElementById("registro-form")
  const togglePasswordBtns = document.querySelectorAll(".toggle-password")
  const passwordInput = document.getElementById("password")
  const confirmPasswordInput = document.getElementById("confirm-password")
  const strengthBar = document.querySelector(".strength-bar")
  const strengthText = document.querySelector(".strength-text")
  const loginError = document.getElementById("login-error")
  const registroError = document.getElementById("registro-error")
  const registroSuccess = document.getElementById("registro-success")

  // API URL
  const API_URL = "http://localhost:5020"

  // Verificar si el usuario ya está autenticado
  checkAuthentication()

  // Manejar envío del formulario de login
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Manejar envío del formulario de registro
  if (registroForm) {
    registroForm.addEventListener("submit", handleRegistro)
  }

  // Manejar botones de mostrar/ocultar contraseña
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener("click", togglePasswordVisibility)
  })

  // Manejar medidor de seguridad de contraseña
  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordStrength)
  }

  // Funciones
  async function handleLogin(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideError(loginError)

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const remember = document.getElementById("remember")?.checked || false

    // Validar campos
    if (!email || !password) {
      showError(loginError, "Por favor, complete todos los campos")
      return
    }

    try {
      // Iniciar sesión con la API
      const response = await fetch(`${API_URL}/Usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          contrasena: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        showError(
          loginError,
          errorData.message || "Credenciales incorrectas. Por favor, verifique su email y contraseña.",
        )
        return
      }

      const responseData = await response.json()

      // Extraer los datos del usuario de la nueva estructura de respuesta
      const userData = responseData.usuario || responseData

      console.log("Datos de usuario recibidos:", userData) // Para depuración
      console.log("isAdmin recibido:", userData.isAdmin, "tipo:", typeof userData.isAdmin) // Verificar el valor y tipo

      // Iniciar sesión con los datos del usuario
      loginUser(
        {
          id: userData.iD_Usuario || userData.id || Date.now().toString(), // Usar un ID temporal si no viene
          nombre: userData.nombre || "Usuario", // Valor por defecto si no se obtiene el nombre
          apellidos: userData.apellidos || "",
          email: userData.email || email,
          isAdmin: userData.isAdmin, // La API ya devuelve un booleano
        },
        remember,
      )
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      showError(loginError, "Error de conexión. Por favor, inténtelo de nuevo más tarde.")
    }
  }

  async function handleRegistro(e) {
    e.preventDefault()

    // Ocultar mensajes previos
    hideError(registroError)
    hideError(registroSuccess)

    // Obtener datos del formulario
    const nombre = document.getElementById("nombre").value
    const apellidos = document.getElementById("apellidos").value
    const email = document.getElementById("email").value
    const telefono = document.getElementById("telefono").value || "0"
    const fechaNacimiento = document.getElementById("fecha_nacimiento").value
    const domicilio = document.getElementById("domicilio").value || ""
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value
    const notificaciones = document.getElementById("notificaciones")?.checked || false
    const terms = document.getElementById("terms")?.checked || false

    // Validar campos
    if (!nombre || !apellidos || !email || !password || !confirmPassword || !fechaNacimiento) {
      showError(registroError, "Por favor, complete todos los campos obligatorios")
      return
    }

    if (password !== confirmPassword) {
      showError(registroError, "Las contraseñas no coinciden")
      return
    }

    if (!terms) {
      showError(registroError, "Debe aceptar los términos y condiciones")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showError(registroError, "Por favor, ingrese un correo electrónico válido")
      return
    }

    // Crear objeto de usuario para la API
    const userData = {
      iD_Usuario: 0, // La API asignará el ID
      nombre: nombre,
      apellidos: apellidos,
      contrasena: password,
      fecha_Nacimiento: new Date(fechaNacimiento).toISOString(),
      email: email,
      telefono: Number.parseInt(telefono) || 0,
      domicilio: domicilio,
      notificaciones: notificaciones,
    }

    try {
      // Enviar datos a la API
      const response = await fetch(`${API_URL}/Usuarios/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        showError(registroError, errorData.message || "Error al registrar usuario. Intente nuevamente.")
        return
      }

      // Obtener datos del usuario registrado
      const registeredUser = await response.json()

      // Mostrar mensaje de éxito
      showSuccess(registroSuccess, "¡Registro exitoso! Redirigiendo al inicio de sesión...")

      // Redirigir a la página de inicio de sesión después de 2 segundos
      setTimeout(() => {
        window.location.href = "login.html"
      }, 2000)
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      showError(registroError, "Error de conexión. Por favor, inténtelo de nuevo más tarde.")
    }
  }

  function loginUser(user, remember) {
    // Crear sesión
    const session = {
      userId: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos || "",
      email: user.email,
      isAdmin: user.isAdmin, // Guardar el valor isAdmin en la sesión
      loggedInAt: new Date().toISOString(),
      remember,
    }

    console.log("Sesión creada:", session) // Verificar la sesión creada

    // Guardar sesión
    localStorage.setItem("meditime_session", JSON.stringify(session))

    // Redirigir a la página principal
    window.location.href = "index.html"
  }

  function togglePasswordVisibility() {
    const passwordField = this.parentElement.querySelector("input")
    const icon = this.querySelector("i")

    if (passwordField.type === "password") {
      passwordField.type = "text"
      icon.classList.remove("fa-eye")
      icon.classList.add("fa-eye-slash")
    } else {
      passwordField.type = "password"
      icon.classList.remove("fa-eye-slash")
      icon.classList.add("fa-eye")
    }
  }

  function updatePasswordStrength() {
    if (!strengthBar || !strengthText) return

    const password = this.value
    let strength = 0
    let feedback = "Seguridad de la contraseña"

    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25

    strengthBar.style.width = `${strength}%`

    if (strength <= 25) {
      strengthBar.style.backgroundColor = "#dc3545"
      feedback = "Débil"
    } else if (strength <= 50) {
      strengthBar.style.backgroundColor = "#ffc107"
      feedback = "Regular"
    } else if (strength <= 75) {
      strengthBar.style.backgroundColor = "#28a745"
      feedback = "Buena"
    } else {
      strengthBar.style.backgroundColor = "#20c997"
      feedback = "Excelente"
    }

    strengthText.textContent = feedback
  }

  function showError(element, message) {
    if (!element) return

    element.textContent = message
    element.style.display = "block"

    // Ocultar después de 5 segundos
    setTimeout(() => {
      element.style.display = "none"
    }, 5000)
  }

  function hideError(element) {
    if (!element) return
    element.style.display = "none"
  }

  function showSuccess(element, message) {
    if (!element) return

    element.textContent = message
    element.style.display = "block"
  }

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
})

