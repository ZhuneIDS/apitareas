let token = null;

// cargar tareas
async function loadTasks() {
    try {
        if (!token) {
            console.warn("Intento de cargar tareas sin sesión iniciada.");
            alert("Debe iniciar sesión para ver las tareas.");
            return; // Prevents making the request without a token
        }

        const response = await fetch('/tareas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Error 401: No autorizado. No hay token en la solicitud.");
                alert("Debe iniciar sesión para ver las tareas.");
            } else if (response.status === 403) {
                console.error("Error 403: Acceso prohibido. Token inválido.");
                alert("Su sesión ha expirado. Inicie sesión nuevamente.");
                token = null; // Reset token
                updateUI();
            } else {
                console.error(`Error al cargar tareas: ${response.status} - ${response.statusText}`);
                alert("Error al cargar las tareas. Intente más tarde.");
            }
            return;
        }

        const tasks = await response.json();
        console.log("Received tasks:", tasks);
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task';
            taskDiv.innerHTML = `
                <strong>${task.titulo}</strong>
                <p>${task.descripcion}</p>
                <button onclick="updateTask(${task.id})">Editar</button>
                <button onclick="deleteTask(${task.id})">Eliminar</button>
            `;
            taskList.appendChild(taskDiv);
        });

        console.log("Tareas cargadas correctamente.");

    } catch (error) {
        console.error("Error al cargar tareas:", error);
        alert("Ocurrió un error inesperado al cargar las tareas.");
    }
}


//usando window para que las funciones sean globales
//ya que se usan en el html (inline)
// actualizar tarea
// window.updateTask = async function (id) {
//     const titulo = prompt('Nuevo título:');
//     const descripcion = prompt('Nueva descripción:');
//     if (!titulo || !descripcion) {
//         alert("El título y la descripción no pueden estar vacíos.");
//         return;
//     }
//     const response = await fetch(`/tareas/${id}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ titulo, descripcion })
//     });

//     if (response.ok) {
//         alert('Tarea actualizada exitosamente');
//         loadTasks();
//     } else {
//         alert('Error al actualizar la tarea');
//     }
// };

window.updateTask = async function (id) {
    try {
        console.log(`Opening edit modal for task ID: ${id}`);

        const response = await fetch(`/tareas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Error fetching tasks.");
            return;
        }

        const tasks = await response.json();
        const task = tasks.find(t => t.id === id);

        if (!task) {
            alert("Tarea no encontrada.");
            return;
        }

        // Load modal if not already loaded
        if (!document.getElementById('editTaskModal')) {
            await loadEditTaskModal();
        }

        // Wait for the modal to be available in the DOM
        setTimeout(() => {
            const modal = document.getElementById('editTaskModal');
            document.getElementById('editTaskId').value = id;
            document.getElementById('editTaskTitle').value = task.titulo;
            document.getElementById('editTaskDescription').value = task.descripcion;
            modal.style.display = 'block';
        }, 200);
    } catch (error) {
        console.error("Error updating task:", error);
    }
};


// eliminar tarea
window.deleteTask = async function (id) {
    const response = await fetch(`/tareas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        alert('Tarea eliminada exitosamente');
        loadTasks();
    } else {
        alert('Error al eliminar la tarea');
    }
};

// Cargar tareas si hay un token
if (token) {
    loadTasks();
}

function updateUI() {
    const loginButton = document.getElementById("openLoginModal");
    const logoutSection = document.getElementById("logoutSection");
    const taskList = document.getElementById("taskList");

    if (token) {
        loginButton.style.display = "none";
        logoutSection.style.display = "block";
        console.log("Usuario autenticado. Cargando tareas...");
        loadTasks();
    } else {
        loginButton.style.display = "block";
        logoutSection.style.display = "none";
        taskList.innerHTML = "<p style='color: red;'>Debe iniciar sesión para ver las tareas.</p>";
        console.warn("Usuario no autenticado. No se pueden cargar tareas.");
    }
}

document.getElementById("logoutButton").addEventListener("click", () => {
    console.log("Cerrando sesión...");
    token = null;
    updateUI();
    alert("Sesión cerrada.");
});

updateUI()


// Function to load the modal HTML
async function loadRegisterModal() {
    try {
        const response = await fetch('register-modal.html');
        const html = await response.text();
        document.getElementById('modalContainer').innerHTML = html;

        setTimeout(() => {
            const modal = document.getElementById('registerModal');
            const closeModalButton = modal ? modal.querySelector('.close-modal') : null;
            const registerButton = document.getElementById('openRegisterModal');

            if (!modal) return;
            // Ensure modal starts hidden
            modal.style.display = "none";  // 💡 Add this line
            registerButton.addEventListener('click', () => {
                modal.style.display = 'block';
            });
            console.log("Close button:", closeModalButton);

            if (closeModalButton) {
                closeModalButton.addEventListener('click', () => {
                    console.log("Closing modal registration...");  // ✅ Should now log correctly
                    modal.style.display = 'none';
                });
            } else {
                console.error("Error: Close button not found in register modal.");
            }

            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    console.log("closing modal via backdrop");

                }
            });

            // Handle registration form submission
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const username = document.getElementById('registerUsername').value.trim();
                    const password = document.getElementById('registerPassword').value.trim();

                    if (!username || !password) {
                        alert("Ingrese usuario y contraseña válidos.");
                        return;
                    }

                    const response = await fetch('/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert('Usuario registrado exitosamente');
                        modal.style.display = 'none';
                    } else {
                        alert(`Error al registrar: ${data.error}`);
                    }
                });
            }
        }, 100);
    } catch (error) {
        console.error("Error loading register modal:", error);
    }
}

async function loadLoginModal() {
    try {
        const response = await fetch('login-modal.html');
        const html = await response.text();
        document.getElementById('loginModalContainer').innerHTML = html;

        setTimeout(() => {
            const modal = document.getElementById('loginModal');
            const closeModalButton = modal.querySelector('.close-modal');
            const loginButton = document.getElementById('openLoginModal');

            if (!modal) return;
            console.log("Login modal loaded successfully.", modal);

            // Ensure modal starts hidden
            modal.style.display = "none";  // 💡 Add this line

            loginButton.addEventListener('click', () => {
                modal.style.display = 'block';
            });

            if (closeModalButton) {
                closeModalButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Handle login form submission
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const username = document.getElementById('loginUsername').value.trim();
                    const password = document.getElementById('loginPassword').value.trim();

                    if (!username || !password) {
                        alert("Ingrese usuario y contraseña válidos.");
                        return;
                    }

                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        token = data.token;
                        updateUI();
                        alert("Inicio de sesión exitoso");
                        modal.style.display = 'none';
                        loadTasks();
                    } else {
                        alert("Error al iniciar sesión");
                    }
                });
            }
        }, 100);
    } catch (error) {
        console.error("Error loading login modal:", error);
    }
}

async function loadTaskModal() {
    try {
        const response = await fetch('task-modal.html');
        const html = await response.text();
        document.getElementById('taskModalContainer').innerHTML = html;

        setTimeout(() => {
            const modal = document.getElementById('taskModal');
            const closeModalButton = modal.querySelector('.close-modal');
            const taskButton = document.getElementById('openTaskModal');

            if (!modal) return;
            // Ensure modal starts hidden
            modal.style.display = "none";  // 💡 Add this line
            // Open modal
            taskButton.addEventListener('click', () => {
                modal.style.display = 'block';
            });

            // Close modal when clicking close button
            if (closeModalButton) {
                closeModalButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Close modal when clicking outside of it
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Handle Task Submission
            const taskForm = document.getElementById('taskForm');
            if (taskForm) {
                taskForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const titulo = document.getElementById('taskTitle').value.trim();
                    const descripcion = document.getElementById('taskDescription').value.trim();

                    if (!titulo || !descripcion) {
                        alert("Por favor, ingrese un título y una descripción.");
                        return;
                    }

                    const response = await fetch('/tareas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ titulo, descripcion })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert('Tarea agregada exitosamente');
                        modal.style.display = 'none';
                        loadTasks(); // Refresh task list
                    } else {
                        alert(`Error al agregar la tarea: ${data.error}`);
                    }
                });
            }
        }, 100);
    } catch (error) {
        console.error("Error loading task modal:", error);
    }
}

// async function loadEditTaskModal() {
//     try {
//         console.log("Loading edit task modal...");
//         const response = await fetch('edittask-modal.html');

//         if (!response.ok) {
//             console.error("Error loading edit task modal:", response.status, response.statusText);
//             return;
//         }
//         // Ensure modal starts hidden
//         // modal.style.display = "none";  // 💡 Add this line
//         const html = await response.text();
//         // document.getElementById('editTaskModalContainer').innerHTML = html;

//         setTimeout(() => {
//             const modal = document.getElementById('editTaskModal');
//             const closeModalButton = modal.querySelector('.close-modal');

//             if (!modal) {
//                 console.error("Error: Edit task modal HTML did not load properly.");
//                 return;
//             }

//             console.log("Edit task modal loaded successfully.");

//             // Close modal when clicking the close button
//             if (closeModalButton) {
//                 closeModalButton.addEventListener('click', () => {
//                     modal.style.display = 'none';
//                 });
//             }

//             // Close modal when clicking outside of it
//             window.addEventListener('click', (event) => {
//                 if (event.target === modal) {
//                     modal.style.display = 'none';
//                 }
//             });

//             // Handle form submission
//             const editTaskForm = document.getElementById('editTaskForm');
//             if (editTaskForm) {
//                 editTaskForm.addEventListener('submit', async (e) => {
//                     e.preventDefault();

//                     const id = document.getElementById('editTaskId').value;
//                     const titulo = document.getElementById('editTaskTitle').value.trim();
//                     const descripcion = document.getElementById('editTaskDescription').value.trim();

//                     if (!titulo || !descripcion) {
//                         alert("El título y la descripción no pueden estar vacíos.");
//                         return;
//                     }

//                     const response = await fetch(`/tareas/${id}`, {
//                         method: 'PUT',
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${token}`
//                         },
//                         body: JSON.stringify({ titulo, descripcion })
//                     });

//                     if (response.ok) {
//                         alert('Tarea actualizada exitosamente');
//                         modal.style.display = 'none';
//                         loadTasks(); // Refresh task list
//                     } else {
//                         alert('Error al actualizar la tarea');
//                     }
//                 });
//             }
//         }, 100);
//     } catch (error) {
//         console.error("Error loading edit task modal:", error);
//     }
// }

async function loadEditTaskModal() {
    try {
        console.log("Loading edit task modal...");
        const response = await fetch('edittask-modal.html');

        if (!response.ok) {
            console.error("Error loading edit task modal:", response.status, response.statusText);
            return;
        }

        const html = await response.text();
        const modalContainer = document.getElementById('editTaskModalContainer');

        if (!modalContainer) {
            console.error("🚨 ERROR: 'editTaskModalContainer' not found in DOM.");
            console.warn("Available IDs:", [...document.querySelectorAll('[id]')].map(el => el.id));
            return;
        }

        modalContainer.innerHTML = html;

        setTimeout(() => {
            const modal = document.getElementById('editTaskModal');

            if (!modal) {
                console.error("🚨 ERROR: 'editTaskModal' not found after loading HTML.");
                console.warn("Available IDs:", [...document.querySelectorAll('[id]')].map(el => el.id));
                return;
            }

            console.log("Edit task modal loaded successfully.");
            modal.style.display = "none"; // ✅ Now modal exists, safe to modify

            // Close modal when clicking the close button
            const closeModalButton = modal.querySelector('.close-modal');
            if (closeModalButton) {
                closeModalButton.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            } else {
                console.warn("⚠️ WARNING: No close button found in edit task modal.");
            }

            // Close modal when clicking outside
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Handle form submission
            const editTaskForm = document.getElementById('editTaskForm');
            if (editTaskForm) {
                editTaskForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    // Check if input fields exist
                    const editTaskIdInput = document.getElementById('editTaskId');
                    if (!editTaskIdInput) {
                        console.error("🚨 ERROR: 'editTaskId' input field not found.");
                        console.warn("Available IDs:", [...document.querySelectorAll('[id]')].map(el => el.id));
                        return;
                    }

                    const tituloInput = document.getElementById('editTaskTitle');
                    const descripcionInput = document.getElementById('editTaskDescription');

                    if (!tituloInput || !descripcionInput) {
                        console.error("🚨 ERROR: One or more required input fields are missing.");
                        return;
                    }

                    const id = editTaskIdInput.value;
                    const titulo = tituloInput.value.trim();
                    const descripcion = descripcionInput.value.trim();

                    if (!titulo || !descripcion) {
                        alert("El título y la descripción no pueden estar vacíos.");
                        return;
                    }

                    const updateResponse = await fetch(`/tareas/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ titulo, descripcion })
                    });

                    if (updateResponse.ok) {
                        alert('Tarea actualizada exitosamente');
                        modal.style.display = 'none';
                        loadTasks(); // Refresh task list
                    } else {
                        alert('Error al actualizar la tarea');
                    }
                });
            } else {
                console.warn("⚠️ WARNING: 'editTaskForm' not found in modal.");
            }
        }, 100);
    } catch (error) {
        console.error("🚨 ERROR: Failed to load edit task modal.", error);
    }
}


// async function loadModal(modalName) {
//     console.log(`Loading modal: ${modalName}`); // Log the modal name

//     try {
//         // Fetch the modal HTML from the corresponding file
//         const response = await fetch(`${modalName}-modal.html`);
//         const html = await response.text();

//         // Inject the modal HTML into the DOM
//         const modalContainer = document.getElementById(`${modalName}ModalContainer`);
//         modalContainer.innerHTML = html;

//         // Wait for the modal to be available in the DOM
//         setTimeout(() => {
//             const modal = document.getElementById(`${modalName}Modal`);
//             const closeModalButton = modal ? modal.querySelector('.close-modal') : null;
//             const openButton = document.getElementById(`open${modalName.charAt(0).toUpperCase() + modalName.slice(1)}Modal`);

//             if (!modal) {
//                 console.error(`Error: ${modalName} modal HTML did not load properly.`);
//                 return;
//             }

//             // Ensure modal starts hidden
//             modal.style.display = "none";

//             // Show modal when the open button is clicked
//             if (openButton) {
//                 openButton.addEventListener('click', () => {
//                     modal.style.display = 'block';
//                 });
//             }

//             // Hide modal when the close button is clicked
//             if (closeModalButton) {
//                 closeModalButton.addEventListener('click', () => {
//                     modal.style.display = 'none';
//                 });
//             }

//             // Hide modal when clicking outside of it
//             window.addEventListener('click', (event) => {
//                 if (event.target === modal) {
//                     modal.style.display = 'none';
//                 }
//             });

//             // Handle form submission (if applicable)
//             const form = document.getElementById(`${modalName}Form`);
//             if (form) {
//                 form.addEventListener('submit', async (e) => {
//                     e.preventDefault();

//                     // Handle form submission based on the modal type
//                     switch (modalName) {
//                         case 'register':
//                             const username = document.getElementById('registerUsername').value.trim();
//                             const password = document.getElementById('registerPassword').value.trim();

//                             if (!username || !password) {
//                                 alert("Ingrese usuario y contraseña válidos.");
//                                 return;
//                             }

//                             const registerResponse = await fetch('/register', {
//                                 method: 'POST',
//                                 headers: { 'Content-Type': 'application/json' },
//                                 body: JSON.stringify({ username, password })
//                             });

//                             const registerData = await registerResponse.json();

//                             if (registerResponse.ok) {
//                                 alert('Usuario registrado exitosamente');
//                                 modal.style.display = 'none';
//                             } else {
//                                 alert(`Error al registrar: ${registerData.error}`);
//                             }
//                             break;

//                         case 'login':
//                             const loginUsername = document.getElementById('loginUsername').value.trim();
//                             const loginPassword = document.getElementById('loginPassword').value.trim();

//                             if (!loginUsername || !loginPassword) {
//                                 alert("Ingrese usuario y contraseña válidos.");
//                                 return;
//                             }

//                             const loginResponse = await fetch('/login', {
//                                 method: 'POST',
//                                 headers: { 'Content-Type': 'application/json' },
//                                 body: JSON.stringify({ username: loginUsername, password: loginPassword })
//                             });

//                             const loginData = await loginResponse.json();

//                             if (loginResponse.ok) {
//                                 token = loginData.token;
//                                 updateUI();
//                                 alert("Inicio de sesión exitoso");
//                                 modal.style.display = 'none';
//                                 loadTasks();
//                             } else {
//                                 alert("Error al iniciar sesión");
//                             }
//                             break;

//                         case 'task':
//                             const titulo = document.getElementById('taskTitle').value.trim();
//                             const descripcion = document.getElementById('taskDescription').value.trim();

//                             if (!titulo || !descripcion) {
//                                 alert("Por favor, ingrese un título y una descripción.");
//                                 return;
//                             }

//                             const taskResponse = await fetch('/tareas', {
//                                 method: 'POST',
//                                 headers: {
//                                     'Content-Type': 'application/json',
//                                     'Authorization': `Bearer ${token}`
//                                 },
//                                 body: JSON.stringify({ titulo, descripcion })
//                             });

//                             const taskData = await taskResponse.json();

//                             if (taskResponse.ok) {
//                                 alert('Tarea agregada exitosamente');
//                                 modal.style.display = 'none';
//                                 loadTasks(); // Refresh task list
//                             } else {
//                                 alert(`Error al agregar la tarea: ${taskData.error}`);
//                             }
//                             break;

//                         case 'editTask':
//                             const id = document.getElementById('editTaskId').value;
//                             const editTitulo = document.getElementById('editTaskTitle').value.trim();
//                             const editDescripcion = document.getElementById('editTaskDescription').value.trim();

//                             if (!editTitulo || !editDescripcion) {
//                                 alert("El título y la descripción no pueden estar vacíos.");
//                                 return;
//                             }

//                             const editTaskResponse = await fetch(`/tareas/${id}`, {
//                                 method: 'PUT',
//                                 headers: {
//                                     'Content-Type': 'application/json',
//                                     'Authorization': `Bearer ${token}`
//                                 },
//                                 body: JSON.stringify({ titulo: editTitulo, descripcion: editDescripcion })
//                             });

//                             if (editTaskResponse.ok) {
//                                 alert('Tarea actualizada exitosamente');
//                                 modal.style.display = 'none';
//                                 loadTasks(); // Refresh task list
//                             } else {
//                                 alert('Error al actualizar la tarea');
//                             }
//                             break;

//                         default:
//                             console.error(`Unknown modal type: ${modalName}`);
//                             break;
//                     }
//                 });
//             }
//         }, 100);
//     } catch (error) {
//         console.error(`Error loading ${modalName} modal:`, error);
//     }
// }

async function loadModal(modalName) {
    console.log(`Attempting to load modal: ${modalName}`); // Log modal name

    try {
        const response = await fetch(`${modalName}-modal.html`);

        if (!response.ok) {
            throw new Error(`Failed to fetch modal HTML (${response.status}: ${response.statusText})`);
        }

        const html = await response.text();
        const cleanedModalName = modalName.replace(/-/g, '');
        const modalContainerId = `${cleanedModalName}ModalContainer`;
        const modalContainer = document.getElementById(modalContainerId);

        if (!modalContainer) {
            console.error(`🚨 ERROR: Modal container not found! Expected ID: '${modalContainerId}'`);
            console.warn("Available IDs in the document:", [...document.querySelectorAll('[id]')].map(el => el.id));
            return;
        }

        modalContainer.innerHTML = html;

        const modalId = `${modalName.replace(/-/g, '')}Modal`;
        const modal = document.getElementById(modalId);

        const openButton = document.getElementById(`open${modalName.charAt(0).toUpperCase() + modalName.slice(1)}Modal`);
        const form = document.getElementById(`${modalName}Form`);

        if (!modal) {
            console.error(`🚨 ERROR: Modal element not found! Expected ID: '${modalName}Modal'`);
            console.warn("Available IDs in the document after modal load:", [...document.querySelectorAll('[id]')].map(el => el.id));
            return;
        }

        modal.style.display = "none"; // Ensure modal starts hidden

        if (openButton) {
            openButton.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        } else {
            console.warn(`⚠️ WARNING: No open button found for modal '${modalName}'. Expected ID: 'open${modalName.charAt(0).toUpperCase() + modalName.slice(1)}Modal'`);
        }

        // Attach close behavior
        const closeModalButton = modal.querySelector('.close-modal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        } else {
            console.warn(`⚠️ WARNING: No close button found for modal '${modalName}'.`);
        }

        // Handle form submission (if applicable)
        if (form) {
            if (!form.dataset.listenerAdded) {
                form.dataset.listenerAdded = "true"; // Prevent multiple listeners
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    switch (modalName) {
                        case 'register':
                            await handleRegister(modal);
                            break;
                        case 'login':
                            await handleLogin(modal);
                            break;
                        case 'task':
                            await handleTaskCreation(modal);
                            break;
                        case 'editTask':
                            await handleTaskEdit(modal);
                            break;
                        default:
                            console.error(`Unknown modal type: ${modalName}`);
                    }
                });
            }
        } else {
            console.warn(`⚠️ WARNING: No form found inside modal '${modalName}'. Expected ID: '${modalName}Form'`);
        }
    } catch (error) {
        console.error(`🚨 ERROR: Failed to load modal '${modalName}' due to an error.`);
        console.error(`Details: ${error.message}`);
    }
}


// Event delegation for closing modals when clicking outside
document.addEventListener('click', (event) => {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

async function handleRegister(modal) {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!username || !password) {
        alert("Ingrese usuario y contraseña válidos.");
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Usuario registrado exitosamente');
            modal.style.display = 'none';
        } else {
            alert(`Error al registrar: ${data.error}`);
        }
    } catch (error) {
        console.error("Error en registro:", error);
    }
}

async function handleLogin(modal) {
    console.log("handling loggin");
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert("Ingrese usuario y contraseña válidos.");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem("token", token);
            updateUI();
            alert("Inicio de sesión exitoso");
            modal.style.display = 'none';
            loadTasks();
        } else {
            alert("Error al iniciar sesión");
        }
    } catch (error) {
        console.error("Error en inicio de sesión:", error);
    }
}

async function handleTaskCreation(modal) {
    const titulo = document.getElementById('taskTitle').value.trim();
    const descripcion = document.getElementById('taskDescription').value.trim();

    if (!titulo || !descripcion) {
        alert("Por favor, ingrese un título y una descripción.");
        return;
    }

    try {
        const response = await fetch('/tareas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo, descripcion })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Tarea agregada exitosamente');
            modal.style.display = 'none';
            loadTasks();
        } else {
            alert(`Error al agregar la tarea: ${data.error}`);
        }
    } catch (error) {
        console.error("Error en la creación de tarea:", error);
    }
}

async function handleTaskEdit(modal) {
    console.log("in handleTaskEdit");
    
    const editTaskIdInput = document.getElementById('editTaskId');
    if (!editTaskIdInput) {
        console.error(`🚨 ERROR: 'editTaskId' input field not found!`);
        console.warn("Available IDs in the document:", [...document.querySelectorAll('[id]')].map(el => el.id));
        return;
    }
    editTaskIdInput.value = id;

    const titulo = document.getElementById('editTaskTitle').value.trim();
    const descripcion = document.getElementById('editTaskDescription').value.trim();

    if (!titulo || !descripcion) {
        alert("El título y la descripción no pueden estar vacíos.");
        return;
    }

    try {
        const response = await fetch(`/tareas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo, descripcion })
        });

        if (response.ok) {
            alert('Tarea actualizada exitosamente');
            modal.style.display = 'none';
            loadTasks();
        } else {
            alert('Error al actualizar la tarea');
        }
    } catch (error) {
        console.error("Error en edición de tarea:", error);
    }
}


// Ensure the modal loads when the page is fully ready
document.addEventListener("DOMContentLoaded", async () => {
    // loadRegisterModal();
    // loadLoginModal();
    // loadTaskModal();
    token = localStorage.getItem("token");
    console.log("Retrieved token:", token);

    await Promise.all([
        loadModal('register'),
        loadModal('login'),
        loadModal('task'),
        loadModal('edittask')
    ]);

    console.log("All modals loaded.");

    // Load tasks if the user is logged in
    if (token) {
        loadTasks();
        
    }
});


