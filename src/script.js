// Configurações globais
const API_BASE_URL = "/api.php/tasks";
let currentFilter = "all";
let currentSearch = "";

// Document Ready
$(document).ready(function () {
  loadTasks();
  setupEventListeners();
});

// Carrega as tarefas
async function loadTasks() {
  showLoading(true);

  try {
    const url = `${API_BASE_URL}?filter=${currentFilter}&search=${encodeURIComponent(
      currentSearch
    )}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Verificação adicional da estrutura dos dados
    if (!data || !data.success || !Array.isArray(data.tasks)) {
      throw new Error("Formato de dados inválido da API");
    }

    renderTasks(data.tasks);
    renderStats(data.stats || {});
  } catch (error) {
    showError("Erro ao carregar tarefas: " + error.message);
    console.error("Erro detalhado:", error);
  } finally {
    showLoading(false);
  }
}
// Renderiza as tarefas na tabela
function renderTasks(tasks) {
  const $tbody = $("#tasksTable tbody");
  $tbody.empty();

  if (tasks.length === 0) {
    $("#noTasks").removeClass("d-none");
    return;
  }

  $("#noTasks").addClass("d-none");

  tasks.forEach((task) => {
    const $row = $(`
            <tr data-id="${task.id}" data-status="${task.status}">
                <td class="d-none" >${task.id}</td>
                <td>
                    <div class="task-title">${task.title}</div>
                </td>
                <td>
                  <div class="task-description">${
                    task.description
                      ? task.description.replace(/\n/g, "<br>")
                      : "-"
                  }</div>
                </td>
                <td>
                    <span class="status-badge status-${task.status.replace(
                      " ",
                      "-"
                    )}">
                        ${getStatusLabel(task.status)}
                    </span>
                </td>
                <td>${formatDateTime(task.created_at)}</td>
                <td>${formatDateTime(task.updated_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action edit-btn" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action delete-btn" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `);

    $tbody.append($row);
  });
}

// Renderiza as estatísticas
function renderStats(stats) {
  const $statsContainer = $(".stats-cards");
  $statsContainer.empty();

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  const statsData = [
    { label: "Total", count: total, color: "primary", icon: "bi-list-check" },
    {
      label: "Pendentes",
      count: stats.pendente || 0,
      color: "secondary",
      icon: "bi-hourglass",
    },
    {
      label: "Em Andamento",
      count: stats["em andamento"] || 0,
      color: "warning",
      icon: "bi-arrow-repeat",
    },
    {
      label: "Finalizados",
      count: stats.finalizado || 0,
      color: "success",
      icon: "bi-check-circle",
    },
  ];

  statsData.forEach((stat) => {
    const $card = $(`
            <div class="col-md-3 col-sm-6">
                <div class="card bg-${stat.color} bg-opacity-10 border-${stat.color}">
                    <div class="card-body">
                        <div class="count text-${stat.color}">${stat.count}</div>
                        <div class="label">
                            <i class="bi ${stat.icon}"></i> ${stat.label}
                        </div>
                    </div>
                </div>
            </div>
        `);

    $statsContainer.append($card);
  });
}

// Configura os listeners de eventos
function setupEventListeners() {
  // Novo botão de tarefa
  $("#newTaskBtn").click(() => {
    resetTaskForm();
    $("#modalTitle").text("Nova Tarefa");
    $("#taskModal").modal("show");
  });

  // Formulário de tarefa
  $("#taskForm").submit(async function (e) {
    e.preventDefault();
    await saveTask();
  });

  // Filtros
  $(".filter-btn").click(function () {
    currentFilter = $(this).data("filter");
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");
    loadTasks();
  });

  // Pesquisa
  $("#searchBtn").click(() => {
    currentSearch = $("#searchInput").val();
    loadTasks();
  });

  $("#searchInput").keypress(function (e) {
    if (e.which === 13) {
      currentSearch = $(this).val();
      loadTasks();
    }
  });

  // Delegation para botões dinâmicos
  $("#tasksTable").on("click", ".edit-btn", async function () {
    const taskId = $(this).closest("tr").data("id");
    await editTask(taskId);
  });

  $("#tasksTable").on("click", ".delete-btn", function () {
    const taskId = $(this).closest("tr").data("id");
    confirmDelete(taskId);
  });
}

// Função para salvar tarefa (criar ou atualizar)
async function saveTask() {
  const taskId = $("#taskId").val();
  const isNew = !taskId;

  const taskData = {
    title: $("#taskTitle").val(),
    description: $("#taskDescription").val(),
    status: $("#taskStatus").val(),
  };

  try {
    const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${taskId}`;
    const method = isNew ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to save task");
    }

    $("#taskModal").modal("hide");
    showToast("Tarefa salva com sucesso!", "success");
    loadTasks();
  } catch (error) {
    showError("Erro ao salvar tarefa: " + error.message);
    console.error("Erro:", error);
  }
}

// Função para editar tarefa
async function editTask(taskId) {
  showLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/${taskId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.task) {
      throw new Error("Formato de dados inválido da API");
    }

    $("#taskId").val(data.task.id);
    $("#taskTitle").val(data.task.title);
    $("#taskDescription").val(data.task.description || "");
    $("#taskStatus").val(data.task.status);

    $("#modalTitle").text("Editar Tarefa");
    $("#taskModal").modal("show");
  } catch (error) {
    showError("Erro ao carregar tarefa para edição: " + error.message);
    console.error("Erro detalhado:", error);
  } finally {
    showLoading(false);
  }
}

// Função para confirmar exclusão
function confirmDelete(taskId) {
  $("#confirmAction")
    .off("click")
    .on("click", async function () {
      $("#confirmModal").modal("hide");
      await deleteTask(taskId);
    });

  $("#confirmMessage").html(`
        <p>Tem certeza que deseja excluir esta tarefa?</p>
        <p class="text-muted small">Esta ação não pode ser desfeita.</p>
    `);

  $("#confirmModal").modal("show");
}

// Função para excluir tarefa
async function deleteTask(taskId) {
  showLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/${taskId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to delete task");
    }

    showToast("Tarefa excluída com sucesso!", "success");
    loadTasks();
  } catch (error) {
    showError("Erro ao excluir tarefa: " + error.message);
    console.error("Erro:", error);
  } finally {
    showLoading(false);
  }
}

// Funções auxiliares
function resetTaskForm() {
  $("#taskId").val("");
  $("#taskForm")[0].reset();
  $("#taskStatus").val("pendente");
}

function showLoading(show) {
  if (show) {
    $("#loading").show();
    $("#tasksTable tbody").hide();
  } else {
    $("#loading").hide();
    $("#tasksTable tbody").show();
  }
}

function showError(message) {
  showToast(message, "danger");
}

function showToast(message, type = "success") {
  const iconMap = {
    success: "bi-check-circle",
    danger: "bi-exclamation-triangle",
    warning: "bi-exclamation-circle",
  };

  const toastClass = `text-bg-${type}`;
  const icon = iconMap[type] || "bi-info-circle";

  const $toast = $(`
    <div class="toast ${toastClass} border-0" role="alert" data-bs-autohide="true" data-bs-delay="5000">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  $("#toastContainer").append($toast);
  new bootstrap.Toast($toast[0]).show();

  // Remove o toast do DOM após ser escondido
  $toast.on("hidden.bs.toast", () => {
    $toast.remove();
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusLabel(status) {
  const labels = {
    pendente: "Pendente",
    "em andamento": "Em Andamento",
    finalizado: "Finalizado",
  };
  return labels[status] || status;
}
