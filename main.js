const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { compileAndRun, judgeSource } = require('./services/compilerService');
const { getProblem, getProblemForJudge, listProblems } = require('./services/problemService');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 820,
        minWidth: 900,
        minHeight: 620,
        title: 'AlgoRun',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}

ipcMain.handle('code:run', async (_event, payload) => {
    const source = typeof payload?.source === 'string' ? payload.source : '';
    const input = typeof payload?.input === 'string' ? payload.input : '';

    return compileAndRun(source, input, { app });
});

ipcMain.handle('code:submit', async (_event, payload) => {
    const source = typeof payload?.source === 'string' ? payload.source : '';
    const problemId = typeof payload?.problemId === 'string' ? payload.problemId : '';
    const problem = await getProblemForJudge(problemId);

    if (!problem) {
        return {
            status: 'Runtime Error',
            output: `Problem not found: ${problemId}`,
            durationMs: 0,
            cases: []
        };
    }

    return judgeSource(source, problem.testCases, { app });
});

ipcMain.handle('problems:list', () => listProblems());
ipcMain.handle('problems:get', (_event, problemId) => getProblem(problemId));

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
