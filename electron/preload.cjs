const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveProject: (filePath, data) => ipcRenderer.invoke('save-project', { filePath, data }),
    saveProjectAs: (data) => ipcRenderer.invoke('save-project-as', data),
    loadProject: () => ipcRenderer.invoke('load-project'),
    isElectron: true,
});
