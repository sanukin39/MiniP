const {app, BrowserWindow, ipcMain} = require('electron')
const util = require('util');
const exec = require('child_process').exec;
const fs = require('fs')
const path = require('path')
var appRootDir = require('app-root-dir').get();

let mainWindow;

openMainWindow = () =>
{
    mainWindow = new BrowserWindow({
        width: 300,
        height: 290,
        webPreferences:
        {
            preload: path.join(app.getAppPath(), 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(openMainWindow);


var targetFiles = [];
function AppendPath(filePath)
{
    if(path.extname(filePath) != '.png')
    {
        return;
    }

    if(targetFiles.includes(filePath))
    {
        return;
    }

    targetFiles.push(filePath);
}

class CompressionResult
{
    constructor(targetCount, compressionLevel)
    {
        this.targetCount = targetCount;
        this.compressionLevel = compressionLevel
    }
}
ipcMain.handle('compress', async (arg, filepath) => {
    var stats = fs.statSync(filepath);

    if(stats.isDirectory())
    {
        await showFiles(filepath, AppendPath);
    }
    else
    {
        AppendPath(filepath);
    }

    var targetCount = targetFiles.length;
    if(targetCount == 0)
    {
        return;
    }

    var totalBytes = 0;
    var resultBytes = 0;
    var compressedCount = 0;
    targetFiles.forEach(async (element) =>
    {
        stats = fs.statSync(element);
        totalBytes += stats.size;
        exec(appRootDir + '/pngquant --force --speed 1 --strip --o "' + element + '" "' + element + '"', (err, stdout, stderr) =>
        {
            resultStats = fs.statSync(element);
            resultBytes += resultStats.size;
            compressedCount++;
            if(compressedCount == targetCount)
            {

                targetFiles.length = 0;
                var saveRate = ((1 - (resultBytes / totalBytes)) * 100).toFixed(1);
            
                let result = new CompressionResult(targetCount, saveRate);
                mainWindow.webContents.send('compressed', result);
            }
        });
    });
});

async function showFiles(dirpath, callback)
{
    let stats = await fs.readdirSync(dirpath);
    for (const dirent of stats)
    {
        let filePath = path.join(dirpath, dirent);
        let fstats = await fs.statSync(filePath);
        if (fstats.isDirectory())
        {
            await showFiles(filePath, callback);
        } else {
            callback(filePath);
        }
    }
}