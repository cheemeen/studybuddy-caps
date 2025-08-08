const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Simple file-based storage (in production, use a proper database)
const USERS_FILE = 'users.json';
const USER_DATA_DIR = 'userdata';

// Ensure directories exist
if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR);
}

// Helper functions
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
    return [];
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

function loadUserData(userId) {
    try {
        const userDataFile = path.join(USER_DATA_DIR, `${userId}.json`);
        if (fs.existsSync(userDataFile)) {
            return JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    return null;
}

function saveUserData(userId, data) {
    try {
        const userDataFile = path.join(USER_DATA_DIR, `${userId}.json`);
        fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        return false;
    }
}

function hashPassword(password) {
    // Simple hash for demo - use bcrypt in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication endpoints
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const users = loadUsers();
    
    // Check if user already exists
    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username,
        email,
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
        totalScore: 0,
        level: 1
    };
    
    users.push(newUser);
    
    if (saveUsers(users)) {
        // Return user without password
        const userResponse = { ...newUser };
        delete userResponse.password;
        res.status(201).json({ user: userResponse });
    } else {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, email, password } = req.body;
    
    if ((!username && !email) || !password) {
        return res.status(400).json({ error: 'Username/email and password are required' });
    }
    
    const users = loadUsers();
    const user = users.find(u => 
        (u.username === username || u.email === email) && 
        u.password === hashPassword(password)
    );
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user without password
    const userResponse = { ...user };
    delete userResponse.password;
    res.json({ user: userResponse });
});

// Data sync endpoints
app.get('/api/userdata/:userId', (req, res) => {
    const { userId } = req.params;
    const userData = loadUserData(userId);
    
    if (userData) {
        res.json(userData);
    } else {
        res.status(404).json({ error: 'User data not found' });
    }
});

app.post('/api/userdata/:userId', (req, res) => {
    const { userId } = req.params;
    const userData = req.body;
    
    userData.lastSync = new Date().toISOString();
    
    if (saveUserData(userId, userData)) {
        // Update user's total score
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex].totalScore = userData.totalScore || 0;
            saveUsers(users);
        }
        
        res.json({ success: true, lastSync: userData.lastSync });
    } else {
        res.status(500).json({ error: 'Failed to save user data' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`StudyBuddy server running at http://localhost:${PORT}`);
    console.log('Features available:');
    console.log('- User signup and login');
    console.log('- Cross-device data sync');
    console.log('- Progress tracking');
});
