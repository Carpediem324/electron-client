const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('algorun', {
    runCode: ({ source, input }) => ipcRenderer.invoke('code:run', { source, input })
});
