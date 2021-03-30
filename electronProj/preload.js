const { contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld(
    "api", {
        Compress: (args) => {
            ipcRenderer.invoke('compress', args)
        },
        CompressCompleted: (listener, args) => 
        {
            ipcRenderer.on('compressed', listener, args);
        }
    }
);