let currentUser = null;

// Show/hide sections
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Password visibility toggle
function setupPasswordToggle(passwordId, toggleId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleButton = document.getElementById(toggleId);
    
    toggleButton.addEventListener('click', function() {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Update eye icon
        const icon = toggleButton.querySelector('i');
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        
        // Update aria-label for accessibility
        const state = isPassword ? 'Hide' : 'Show';
        toggleButton.setAttribute('aria-label', `${state} password`);
    });
}

// Password strength checker
function checkPasswordStrength(password) {
    let score = 0;
    
    if (!password) {
        return { level: '', text: 'Password strength' };
    }
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Determine strength level
    if (score <= 2) {
        return { level: 'weak', text: 'Weak password' };
    } else if (score <= 4) {
        return { level: 'medium', text: 'Medium strength password' };
    } else {
        return { level: 'strong', text: 'Strong password' };
    }
}

// Display message
function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showMessage('Logging in...', 'success');
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            showMessage('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    }
}

// Signup function
async function signup() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!firstName || !lastName || !email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    const username = `${firstName} ${lastName}`;
    
    try {
        showMessage('Creating account...', 'success');
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Registration successful! Please login.', 'success');
            showSection('login');
            // Clear form
            document.getElementById('firstName').value = '';
            document.getElementById('lastName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            // Reset strength meter
            document.getElementById('strengthMeter').className = 'strength-meter';
            document.getElementById('strengthText').textContent = 'Password strength';
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Dashboard Functions
async function loadDashboard() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (!userId) {
        window.location.href = '/';
        return;
    }
    
    // Update welcome message
    document.getElementById('welcomeUser').textContent = username;
    
    try {
        const response = await fetch(`/api/user/${userId}`);
        const userData = await response.json();
        
        currentUser = userData;
        updateDashboard(userData);
    } catch (error) {
        console.error('Dashboard load error:', error);
        showMessage('Failed to load dashboard data', 'error');
    }
}

function updateDashboard(userData) {
    // Update salary
    document.getElementById('currentSalary').textContent = userData.salary.toFixed(2);
    document.getElementById('totalSalary').textContent = userData.salary.toFixed(2);
    
    // Calculate and update expenses
    const totalExpenses = userData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBalance = userData.salary - totalExpenses;
    
    document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
    document.getElementById('remainingBalance').textContent = remainingBalance.toFixed(2);
    
    // Update expenses list
    updateExpensesList(userData.expenses);
}

function updateExpensesList(expenses) {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';
    
    if (expenses.length === 0) {
        expensesList.innerHTML = '<p style="color: #ccc; text-align: center;">No expenses recorded yet.</p>';
        return;
    }
    
    // Sort expenses by date (newest first)
    const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <div class="expense-header">
                <span class="expense-category">${formatCategory(expense.category)}</span>
                <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
            </div>
            <div class="expense-description">${expense.description}</div>
            <div class="expense-date">${formatDate(expense.date)}</div>
            <button class="delete-btn" onclick="deleteExpense('${expense.id}')">Delete</button>
        `;
        expensesList.appendChild(expenseItem);
    });
}

function formatCategory(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Salary functions
async function updateSalary() {
    const newSalary = parseFloat(document.getElementById('newSalary').value);
    
    if (!newSalary || newSalary <= 0) {
        showMessage('Please enter a valid salary amount', 'error');
        return;
    }
    
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`/api/salary/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ salary: newSalary })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('newSalary').value = '';
            loadDashboard(); // Reload dashboard data
            showMessage('Salary updated successfully!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Salary update error:', error);
        showMessage('Failed to update salary', 'error');
    }
}

// Expense functions
async function addExpense() {
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value;
    const date = document.getElementById('expenseDate').value;
    
    if (!category || !amount || !description || !date) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    
    if (amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }
    
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`/api/expenses/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, amount, description, date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('expenseForm').reset();
            loadDashboard(); // Reload dashboard data
            showMessage('Expense added successfully!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Add expense error:', error);
        showMessage('Failed to add expense', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`/api/expenses/${userId}/${expenseId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDashboard(); // Reload dashboard data
            showMessage('Expense deleted successfully!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        console.error('Delete expense error:', error);
        showMessage('Failed to delete expense', 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/';
}

// Test API connection
async function testAPI() {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('API Test:', data);
        return data.success;
    } catch (error) {
        console.error('API Test failed:', error);
        return false;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Test API connection on load
    testAPI().then(success => {
        if (!success) {
            console.warn('API connection test failed');
        }
    });
    
    // Setup password toggles for login page
    if (document.getElementById('loginPassword')) {
        setupPasswordToggle('loginPassword', 'toggleLoginPassword');
        setupPasswordToggle('signupPassword', 'toggleSignupPassword');
        
        // Setup password strength indicator
        const passwordInput = document.getElementById('signupPassword');
        const strengthMeter = document.getElementById('strengthMeter');
        const strengthText = document.getElementById('strengthText');
        
        if (passwordInput && strengthMeter && strengthText) {
            passwordInput.addEventListener('input', function() {
                const password = passwordInput.value;
                const strength = checkPasswordStrength(password);
                
                // Update strength meter
                strengthMeter.className = 'strength-meter';
                if (password.length > 0) {
                    strengthMeter.classList.add(`strength-${strength.level}`);
                    strengthText.textContent = strength.text;
                } else {
                    strengthText.textContent = 'Password strength';
                }
            });
        }
    }
    
    // Initialize dashboard if on dashboard page
    if (window.location.pathname.includes('dashboard')) {
        // Set today's date as default for expense date
        const expenseDate = document.getElementById('expenseDate');
        if (expenseDate) {
            expenseDate.valueAsDate = new Date();
        }
        loadDashboard();
    }
});
