document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const addMedBtn = document.getElementById("add-med-btn")
  const addFirstMedBtn = document.getElementById("add-first-med")
  const medModal = document.getElementById("med-modal")
  const confirmModal = document.getElementById("confirm-modal")
  const closeModalBtns = document.querySelectorAll(".close-modal")
  const cancelarBtn = document.getElementById("cancelar-btn")
  const cancelDeleteBtn = document.getElementById("cancel-delete")
  const confirmDeleteBtn = document.getElementById("confirm-delete")
  const medForm = document.getElementById("med-form")
  const modalTitle = document.getElementById("modal-title")
  const filtroBtns = document.querySelectorAll(".filtro-btn")
  const recordatoriosContainer = document.getElementById("recordatorios-container")
  const frecuenciaSelect = document.getElementById("med-frecuencia")
  const horaGroup = document.getElementById("hora-group")
  const horasMultiplesGroup = document.getElementById("horas-multiples-group")
  const addHoraBtn = document.getElementById("add-hora-btn")
  const horasContainer = document.getElementById("horas-container")
  const miniCalendario = document.getElementById("mini-calendario")

  // Estado de la aplicación
  let currentFilter = "todos"
  let recordatorioToDelete = null
  let editingRecordatorioId = null
  let medicamentos = [] // Nuevo: Array para almacenar todos los medicamentos

  // Inicialización
  loadMedicamentos()
  renderMedicamentos()
  checkEmptyState()
  renderMiniCalendario()

  // Manejadores de eventos para abrir/cerrar modales
  if (addMedBtn) {
    addMedBtn.addEventListener("click", openAddModal)
  }

  if (addFirstMedBtn) {
    addFirstMedBtn.addEventListener("click", openAddModal)
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModals)
  })

  if (cancelarBtn) {
    cancelarBtn.addEventListener("click", closeModals)
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeModals)
  }

  // Cerrar modales al hacer clic fuera del contenido
  window.addEventListener("click", (event) => {
    if (event.target === medModal || event.target === confirmModal) {
      closeModals()
    }
  })

  // Manejar el envío del formulario
  if (medForm) {
    medForm.addEventListener("submit", handleFormSubmit)
  }

  // Manejar cambios en la selección de frecuencia
  if (frecuenciaSelect) {
    frecuenciaSelect.addEventListener("change", handleFrecuenciaChange)
  }

  // Manejar añadir nueva hora
  if (addHoraBtn) {
    addHoraBtn.addEventListener("click", addHoraInput)
  }

  // Manejar filtros
  filtroBtns.forEach((btn) => {
    btn.addEventListener("click", handleFilterClick)
  })

  // Configurar manejadores de eventos para los botones de acción
  setupActionButtons()

  // Manejar confirmación de eliminación
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", handleConfirmDelete)
  }

  // Funciones
  function openAddModal() {
    modalTitle.textContent = "Añadir Nuevo Medicamento"
    medModal.classList.add("active")
    document.getElementById("med-nombre").focus()
    resetForm()
  }

  function openEditModal(id) {
    const medicamento = getMedicamentoById(id)
    if (!medicamento) return

    modalTitle.textContent = "Editar Medicamento"

    // Rellenar el formulario con los datos existentes
    document.getElementById("med-nombre").value = medicamento.nombre
    document.getElementById("med-dosis").value = medicamento.dosis
    document.getElementById("med-frecuencia").value = medicamento.frecuencia
    document.getElementById("med-instrucciones").value = medicamento.instrucciones || ""

    if (medicamento.frecuencia === "personalizado") {
      horaGroup.style.display = "none"
      horasMultiplesGroup.style.display = "block"
      horasContainer.innerHTML = ""
      medicamento.horas.forEach((hora) => {
        addHoraInput(hora)
      })
    } else {
      horaGroup.style.display = "block"
      horasMultiplesGroup.style.display = "none"
      document.getElementById("med-hora").value = medicamento.horas[0]
    }

    editingRecordatorioId = id
    medModal.classList.add("active")
    document.getElementById("med-nombre").focus()
  }

  function openDeleteConfirmModal(id) {
    recordatorioToDelete = id
    confirmModal.classList.add("active")
  }

  function closeModals() {
    medModal.classList.remove("active")
    confirmModal.classList.remove("active")
    resetForm()
    editingRecordatorioId = null
  }

  function resetForm() {
    medForm.reset()
    horaGroup.style.display = "block"
    horasMultiplesGroup.style.display = "none"
    resetHorasMultiples()
  }

  function handleFormSubmit(e) {
    e.preventDefault()

    // Recoger datos del formulario
    const formData = new FormData(medForm)
    const frecuencia = formData.get("frecuencia")
    let horas = []

    if (frecuencia === "personalizado") {
      horas = Array.from(formData.getAll("horas-multiples[]"))
    } else {
      horas.push(formData.get("hora"))
    }

    const medicamento = {
      id: editingRecordatorioId || Date.now().toString(),
      nombre: formData.get("nombre"),
      dosis: formData.get("dosis"),
      frecuencia: frecuencia,
      horas: horas,
      instrucciones: formData.get("instrucciones"),
      estado: editingRecordatorioId ? getMedicamentoEstado(editingRecordatorioId) : "pendiente",
    }

    // Guardar o actualizar el medicamento
    if (editingRecordatorioId) {
      updateMedicamento(medicamento)
    } else {
      addMedicamento(medicamento)
    }

    closeModals()
    renderMedicamentos()
    saveMedicamentos()
    renderMiniCalendario()
  }

  function handleFrecuenciaChange() {
    if (this.value === "personalizado") {
      horaGroup.style.display = "none"
      horasMultiplesGroup.style.display = "block"
      if (horasContainer.children.length === 0) {
        addHoraInput()
      }
    } else {
      horaGroup.style.display = "block"
      horasMultiplesGroup.style.display = "none"
    }
  }

  function addHoraInput(valor = "") {
    const horaInput = document.createElement("div")
    horaInput.className = "hora-input"
    horaInput.innerHTML = `
            <input type="time" name="horas-multiples[]" required value="${valor}">
            <button type="button" class="btn-remove-hora">-</button>
        `
    horasContainer.appendChild(horaInput)

    horaInput.querySelector(".btn-remove-hora").addEventListener("click", () => {
      horasContainer.removeChild(horaInput)
    })
  }

  function resetHorasMultiples() {
    horasContainer.innerHTML = ""
    addHoraInput()
  }

  function handleFilterClick() {
    filtroBtns.forEach((b) => b.classList.remove("active"))
    this.classList.add("active")
    currentFilter = this.getAttribute("data-filter")
    applyFilter()
  }

  function handleConfirmDelete() {
    if (recordatorioToDelete) {
      deleteMedicamento(recordatorioToDelete)
      recordatorioToDelete = null
      closeModals()
    }
  }

  function addMedicamento(medicamento) {
    medicamentos.push(medicamento)
  }

  function updateMedicamento(medicamento) {
    const index = medicamentos.findIndex((m) => m.id === medicamento.id)
    if (index !== -1) {
      medicamentos[index] = medicamento
    }
  }

  function deleteMedicamento(id) {
    medicamentos = medicamentos.filter((m) => m.id !== id)
    renderMedicamentos()
    saveMedicamentos()
    renderMiniCalendario()
  }

  function toggleMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id)
    if (medicamento) {
      medicamento.estado = medicamento.estado === "pendiente" ? "completado" : "pendiente"
      renderMedicamentos()
      saveMedicamentos()
    }
  }

  function renderMedicamentos() {
    recordatoriosContainer.innerHTML = ""
    medicamentos.forEach((medicamento) => {
      medicamento.horas.forEach((hora) => {
        const recordatorioItem = createRecordatorioElement({ ...medicamento, hora: hora })
        recordatoriosContainer.appendChild(recordatorioItem)
      })
    })

    checkEmptyState()
    applyFilter()
    updateEstadisticas()
  }

  function createRecordatorioElement(medicamento) {
    const recordatorioItem = document.createElement("div")
    recordatorioItem.className = "recordatorio-item"
    recordatorioItem.setAttribute("data-estado", medicamento.estado)
    recordatorioItem.setAttribute("data-id", medicamento.id)

    recordatorioItem.innerHTML = `
            <div class="recordatorio-hora">
                <span class="hora">${medicamento.hora}</span>
            </div>
            <div class="recordatorio-info">
                <h4>${medicamento.nombre}</h4>
                <p>${medicamento.dosis}</p>
            </div>
            <div class="recordatorio-acciones">
                <button class="btn-accion btn-completar ${medicamento.estado === "completado" ? "completado" : ""}" aria-label="Marcar como ${medicamento.estado === "completado" ? "pendiente" : "completado"}">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-accion btn-editar" aria-label="Editar recordatorio">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-accion btn-eliminar" aria-label="Eliminar recordatorio">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `

    setupItemActionButtons(recordatorioItem)

    return recordatorioItem
  }

  function setupActionButtons() {
    const recordatorioItems = document.querySelectorAll(".recordatorio-item")
    recordatorioItems.forEach(setupItemActionButtons)
  }

  function setupItemActionButtons(item) {
    const id = item.getAttribute("data-id")

    const btnCompletar = item.querySelector(".btn-completar")
    const btnEditar = item.querySelector(".btn-editar")
    const btnEliminar = item.querySelector(".btn-eliminar")

    if (btnCompletar) {
      btnCompletar.addEventListener("click", () => {
        toggleMedicamentoEstado(id)
      })
    }

    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        openEditModal(id)
      })
    }

    if (btnEliminar) {
      btnEliminar.addEventListener("click", () => {
        openDeleteConfirmModal(id)
      })
    }
  }

  function applyFilter() {
    const recordatorioItems = document.querySelectorAll(".recordatorio-item")

    recordatorioItems.forEach((item) => {
      const estado = item.getAttribute("data-estado")

      if (
        currentFilter === "todos" ||
        (currentFilter === "pendientes" && estado === "pendiente") ||
        (currentFilter === "completados" && estado === "completado")
      ) {
        item.style.display = "flex"
      } else {
        item.style.display = "none"
      }
    })
  }

  function checkEmptyState() {
    const recordatorioItems = document.querySelectorAll(".recordatorio-item")
    const noRecordatorios = document.getElementById("no-recordatorios")

    if (recordatorioItems.length === 0 && noRecordatorios) {
      noRecordatorios.style.display = "block"
    } else if (noRecordatorios) {
      noRecordatorios.style.display = "none"
    }
  }

  function updateEstadisticas() {
    const totalItems = document.querySelectorAll(".recordatorio-item").length
    const completados = document.querySelectorAll('.recordatorio-item[data-estado="completado"]').length

    let porcentaje = 0
    if (totalItems > 0) {
      porcentaje = Math.round((completados / totalItems) * 100)
    }

    const estadisticas = document.querySelectorAll(".estadistica .valor")
    if (estadisticas.length >= 3) {
      estadisticas[0].textContent = porcentaje + "%"
      estadisticas[1].textContent = totalItems
    }
  }

  // Funciones de almacenamiento local
  function saveMedicamentos() {
    localStorage.setItem("medicamentos", JSON.stringify(medicamentos))
  }

  function loadMedicamentos() {
    const storedMedicamentos = localStorage.getItem("medicamentos")
    if (storedMedicamentos) {
      medicamentos = JSON.parse(storedMedicamentos)
    }
  }

  // Funciones para el mini calendario
  function renderMiniCalendario() {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    miniCalendario.innerHTML = ""

    // Añadir encabezados de días de la semana
    const diasSemana = ["D", "L", "M", "X", "J", "V", "S"]
    diasSemana.forEach((dia) => {
      const diaHeader = document.createElement("div")
      diaHeader.className = "calendar-header"
      diaHeader.textContent = dia
      miniCalendario.appendChild(diaHeader)
    })

    // Añadir espacios en blanco para el primer día del mes
    const primerDiaSemana = firstDay.getDay()
    for (let i = 0; i < primerDiaSemana; i++) {
      const emptyDay = document.createElement("div")
      emptyDay.className = "calendar-day empty"
      miniCalendario.appendChild(emptyDay)
    }

    // Añadir días del mes
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = document.createElement("div")
      day.className = "calendar-day"
      day.textContent = i

      if (i === today.getDate()) {
        day.classList.add("today")
      }

      if (hasMedicamentoOnDay(i)) {
        day.classList.add("has-med")
      }

      miniCalendario.appendChild(day)
    }
  }

  function hasMedicamentoOnDay(day) {
    const today = new Date()
    const checkDate = new Date(today.getFullYear(), today.getMonth(), day)

    return medicamentos.some((med) => {
      if (med.frecuencia === "diario") return true
      if (med.frecuencia === "dias-alternos" && day % 2 === 1) return true
      if (med.frecuencia === "semanal" && checkDate.getDay() === 1) return true // Asumimos que semanal es cada lunes
      return false
    })
  }

  function getMedicamentoById(id) {
    return medicamentos.find((med) => med.id === id)
  }

  function getMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id)
    return medicamento ? medicamento.estado : "pendiente"
  }

  // Inicializar la interfaz
  applyFilter()
  updateEstadisticas()
})

