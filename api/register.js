const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Create router directly without module.exports at top
const app = express();

// Use /tmp directory for serverless environments
const USERS_FILE = '/tmp/users.json';

// Initialize users file if it doesn't exist
function initializeUsersFile() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing users file:', error);
    }
}

function readUsers() {
    try {
        initializeUsersFile();
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

app.post('/', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('Registration attempt:', { username, email });

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = readUsers();
        
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
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

        console.log('User registered successfully:', newUser.email);

        res.json({ 
            success: true, 
            message: 'User created successfully',
            userId: newUser.id 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export for Vercel
module.exports = app;
