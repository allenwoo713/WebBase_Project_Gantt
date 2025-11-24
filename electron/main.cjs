const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, isDev ? '../public/icon.png' : '../dist/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers

// Save Project (Directly to path)
ipcMain.handle('save-project', async (event, { filePath, data }) => {
    try {
        fs.writeFileSync(filePath, data, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save Project As (Open Dialog)
ipcMain.handle('save-project-as', async (event, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Project',
        defaultPath: 'MyProject.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (canceled || !filePath) {
        return { success: false, canceled: true };
    }

    try {
        fs.writeFileSync(filePath, data, 'utf-8');
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Load Project (Open Dialog)
ipcMain.handle('load-project', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Open Project',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (canceled || filePaths.length === 0) {
        return { success: false, canceled: true };
    }

    try {
        const filePath = filePaths[0];
        const data = fs.readFileSync(filePath, 'utf-8');
        return { success: true, filePath, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
