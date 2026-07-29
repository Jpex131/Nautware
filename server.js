const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const pool = require('./core/database/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'core', 'views'));

// Parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'nautware-dark-aerospace-secret-key-13579',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Serve static assets at identical routes referenced in index.html
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Authentication protection middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    // Redirect unauthorized users to login
    res.redirect('/login');
};

// --- PUBLIC ROUTES ---

// Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Register page
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Mock post login / register handlers for session setup/testing
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid credentials.' });
        }
        
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.first_name || email.split('@')[0];
            return res.redirect('/dashboard');
        } else {
            return res.render('login', { error: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An internal server error occurred.' });
    }
});

app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('register', { error: 'Email is already registered.' });
        }
        
        // Hash password and create user
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        await pool.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );
        
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred during registration.' });
    }
});

// Logout handler
app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// --- PROTECTED ROUTES ---

// Main ERP Dashboard overview
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { username: req.session.username });
});

// Finance Analitica dashboard
app.get('/finance', requireAuth, (req, res) => {
    res.render('finance', { username: req.session.username });
});

// Service Management calendar
app.get('/services', requireAuth, (req, res) => {
    res.render('services', { username: req.session.username });
});

// Product Manejo inventory (Modular Router)
const inventoryRoutes = require('./modules/inventory/routes');
app.use('/inventory', inventoryRoutes);

// --- SYSTEM ROUTES ---

// Health endpoint to monitor server and database status
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime(),
        database: {
            configured: !!process.env.DB_HOST,
            host: process.env.DB_HOST || 'not configured'
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` NAUTWARE ERP Server is orbiting on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
