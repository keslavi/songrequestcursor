import Router from '@koa/router';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const r = new Router();

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define data directory path
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const OPTIONS_FILE = path.join(DATA_DIR, 'options.json');

// Ensure data directory exists and has proper permissions
const ensureDataDirectory = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
    }
    // Ensure options file exists with proper permissions
    if (!fs.existsSync(OPTIONS_FILE)) {
        fs.writeFileSync(OPTIONS_FILE, JSON.stringify({}, null, 2), { mode: 0o644 });
    }
};

// Initialize data directory
ensureDataDirectory();

const readOptions = () => {
    try {
        const x = fs.readFileSync(OPTIONS_FILE, 'utf8');
        return JSON.parse(x);
    } catch (error) {
        console.error('Error reading options:', error);
        return {};
    }
}

const writeOptions = (data) => {
    try {
        fs.writeFileSync(OPTIONS_FILE, JSON.stringify(data, null, 2), { mode: 0o644 });
    } catch (error) {
        console.error('Error writing options:', error);
        throw new Error('Failed to write options data');
    }
}

r.get('/', async (ctx, next) => {
    const options = readOptions();
    ctx.body = options;
});

r.get('/:key', async (ctx, next) => {
    const options = readOptions();
    const value = options[ctx.params.key];
    if (value === undefined) {
        ctx.status = 404;
        ctx.body = { message: 'Option not found' };
        return;
    }
    ctx.body = { [ctx.params.key]: value };
});

r.post('/', async (ctx, next) => {
    const options = readOptions();
    const updates = ctx.request.body;

    // Update options
    Object.keys(updates).forEach(key => {
        options[key] = updates[key];
    });

    writeOptions(options);
    ctx.body = options;
});

r.post('/:key', async (ctx, next) => {
    const options = readOptions();
    const { key } = ctx.params;
    const value = ctx.request.body.value;

    options[key] = value;
    writeOptions(options);
    ctx.body = { [key]: value };
});

export default r; 