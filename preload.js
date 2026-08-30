const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('algorun', {
    getProblem: (problemId) => ipcRenderer.invoke('problems:get', problemId),
    listProblems: () => ipcRenderer.invoke('problems:list'),
    runCode: ({ source, input }) => ipcRenderer.invoke('code:run', { source, input }),
    submitCode: ({ source, problemId }) => ipcRenderer.invoke('code:submit', { source, problemId })
});
