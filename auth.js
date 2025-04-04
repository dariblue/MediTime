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
  function handleLogin(e) {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const remember = document.getElementById("remember")?.checked || false

    // Validar campos
    if (!email || !password) {
      showError(loginError, "Por favor, complete todos los campos")
      return
    }

    // Obtener usuarios registrados
    const users = JSON.parse(localStorage.getItem("meditime_users") || "[]")

    // Buscar usuario
    const user = users.find((u) => u.email === email)

    if (!user) {
      showError(loginError, "El correo electrónico no está registrado")
      return
    }

    if (user.password !== password) {
      showError(loginError, "Contraseña incorrecta")
      return
    }

    // Iniciar sesión
    loginUser(user, remember)
  }

  function handleRegistro(e) {
    e.preventDefault()

    const nombre = document.getElementById("nombre").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value
    const terms = document.getElementById("terms")?.checked || false

    // Validar campos
    if (!nombre || !email || !password || !confirmPassword) {
      showError(registroError, "Por favor, complete todos los campos")
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

    // Obtener usuarios registrados
    const users = JSON.parse(localStorage.getItem("meditime_users") || "[]")

    // Verificar si el email ya está registrado
    if (users.some((u) => u.email === email)) {
      showError(registroError, "Este correo electrónico ya está registrado")
      return
    }

    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      nombre,
      email,
      password,
      createdAt: new Date().toISOString(),
    }

    // Guardar usuario
    users.push(newUser)
    localStorage.setItem("meditime_users", JSON.stringify(users))

    // Iniciar sesión
    loginUser(newUser, false)
  }

  function loginUser(user, remember) {
    // Crear sesión
    const session = {
      userId: user.id,
      nombre: user.nombre,
      email: user.email,
      loggedInAt: new Date().toISOString(),
      remember,
    }

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

  function checkAuthentication() {
    // Verificar si estamos en una página de autenticación
    const isAuthPage =
      window.location.pathname.includes("login.html") || window.location.pathname.includes("registro.html")

    // Obtener sesión
    const session = JSON.parse(localStorage.getItem("meditime_session") || "null")

    if (session) {
      // Si ya está autenticado y está en una página de autenticación, redirigir a la página principal
      if (isAuthPage) {
        window.location.href = "index.html"
      }
    } else {
      // Si no está autenticado y no está en una página de autenticación, redirigir a login
      if (!isAuthPage) {
        window.location.href = "login.html"
      }
    }
  }
})

