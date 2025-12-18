
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');

// ایجاد پوشه دیتا در صورت عدم وجود
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(PRICES_FILE)) fs.writeFileSync(PRICES_FILE, JSON.stringify(null));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// متغیرهای محیطی داکر برای ادمین
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'orchidpharmed';

// هلپر برای خواندن/نوشتن در فایل
const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// مقداردهی ادمین بر اساس ENV
const refreshAdmin = () => {
    let users = getUsers();
    let admin = users.find(u => u.isAdmin === true);
    if (!admin) {
        users.push({ username: ADMIN_USER, passwordHash: ADMIN_PASS, isAdmin: true, createdAt: new Date(), transactions: [] });
    } else {
        admin.username = ADMIN_USER;
        admin.passwordHash = ADMIN_PASS;
    }
    saveUsers(users);
};
refreshAdmin();

// --- API Endpoints ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.passwordHash === password);
    if (user) return res.json({ username: user.username, isAdmin: !!user.isAdmin });
    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    let users = getUsers();
    if (users.find(u => u.username === username)) return res.status(400).json({ message: 'یوزر موجود است' });
    const newUser = { username, passwordHash: password, createdAt: new Date(), transactions: [], isAdmin: false };
    users.push(newUser);
    saveUsers(users);
    res.json({ username: newUser.username, isAdmin: false });
});

app.get('/api/users', (req, res) => {
    const users = getUsers();
    res.json(users.map(u => ({ username: u.username, createdAt: u.createdAt, txCount: u.transactions.length, isAdmin: !!u.isAdmin })));
});

app.post('/api/users/delete', (req, res) => {
    const { username } = req.body;
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین اصلی غیرمجاز است' });
    let users = getUsers().filter(u => u.username !== username);
    saveUsers(users);
    res.json({ success: true });
});

app.post('/api/users/update-pass', (req, res) => {
    const { username, newPassword } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) user.passwordHash = newPassword;
    saveUsers(users);
    res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
    const { username } = req.query;
    const user = getUsers().find(u => u.username === username);
    res.json(user ? user.transactions : []);
});

app.post('/api/transactions', (req, res) => {
    const { username, transaction } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        const idx = user.transactions.findIndex(t => t.id === transaction.id);
        if (idx > -1) user.transactions[idx] = transaction;
        else user.transactions.push(transaction);
        saveUsers(users);
    }
    res.json({ success: true });
});

app.post('/api/transactions/delete', (req, res) => {
    const { username, txId } = req.body;
    let users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        user.transactions = user.transactions.filter(t => t.id !== txId);
        saveUsers(users);
    }
    res.json({ success: true });
});

app.get('/api/prices', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')));
});

app.post('/api/prices', (req, res) => {
    fs.writeFileSync(PRICES_FILE, JSON.stringify(req.body));
    res.json({ success: true });
});

// مسیرهای کلاینت
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
