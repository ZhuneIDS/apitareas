//dependencias
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//setup del servidor
const app = express();
const PORT = 3000;

// middleware para parsear el body de las peticiones
app.use(bodyParser.json());

 // middleware para servir archivos estáticos
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Archivos de datos
const TAREAS_FILE = 'tareas.json';
const USERS_FILE = 'users.json';

// asegurarse de que el archivo tareas.json exista
async function initializeTareasFile() {
    try {
        await fs.access(TAREAS_FILE);
    } catch (err) {
        await fs.writeFile(TAREAS_FILE, '[]', 'utf8');
    }
}

// asegurarse de que el archivo users.json exista
async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch (err) {
        await fs.writeFile(USERS_FILE, '[]', 'utf8');
    }
}

//funcion/middleware para autenticar el token
// esta funcion sera llamada en cada peticion que requiera autenticacion
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn(`[${new Date().toISOString()}] 🚨 Intento de acceso no autorizado a ${req.url}`);
        return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }

    jwt.verify(token, 'secreto', (err, user) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] ❌ Token inválido para ${req.url}`);
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = user;
        console.log(`[${new Date().toISOString()}] ✅ Usuario autenticado: ${user.username}`);
        next();
    });
};


// rutas
// GET /tareas
// pasamos authenticateToken como middleware como parametro
app.get('/tareas', authenticateToken, async (req, res) => { 
    try {
        const data = await fs.readFile(TAREAS_FILE, 'utf8');
        const tareas = JSON.parse(data);
        res.json(tareas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al leer las tareas' });
    }
});

// POST /tareas
// pasamos authenticateToken como middleware como parametro
app.post('/tareas', authenticateToken, async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;
        const data = await fs.readFile(TAREAS_FILE, 'utf8');
        const tareas = JSON.parse(data);
        const nuevaTarea = { id: Date.now(), titulo, descripcion };
        tareas.push(nuevaTarea);
        await fs.writeFile(TAREAS_FILE, JSON.stringify(tareas, null, 2));
        res.status(201).json(nuevaTarea);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al agregar la tarea' });
    }
});

// PUT /tareas/:id
// pasamos authenticateToken como middleware como parametro
app.put('/tareas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion } = req.body;
        const data = await fs.readFile(TAREAS_FILE, 'utf8');
        let tareas = JSON.parse(data);
        const tareaIndex = tareas.findIndex(t => t.id === parseInt(id));
        if (tareaIndex === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
        tareas[tareaIndex] = { ...tareas[tareaIndex], titulo, descripcion };
        await fs.writeFile(TAREAS_FILE, JSON.stringify(tareas, null, 2));
        res.json(tareas[tareaIndex]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// DELETE /tareas/:id
app.delete('/tareas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fs.readFile(TAREAS_FILE, 'utf8');
        let tareas = JSON.parse(data);
        tareas = tareas.filter(t => t.id !== parseInt(id));
        await fs.writeFile(TAREAS_FILE, JSON.stringify(tareas, null, 2));
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

// POST /register
app.post('/register', async (req, res) => {
    try {
        console.log("Received data:", req.body);
        const { username, password } = req.body;

        // checar si el usuario ya existe
        const users = await readUsers();
        const userExists = users.some(u => u.username === username);
        if (userExists) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // hacer hash de la contraseña y guardar el usuario
        const hashedPassword = await bcrypt.hash(password, 10); // sal = 10
        const newUser = { username, password: hashedPassword };
        users.push(newUser);
        await writeUsers(users);

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

// POST /login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Received data:", req.body);
        
        // encontrar el usuario
        const users = await readUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        // validar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // generar y firmar el token
        const token = jwt.sign({ username: user.username }, 'secreto');
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// leer usuarios del archivo
async function readUsers() {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
}

// escribir usuarios al archivo
async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// archivos .json
// inicializar archivo de usuarios y tareas
async function initialize() {
    try {
        await initializeTareasFile();
        await initializeUsersFile();
        console.log('Archivos inicializados correctamente');
    } catch (err) {
        console.error('Error al inicializar los archivos:', err);
    }
}

initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});
