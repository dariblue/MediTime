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
  const diasSemanaGroup = document.getElementById("dias-semana-group")
  const horasContainer = document.getElementById("horas-container")
  const addHoraBtn = document.getElementById("add-hora-btn")
  const miniCalendario = document.getElementById("mini-calendario")
  const porcentajeCumplimientoElement = document.getElementById("porcentaje-cumplimiento")
  const totalMedicamentosElement = document.getElementById("total-medicamentos")
  const totalDosisElement = document.getElementById("total-dosis")

  // Estado de la aplicación
  let currentFilter = "todos"
  let recordatorioToDelete = null
  let editingRecordatorioId = null
  let medicamentos = [] // Array para almacenar todos los medicamentos
  const currentDate = new Date() // Fecha actual para el mini calendario

  // Inicialización
  loadMedicamentos()
  renderMedicamentos()
  checkEmptyState()
  renderMiniCalendario()
  updateEstadisticas()

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
    addHoraBtn.addEventListener("click", () => addHoraInput())
  }

  // Manejar filtros
  filtroBtns.forEach((btn) => {
    btn.addEventListener("click", handleFilterClick)
  })

  // Manejar confirmación de eliminación
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", handleConfirmDelete)
  }

  // Establecer fecha de inicio por defecto
  const medInicio = document.getElementById("med-inicio")
  if (medInicio) {
    const today = new Date()
    medInicio.value = today.toISOString().split("T")[0]
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

    if (medicamento.inicio) {
      document.getElementById("med-inicio").value = medicamento.inicio
    }

    if (medicamento.fin) {
      document.getElementById("med-fin").value = medicamento.fin
    }

    // Manejar la frecuencia
    handleFrecuenciaChange.call(document.getElementById("med-frecuencia"))

    // Si es semanal, marcar los días seleccionados
    if (medicamento.frecuencia === "semanal" && medicamento.diasSemana) {
      medicamento.diasSemana.forEach((dia) => {
        const checkbox = document.getElementById(`dia-${getDiaSemanaName(dia)}`)
        if (checkbox) checkbox.checked = true
      })
    }

    // Limpiar y añadir las horas
    horasContainer.innerHTML = ""
    medicamento.horas.forEach((hora, index) => {
      addHoraInput(hora, index === 0)
    })

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

    // Establecer fecha de inicio por defecto
    const today = new Date()
    document.getElementById("med-inicio").value = today.toISOString().split("T")[0]

    // Ocultar selección de días de la semana
    diasSemanaGroup.style.display = "none"

    // Resetear horas
    horasContainer.innerHTML = ""
    addHoraInput("", true)
  }

  function handleFormSubmit(e) {
    e.preventDefault()

    // Recoger datos del formulario
    const formData = new FormData(medForm)
    const nombre = formData.get("nombre")
    const dosis = formData.get("dosis")
    const frecuencia = formData.get("frecuencia")
    const instrucciones = formData.get("instrucciones")
    const inicio = formData.get("inicio")
    const fin = formData.get("fin") || null

    // Recoger horas
    const horas = Array.from(formData.getAll("horas[]")).filter((hora) => hora)

    // Si no hay horas, mostrar error
    if (horas.length === 0) {
      alert("Debe especificar al menos una hora")
      return
    }

    // Recoger días de la semana para frecuencia semanal
    let diasSemana = []
    if (frecuencia === "semanal") {
      diasSemana = Array.from(formData.getAll("dias-semana")).map(Number)

      // Si no hay días seleccionados, mostrar error
      if (diasSemana.length === 0) {
        alert("Debe seleccionar al menos un día de la semana")
        return
      }
    }

    const medicamento = {
      id: editingRecordatorioId || Date.now().toString(),
      nombre,
      dosis,
      frecuencia,
      horas,
      instrucciones,
      inicio,
      fin,
      diasSemana,
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
    const frecuencia = this.value

    // Mostrar/ocultar selección de días de la semana
    if (frecuencia === "semanal") {
      diasSemanaGroup.style.display = "block"
    } else {
      diasSemanaGroup.style.display = "none"
    }
  }

  function addHoraInput(valor = "", isFirst = false) {
    const horaInput = document.createElement("div")
    horaInput.className = "hora-input"
    horaInput.innerHTML = `
      <input type="time" name="horas[]" required value="${valor}">
      <button type="button" class="btn-remove-hora" ${isFirst ? 'style="display: none;"' : ""}>
        <i class="fas fa-minus-circle"></i>
      </button>
    `
    horasContainer.appendChild(horaInput)

    // Añadir evento para eliminar hora
    const removeBtn = horaInput.querySelector(".btn-remove-hora")
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        horasContainer.removeChild(horaInput)

        // Si no quedan horas, añadir una vacía
        if (horasContainer.children.length === 0) {
          addHoraInput("", true)
        }
      })
    }
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
    updateEstadisticas()
  }

  function toggleMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id)
    if (medicamento) {
      medicamento.estado = medicamento.estado === "pendiente" ? "completado" : "pendiente"
      renderMedicamentos()
      saveMedicamentos()
      updateEstadisticas()
    }
  }

  function renderMedicamentos() {
    if (!recordatoriosContainer) return

    recordatoriosContainer.innerHTML = ""

    // Agrupar medicamentos por hora para el día actual
    const medicamentosHoy = getMedicamentosPorDia(new Date())

    if (medicamentosHoy.length === 0) {
      const noRecordatorios = document.getElementById("no-recordatorios")
      if (noRecordatorios) {
        noRecordatorios.style.display = "block"
      }
      return
    }

    // Ocultar mensaje de no recordatorios
    const noRecordatorios = document.getElementById("no-recordatorios")
    if (noRecordatorios) {
      noRecordatorios.style.display = "none"
    }

    // Ordenar por hora
    medicamentosHoy.sort((a, b) => a.hora.localeCompare(b.hora))

    // Renderizar cada medicamento
    medicamentosHoy.forEach((med) => {
      const recordatorioItem = createRecordatorioElement(med)
      recordatoriosContainer.appendChild(recordatorioItem)
    })

    applyFilter()
  }

  function createRecordatorioElement(medicamento) {
    const recordatorioItem = document.createElement("div")
    recordatorioItem.className = "recordatorio-item"
    recordatorioItem.setAttribute("data-estado", medicamento.estado)
    recordatorioItem.setAttribute("data-id", medicamento.id)

    // Formatear la hora para mostrar
    const horaFormateada = formatHora(medicamento.hora)

    // Formatear la frecuencia para mostrar
    const frecuenciaTexto = getFrecuenciaTexto(medicamento)

    recordatorioItem.innerHTML = `
      <div class="recordatorio-hora">
        <span class="hora">${horaFormateada}</span>
      </div>
      <div class="recordatorio-info">
        <h4>${medicamento.nombre}</h4>
        <p>${medicamento.dosis} - ${frecuenciaTexto}</p>
        ${medicamento.instrucciones ? `<p class="instrucciones">${medicamento.instrucciones}</p>` : ""}
      </div>
      <div class="recordatorio-acciones">
        <button class="btn-accion btn-completar ${medicamento.estado === "completado" ? "completado" : ""}" 
                aria-label="Marcar como ${medicamento.estado === "completado" ? "pendiente" : "completado"}">
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
    const noRecordatorios = document.getElementById("no-recordatorios")
    if (!noRecordatorios) return

    const medicamentosHoy = getMedicamentosPorDia(new Date())

    if (medicamentosHoy.length === 0) {
      noRecordatorios.style.display = "block"
    } else {
      noRecordatorios.style.display = "none"
    }
  }

  function updateEstadisticas() {
    if (!porcentajeCumplimientoElement || !totalMedicamentosElement || !totalDosisElement) return

    // Contar medicamentos únicos
    const medicamentosUnicos = new Set(medicamentos.map((med) => med.id)).size

    // Contar dosis diarias
    const medicamentosHoy = getMedicamentosPorDia(new Date())
    const dosisDiarias = medicamentosHoy.length

    // Calcular porcentaje de cumplimiento
    const completados = medicamentosHoy.filter((med) => med.estado === "completado").length
    let porcentaje = 0
    if (dosisDiarias > 0) {
      porcentaje = Math.round((completados / dosisDiarias) * 100)
    }

    // Actualizar elementos
    porcentajeCumplimientoElement.textContent = porcentaje + "%"
    totalMedicamentosElement.textContent = medicamentosUnicos
    totalDosisElement.textContent = dosisDiarias
  }

  // Funciones de almacenamiento local
  function saveMedicamentos() {
    localStorage.setItem("medicamentos", JSON.stringify(medicamentos))
  }

  function loadMedicamentos() {
    const storedMedicamentos = localStorage.getItem("medicamentos")
    if (storedMedicamentos) {
      medicamentos = JSON.parse(storedMedicamentos)
    } else {
      // Si no hay medicamentos guardados, crear algunos de ejemplo
      medicamentos = [
        {
          id: "1",
          nombre: "Paracetamol",
          dosis: "1 pastilla",
          frecuencia: "diario",
          horas: ["08:00"],
          instrucciones: "Tomar con el desayuno",
          inicio: "2025-01-01",
          fin: null,
          estado: "pendiente",
        },
        {
          id: "2",
          nombre: "Ibuprofeno",
          dosis: "1 pastilla",
          frecuencia: "dias-alternos",
          horas: ["13:00"],
          instrucciones: "Tomar después del almuerzo",
          inicio: "2025-01-01",
          fin: null,
          estado: "pendiente",
        },
        {
          id: "3",
          nombre: "Vitamina D",
          dosis: "1 cápsula",
          frecuencia: "semanal",
          horas: ["20:00"],
          instrucciones: "Tomar con la cena",
          inicio: "2025-01-01",
          fin: null,
          diasSemana: [1], // Lunes
          estado: "completado",
        },
      ]

      // Guardar medicamentos de ejemplo
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos))
    }
  }

  // Funciones para el mini calendario
  function renderMiniCalendario() {
    if (!miniCalendario) return

    miniCalendario.innerHTML = ""

    // Añadir encabezados de días de la semana
    const diasSemana = ["D", "L", "M", "X", "J", "V", "S"]
    diasSemana.forEach((dia) => {
      const diaHeader = document.createElement("div")
      diaHeader.className = "calendar-header"
      diaHeader.textContent = dia
      miniCalendario.appendChild(diaHeader)
    })

    // Obtener el primer día del mes
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    // Obtener el último día del mes
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Añadir espacios en blanco para el primer día del mes
    const primerDiaSemana = firstDay.getDay()
    for (let i = 0; i < primerDiaSemana; i++) {
      const emptyDay = document.createElement("div")
      emptyDay.className = "calendar-day otro-mes"

      // Calcular el día del mes anterior
      const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
      const prevMonthDay = prevMonthLastDay - primerDiaSemana + i + 1
      emptyDay.textContent = prevMonthDay

      miniCalendario.appendChild(emptyDay)
    }

    // Añadir días del mes
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = document.createElement("div")
      day.className = "calendar-day"
      day.textContent = i

      // Verificar si es hoy
      const today = new Date()
      if (
        i === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      ) {
        day.classList.add("today")
      }

      // Verificar si tiene medicamentos
      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      if (hasMedicamentoOnDay(checkDate)) {
        day.classList.add("has-med")
      }

      // Añadir evento de clic para ir a la página de calendario
      day.addEventListener("click", () => {
        window.location.href = "calendario.html"
      })

      miniCalendario.appendChild(day)
    }

    // Añadir días del mes siguiente para completar la última semana
    const ultimoDiaSemana = lastDay.getDay()
    const diasSiguienteMes = 6 - ultimoDiaSemana

    for (let i = 1; i <= diasSiguienteMes; i++) {
      const nextMonthDay = document.createElement("div")
      nextMonthDay.className = "calendar-day otro-mes"
      nextMonthDay.textContent = i
      miniCalendario.appendChild(nextMonthDay)
    }
  }

  function hasMedicamentoOnDay(date) {
    return getMedicamentosPorDia(date).length > 0
  }

  function getMedicamentosPorDia(date) {
    // Filtrar medicamentos según la fecha y frecuencia
    return medicamentos.flatMap((med) => {
      // Verificar si el medicamento debe tomarse en esta fecha según su frecuencia
      if (debeTomarseMedicamento(med, date)) {
        // Para cada hora del medicamento, crear una entrada
        return med.horas.map((hora) => ({
          ...med,
          hora: hora,
        }))
      }
      return []
    })
  }

  function debeTomarseMedicamento(medicamento, date) {
    // Verificar fechas de inicio y fin
    const fechaDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (medicamento.inicio) {
      const inicioDate = new Date(medicamento.inicio)
      if (fechaDate < inicioDate) return false
    }

    if (medicamento.fin) {
      const finDate = new Date(medicamento.fin)
      if (fechaDate > finDate) return false
    }

    // Verificar frecuencia
    switch (medicamento.frecuencia) {
      case "diario":
        return true

      case "dias-alternos":
        // Calcular días desde una fecha de referencia
        const refDate = new Date(2025, 0, 1) // 1 de enero de 2025 como referencia
        const diffTime = Math.abs(fechaDate.getTime() - refDate.getTime())
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays % 2 === 0

      case "semanal":
        // Verificar si el día de la semana está en la lista de días seleccionados
        const diaSemana = fechaDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
        return medicamento.diasSemana && medicamento.diasSemana.includes(diaSemana)

      case "personalizado":
        // Aquí iría la lógica para frecuencias personalizadas
        // Por ahora, devolvemos true para mostrar el medicamento
        return true

      default:
        return false
    }
  }

  // Funciones de utilidad
  function getMedicamentoById(id) {
    return medicamentos.find((med) => med.id === id)
  }

  function getMedicamentoEstado(id) {
    const medicamento = getMedicamentoById(id)
    return medicamento ? medicamento.estado : "pendiente"
  }

  function formatHora(hora) {
    if (!hora) return ""

    // Convertir de formato 24h a 12h
    const [hours, minutes] = hora.split(":")
    const h = Number.parseInt(hours, 10)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }

  function getFrecuenciaTexto(medicamento) {
    switch (medicamento.frecuencia) {
      case "diario":
        return "Todos los días"

      case "dias-alternos":
        return "Días alternos"

      case "semanal":
        if (medicamento.diasSemana && medicamento.diasSemana.length > 0) {
          const diasTexto = medicamento.diasSemana.map((dia) => getDiaSemanaName(dia)).join(", ")
          return `Semanal (${diasTexto})`
        }
        return "Semanal"

      case "personalizado":
        return "Personalizado"

      default:
        return medicamento.frecuencia
    }
  }

  function getDiaSemanaName(dia) {
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    return diasSemana[dia]
  }
})

