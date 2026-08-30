const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { compileAndRun } = require('./services/compilerService');

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
