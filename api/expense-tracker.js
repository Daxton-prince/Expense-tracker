const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');

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

// Middleware
app.use(express.json());

// Routes
app.post('/register', async (req, res) => {
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
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', { email });

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = readUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        console.log('Login successful:', user.email);

        res.json({ 
            success: true, 
            message: 'Login successful',
            userId: user.id,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.get('/user/:id', (req, res) => {
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
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/salary/:id', (req, res) => {
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
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/expenses/:id', (req, res) => {
    try {
        const { category, amount, description, date } = req.body;
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newExpense = {
            id: Date.now().toString(),
            category,
            amount: parseFloat(amount),
            description,
            date: date || new Date().toISOString().split('T')[0]
        };

        users[userIndex].expenses.push(newExpense);
        writeUsers(users);

        res.json({ success: true, message: 'Expense added successfully' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.delete('/expenses/:userId/:expenseId', (req, res) => {
    try {
        const { userId, expenseId } = req.params;
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[userIndex].expenses = users[userIndex].expenses.filter(
            expense => expense.id !== expenseId
        );

        writeUsers(users);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Health check
app.get('/test', (req, res) => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            const users = JSON.parse(data);
            res.json({ 
                success: true, 
                message: 'API is working',
                usersCount: users.length
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

// Export the app
module.exports = app;
