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

function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error writing users:', error);
        throw error;
    }
}

app.use(express.json());

app.post('/:id', (req, res) => {
    try {
        const { salary } = req.body;
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[userIndex].salary = parseFloat(salary);
        writeUsers(users);

        res.json({ success: true, message: 'Salary updated successfully' });
    } catch (error) {
        console.error('Error updating salary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;
