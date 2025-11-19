const express = require('express');
const fs = require('fs');

const app = express();

const USERS_FILE = '/tmp/users.json';

app.get('/', (req, res) => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            const users = JSON.parse(data);
            res.json({ 
                success: true, 
                message: 'API is working',
                usersCount: users.length,
                users: users.map(u => ({ id: u.id, email: u.email, username: u.username }))
            });
        } else {
            res.json({ 
                success: true, 
                message: 'API is working - No users file yet',
                usersCount: 0
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
