
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as cheerio from 'cheerio';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// Zod Validation Schemas
const usernameSchema = z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد').max(50).regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط شامل حروف، اعداد و _ باشد');
const passwordSchema = z.string().min(4, 'رمز عبور باید حداقل ۴ کاراکتر باشد').max(100);

const loginSchema = z.object({
    username: usernameSchema,
    password: passwordSchema
});

const registerSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
    displayName: z.string().max(100).optional(),
    securityQuestion: z.string().min(2, 'سوال امنیتی باید حداقل ۲ کاراکتر باشد').max(200),
    securityAnswer: z.string().min(2, 'پاسخ امنیتی باید حداقل ۲ کاراکتر باشد').max(100)
});

const resetPasswordSchema = z.object({
    username: usernameSchema,
    securityAnswer: z.string().min(2).max(100),
    newPassword: passwordSchema
});

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per window
    message: { message: 'تلاش‌های زیادی انجام شد. لطفاً ۱۵ دقیقه صبر کنید.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
    message: { message: 'تعداد درخواست‌ها بیش از حد مجاز است.' }
});

const BCRYPT_ROUNDS = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy in docker/nginx
const PORT = process.env.PORT || 8080;

// در محیط داکر یا پروداکشن، دیتا در پوشه /app/data ذخیره می‌شود
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const FALLBACK_PRICES = { usdToToman: 70000, eurToToman: 74000, gold18ToToman: 4700000 };
const ONE_HOUR_MS = 60 * 60 * 1000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh cache
const BRS_API_KEY = process.env.BRS_API_KEY || 'B77uGQj9kEfffrGK4Wu6xZnz9PGJEKBG';
const BRS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Memory Cache
let usersCache = [];
let pricesCache = null;

// اطمینان از وجود دایرکتوری داده‌ها
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data into memory on startup
try {
    if (fs.existsSync(USERS_FILE)) {
        usersCache = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
} catch (e) {
    console.error('Error loading users:', e);
    usersCache = [];
}

try {
    if (fs.existsSync(PRICES_FILE)) {
        pricesCache = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    } else {
        fs.writeFileSync(PRICES_FILE, JSON.stringify(null));
    }
} catch (e) {
    console.error('Error loading prices:', e);
    pricesCache = null;
}

if (!pricesCache) {
    pricesCache = {
        usdToToman: FALLBACK_PRICES.usdToToman,
        eurToToman: FALLBACK_PRICES.eurToToman,
        gold18ToToman: FALLBACK_PRICES.gold18ToToman,
        fiatPricesToman: {
            USD: FALLBACK_PRICES.usdToToman,
            EUR: FALLBACK_PRICES.eurToToman,
        },
        cryptoPricesToman: {
            USDT: FALLBACK_PRICES.usdToToman,
        },
        goldPricesToman: {
            GOLD18: FALLBACK_PRICES.gold18ToToman,
            '18AYAR': FALLBACK_PRICES.gold18ToToman,
        },
        fetchedAt: Date.now(),
    };

    fs.promises.writeFile(PRICES_FILE, JSON.stringify(pricesCache)).catch((err) => {
        console.error('Error initializing default prices:', err);
    });
}

const PERSIAN_DIGITS = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
};

const normalizeNumber = (value = '') => {
    const normalized = value
        .toString()
        .replace(/[۰-۹٠-٩]/g, (d) => PERSIAN_DIGITS[d] || d)
        .replace(/[٬,]/g, '')
        .replace(/[^0-9.]/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
};

const fetchBrsApiData = async () => {
    const res = await fetch(`https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${BRS_API_KEY}`, {
        headers: {
            'User-Agent': BRS_USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://brsapi.ir/'
        }
    });
    if (!res.ok) throw new Error(`BrsApi HTTP error: ${res.status}`);
    const json = await res.json();
    return json;
};

const processBrsMarketRates = (brsData) => {
    const fiatPrices = {};
    const cryptoPrices = {};
    const goldPrices = {};
    const changes24h = {};

    let usdRate = FALLBACK_PRICES.usdToToman;
    let eurRate = FALLBACK_PRICES.eurToToman;
    let gold18Rate = FALLBACK_PRICES.gold18ToToman;
    let worldGoldUsd = 0;
    let usdtRate = 0;

    // 1. Process Fiat Currencies
    if (Array.isArray(brsData.currency)) {
        brsData.currency.forEach(c => {
            const sym = c.symbol?.toUpperCase();
            const price = Number(c.price) || 0;
            const change = Number(c.change_percent) || 0;
            if (sym && price > 0) {
                fiatPrices[sym] = price;
                changes24h[sym] = change;
                if (sym === 'USD') usdRate = price;
                if (sym === 'EUR') eurRate = price;
                if (sym === 'USDT_IRT') usdtRate = price;
            }
        });
    }

    if (!usdtRate && fiatPrices.USD) {
        usdtRate = fiatPrices.USD;
    }

    // 2. Process Gold & Coins
    if (Array.isArray(brsData.gold)) {
        brsData.gold.forEach(g => {
            const sym = g.symbol;
            const price = Number(g.price) || 0;
            const change = Number(g.change_percent) || 0;

            if (sym === 'XAUUSD') {
                worldGoldUsd = price;
                changes24h['XAUUSD'] = change;
                changes24h['USD_XAU'] = change;
                goldPrices['USD_XAU'] = Math.round(price * usdRate);
                return;
            }

            if (price > 0) {
                goldPrices[sym] = price;
                changes24h[sym] = change;

                // Map to cmc-tracker symbols
                if (sym === 'IR_GOLD_18K') {
                    gold18Rate = price;
                    goldPrices['GOLD18'] = price;
                    goldPrices['18AYAR'] = price;
                    changes24h['GOLD18'] = change;
                    changes24h['18AYAR'] = change;
                } else if (sym === 'IR_GOLD_24K') {
                    goldPrices['GOLD24'] = price;
                    changes24h['GOLD24'] = change;
                } else if (sym === 'IR_GOLD_MELTED') {
                    goldPrices['ABSHODEH'] = price;
                    changes24h['ABSHODEH'] = change;
                } else if (sym === 'IR_COIN_EMAMI') {
                    goldPrices['SEKKEH'] = price;
                    goldPrices['EMAMI'] = price;
                    changes24h['SEKKEH'] = change;
                    changes24h['EMAMI'] = change;
                } else if (sym === 'IR_COIN_BAHAR') {
                    goldPrices['BAHAR'] = price;
                    changes24h['BAHAR'] = change;
                } else if (sym === 'IR_COIN_HALF') {
                    goldPrices['NIM'] = price;
                    changes24h['NIM'] = change;
                } else if (sym === 'IR_COIN_QUARTER') {
                    goldPrices['ROB'] = price;
                    changes24h['ROB'] = change;
                } else if (sym === 'IR_COIN_1G') {
                    goldPrices['SEK'] = price;
                    changes24h['SEK'] = change;
                }
            }
        });
    }

    // 3. Process Cryptocurrencies
    const cryptoUsdMultiplier = usdtRate || usdRate;
    if (Array.isArray(brsData.cryptocurrency)) {
        brsData.cryptocurrency.forEach(cr => {
            const sym = cr.symbol?.toUpperCase();
            const usdPrice = Number(cr.price) || 0;
            const change = Number(cr.change_percent) || 0;

            if (sym && usdPrice > 0) {
                const tomanPrice = sym === 'USDT'
                    ? cryptoUsdMultiplier
                    : Math.round(usdPrice * cryptoUsdMultiplier);
                cryptoPrices[sym] = tomanPrice;
                changes24h[sym] = change;
            }
        });
    }

    if (!cryptoPrices['USDT'] && cryptoUsdMultiplier) {
        cryptoPrices['USDT'] = cryptoUsdMultiplier;
    }

    return {
        usdToToman: usdRate,
        eurToToman: eurRate,
        gold18ToToman: gold18Rate,
        worldGoldUsd,
        fiatPricesToman: fiatPrices,
        cryptoPricesToman: cryptoPrices,
        goldPricesToman: goldPrices,
        changes24h,
        fetchedAt: Date.now()
    };
};

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
app.use(express.static(path.join(__dirname, 'dist')));

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

const getUsers = () => {
    return usersCache;
};

const saveUsers = async (users) => {
    usersCache = users; // Update Memory Immediately
    try {
        await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users to disk:', e);
    }
};

const refreshAdmin = async () => {
    let users = [...getUsers()]; // Clone to avoid mutation issues
    let adminIdx = users.findIndex(u => u.username === ADMIN_USER);
    let changed = false;

    if (adminIdx === -1) {
        users.push({
            username: ADMIN_USER,
            passwordHash: ADMIN_PASS,
            isAdmin: true,
            displayName: 'ادمین سیستم',
            createdAt: new Date(),
            transactions: [],
            securityQuestion: 'کلمه عبور پیش‌فرض ادمین؟',
            securityAnswerHash: ADMIN_PASS
        });
        changed = true;
    } else {
        if (users[adminIdx].passwordHash !== ADMIN_PASS || !users[adminIdx].isAdmin) {
            users[adminIdx].passwordHash = ADMIN_PASS;
            users[adminIdx].isAdmin = true;
            changed = true;
        }
        if (!users[adminIdx].displayName) {
            users[adminIdx].displayName = 'ادمین سیستم';
            changed = true;
        }
        if (!users[adminIdx].securityQuestion) {
            users[adminIdx].securityQuestion = 'کلمه عبور پیش‌فرض ادمین؟';
            changed = true;
        }
        if (!users[adminIdx].securityAnswerHash) {
            users[adminIdx].securityAnswerHash = ADMIN_PASS;
            changed = true;
        }
    }

    if (changed) await saveUsers(users);
};
refreshAdmin();

// ساده‌ترین مسیر برای ارسال لاگ‌های سمت کلاینت به لاگ‌های داکر
app.post('/api/logs', (req, res) => {
    const { level = 'info', message = '', context = {} } = req.body || {};
    const logLine = `[ClientLog][${level.toUpperCase()}] ${message}`;

    if (level === 'error' || level === 'warn') {
        console.error(logLine, context);
    } else {
        console.log(logLine, context);
    }

    res.json({ success: true });
});

// API Endpoints
app.post('/api/login', authLimiter, async (req, res) => {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password } = validation.data;
    username = username.toLowerCase();
    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // Check if password is hashed (bcrypt hashes start with $2)
    const isHashed = user.passwordHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        // Compare with bcrypt
        isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
        // Legacy plain text comparison (for migration)
        isMatch = user.passwordHash === password;

        // Migrate legacy password to bcrypt hash
        if (isMatch) {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const userIndex = users.findIndex(u => u.username === username);
            users[userIndex] = { ...users[userIndex], passwordHash: hashedPassword };
            await saveUsers(users);
            console.log(`[Security] Migrated password for user: ${username}`);
        }
    }

    if (isMatch) {
        return res.json({
            username: user.username,
            isAdmin: !!user.isAdmin,
            displayName: user.displayName || user.username
        });
    }

    res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.post('/api/register', authLimiter, async (req, res) => {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, password, displayName, securityQuestion, securityAnswer } = validation.data;
    username = username.toLowerCase();
    let users = [...getUsers()];

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'نام کاربری تکراری است' });
    }

    // Hash password and security answer
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), BCRYPT_ROUNDS);

    const newUser = {
        username,
        passwordHash: hashedPassword,
        displayName: displayName || username,
        createdAt: new Date(),
        transactions: [],
        isAdmin: false,
        securityQuestion,
        securityAnswerHash: hashedSecurityAnswer
    };

    users.push(newUser);
    await saveUsers(users);
    console.log(`[Security] New user registered with hashed credentials: ${username}`);
    res.json({ username: newUser.username, isAdmin: false, displayName: newUser.displayName });
});

app.get('/api/security-question', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.json({ securityQuestion: user.securityQuestion || 'سوال امنیتی ثبت نشده است' });
});

app.post('/api/reset-password', authLimiter, async (req, res) => {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0]?.message || 'داده‌های ورودی نامعتبر است' });
    }

    let { username, securityAnswer, newPassword } = validation.data;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    const user = users[userIndex];
    if (!user.securityAnswerHash) {
        return res.status(400).json({ message: 'سوال امنیتی ثبت نشده است' });
    }

    // Check if security answer is hashed
    const isHashed = user.securityAnswerHash?.startsWith('$2');
    let isMatch = false;

    if (isHashed) {
        isMatch = await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswerHash);
    } else {
        // Legacy plain text comparison
        isMatch = user.securityAnswerHash.toLowerCase() === securityAnswer.toLowerCase();
    }

    if (!isMatch) {
        return res.status(401).json({ message: 'پاسخ امنیتی اشتباه است' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    users[userIndex] = { ...user, passwordHash: hashedPassword };
    await saveUsers(users);
    console.log(`[Security] Password reset for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    res.json(getUsers().map(u => ({
        username: u.username,
        createdAt: u.createdAt,
        txCount: u.transactions.length,
        isAdmin: !!u.isAdmin,
        displayName: u.displayName || u.username
    })));
});

app.post('/api/users/delete', async (req, res) => {
    let { username } = req.body;
    username = username.toLowerCase();
    if (username === ADMIN_USER) return res.status(400).json({ message: 'حذف ادمین غیرمجاز است' });
    await saveUsers(getUsers().filter(u => u.username !== username));
    res.json({ success: true });
});

app.post('/api/users/update-pass', async (req, res) => {
    let { username, newPassword } = req.body;

    // Validate password
    const passValidation = passwordSchema.safeParse(newPassword);
    if (!passValidation.success) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
    }

    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    users[userIndex] = { ...users[userIndex], passwordHash: hashedPassword };
    await saveUsers(users);
    console.log(`[Security] Password updated for user: ${username}`);
    res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
    const username = req.query.username ? req.query.username.toLowerCase() : '';
    const user = getUsers().find(u => u.username === username);
    res.json(user ? user.transactions : []);
});

app.post('/api/transactions', async (req, res) => {
    let { username, transaction } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        // Create a copy of the user to update
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        const idx = user.transactions.findIndex(t => t.id === transaction.id);

        if (idx > -1) user.transactions[idx] = transaction;
        else user.transactions.push(transaction);

        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.post('/api/transactions/delete', async (req, res) => {
    let { username, id } = req.body;
    username = username.toLowerCase();
    let users = [...getUsers()];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        const user = { ...users[userIndex], transactions: [...users[userIndex].transactions] };
        user.transactions = user.transactions.filter(t => t.id !== id);
        users[userIndex] = user;
        await saveUsers(users);
    }
    res.json({ success: true });
});

app.get('/api/prices', (req, res) => {
    res.json(pricesCache);
});

app.get('/api/prices/refresh', async (req, res) => {
    try {
        const now = Date.now();
        const force = req.query.force === 'true';
        if (!force && pricesCache?.fetchedAt && now - pricesCache.fetchedAt < CACHE_TTL_MS) {
            return res.json({
                success: true,
                data: pricesCache,
                skipped: true,
                nextAllowedAt: pricesCache.fetchedAt + CACHE_TTL_MS,
                message: 'آخرین بروزرسانی کمتر از ۱۵ دقیقه پیش انجام شده است',
            });
        }

        let priceData;
        let sourceUsed = 'BrsApi.ir';

        try {
            const brsRaw = await fetchBrsApiData();
            priceData = processBrsMarketRates(brsRaw);
        } catch (brsErr) {
            console.error('[PriceService] BrsApi fetch error:', brsErr.message);
            // Fallback to cache if available
            if (pricesCache) {
                priceData = { ...pricesCache, fetchedAt: Date.now() };
                sourceUsed = 'Local Cache (Fallback)';
            } else {
                throw brsErr;
            }
        }

        pricesCache = priceData;
        try {
            await fs.promises.writeFile(PRICES_FILE, JSON.stringify(priceData, null, 2));
        } catch (err) {
            console.error('Error persisting refreshed prices:', err);
        }

        res.json({
            success: true,
            data: priceData,
            sources: [
                { title: 'وب‌سرویس جامع طلا، ارز و کریپتو (BrsApi)', uri: 'https://brsapi.ir' },
            ],
            nextAllowedAt: priceData.fetchedAt + CACHE_TTL_MS,
        });
    } catch (error) {
        console.error('Error refreshing prices:', error);
        res.status(500).json({ message: 'بروزرسانی قیمت‌ها با خطا مواجه شد' });
    }
});

app.post('/api/prices', async (req, res) => {
    pricesCache = req.body;
    try {
        await fs.promises.writeFile(PRICES_FILE, JSON.stringify(req.body));
    } catch (e) {
        console.error('Error saving prices:', e);
    }
    res.json({ success: true });
});

// SPA Routing: ارسال تمام درخواست‌های ناشناخته به ایندکس
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));
