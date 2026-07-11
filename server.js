const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

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
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Basic mock authentication for testing Phase 1A server foundation
    if (email === 'admin@naut.com' && password === 'admin123') {
        req.session.userId = 1;
        req.session.username = 'Admin';
        return res.redirect('/dashboard');
    }
    res.render('login', { error: 'Invalid credentials. Use admin@naut.com / admin123 for testing.' });
});

app.post('/auth/register', (req, res) => {
    // Mock registration logic
    res.redirect('/login');
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

// Product Manejo inventory
app.get('/inventory', requireAuth, (req, res) => {
    res.render('inventory', { username: req.session.username });
});

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
