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

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

router.post('/:id', (req, res) => {
    const { salary } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].salary = parseFloat(salary);
    writeUsers(users);

    res.json({ success: true, message: 'Salary updated successfully' });
});

module.exports = router;