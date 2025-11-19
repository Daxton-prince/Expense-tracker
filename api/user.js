const express = require('express');
const fs = require('fs');

const app = express();

const USERS_FILE = '/tmp/users.json';

function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

app.get('/:id', (req, res) => {
    try {
        const users = readUsers();
        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userData } = user;
        res.json(userData);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;
