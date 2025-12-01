const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveProject: (filePath, data) => ipcRenderer.invoke('save-project', { filePath, data }),
    saveProjectAs: (data) => ipcRenderer.invoke('save-project-as', data),
    loadProject: () => ipcRenderer.invoke('load-project'),
    exportCSV: (defaultPath, data) => ipcRenderer.invoke('export-csv', { defaultPath, data }),
    isElectron: true,
});
