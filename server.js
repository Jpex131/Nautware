const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const pool = require('./core/database/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'core', 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'nautware-dark-aerospace-secret-key-13579',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1',
            [email]
        );
        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid email or password.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.render('login', { error: 'Invalid email or password.' });
        }
        req.session.userId = user.id;
        req.session.username = user.first_name || user.email.split('@')[0];
        req.session.isAdmin = user.is_admin;
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

app.post('/auth/register', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    try {
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('register', { error: 'An account with that email already exists.' });
        }
        const hash = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
            [email, hash, first_name || '', last_name || '']
        );
        res.redirect('/login');
    } catch (err) {
        console.error('Register error:', err);
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { username: req.session.username });
});

app.get('/finance', requireAuth, (req, res) => {
    res.render('finance', { username: req.session.username });
});

app.get('/services', requireAuth, (req, res) => {
    res.render('services', { username: req.session.username });
});

const inventoryRouter = require('./modules/inventory/routes');
app.use('/inventory', inventoryRouter);

const orderRoutes = require('./modules/orders/routes');
app.use('/orders', orderRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'UP', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` NAUTWARE ERP Server is orbiting on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
