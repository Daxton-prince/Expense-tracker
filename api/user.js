const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const USERS_FILE = '/tmp/users.json';

function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

router.get('/:id', (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userData } = user;
    res.json(userData);
});

module.exports = router;