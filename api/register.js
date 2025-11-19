const express = require('express');
const bcrypt = require('bcryptjs');
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

router.post('/', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readUsers();
    
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        salary: 0,
        expenses: [],
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ 
        success: true, 
        message: 'User created successfully',
        userId: newUser.id 
    });
});

module.exports = router;