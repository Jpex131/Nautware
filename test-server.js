const express = require('express');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'core', 'views'));
app.get('/login', (req, res) => res.render('login', { error: null }));
app.listen(3001, () => console.log('test server listening on 3001'));
