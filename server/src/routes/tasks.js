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
const TASK_FILE = path.join(DATA_DIR, 'task.json');
const OPTIONS_FILE = path.join(DATA_DIR, 'options.json');

// Ensure data directory exists and has proper permissions
const ensureDataDirectory = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
    }
    // Ensure files exist with proper permissions
    if (!fs.existsSync(TASK_FILE)) {
        fs.writeFileSync(TASK_FILE, JSON.stringify([], null, 2), { mode: 0o644 });
    }
    if (!fs.existsSync(OPTIONS_FILE)) {
        fs.writeFileSync(OPTIONS_FILE, JSON.stringify({}, null, 2), { mode: 0o644 });
    }
};

// Initialize data directory
ensureDataDirectory();

const readData = () => {
    try {
        const x = fs.readFileSync(TASK_FILE, 'utf8');
        return JSON.parse(x);
    } catch (error) {
        console.error('Error reading task data:', error);
        return [];
    }
}

const writeData = (data) => {
    try {
        fs.writeFileSync(TASK_FILE, JSON.stringify(data, null, 2), { mode: 0o644 });
    } catch (error) {
        console.error('Error writing task data:', error);
        throw new Error('Failed to write task data');
    }
}

const readOptions = () => {
    try {
        const x = fs.readFileSync(OPTIONS_FILE, 'utf8');
        return JSON.parse(x);
    } catch (error) {
        console.error('Error reading options:', error);
        return {};
    }
}

r.get('/:id', async (ctx, next) => {
    const data = readData()
        .filter(function (data) { return data.id == ctx.params.id })[0];

    ctx.body = data;
})

r.get('/', async (ctx, next) => {
    const data = readData().filter(x=>x.id!==0);
    ctx.body = data
})

//NOTE: in the environments i frequently work in, PUT and DELETE aren't available
//UPSERT/DELETE
r.post('/', async (ctx, next) => {
    let data = readData();
    const req = ctx.request.body;

    if (req.delete) {
        console.log('delete')
        data = data.filter(x=>x.id !== req.id );
        req.deleted = true;
    }
    else if ((req.id || '0') !== '0') {
        console.log('update',req);
        const item = data.find(x=>x.id == req.id);
        if (item) {
          Object.keys(req).forEach((key) => {
            item[key] = req[key] || "";
          });
        }
    }
    else {
        const idNew = Math.max.apply(Math, data.map(function (o) { return o.id; })) + 1;
        console.log('adding', idNew);

        req.id=idNew;
        req.status = Number(req.status ||0);
        req.result = Number(req.result ||0);
        data.push(req);
    }

    writeData(data);

    req.success = true;

    ctx.body = req;
})

export default r; 