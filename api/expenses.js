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
});

router.delete('/:userId/:expenseId', (req, res) => {
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
});

module.exports = router;
