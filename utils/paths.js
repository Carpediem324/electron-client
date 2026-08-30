const path = require('path');

function getProjectRoot() {
    return path.resolve(__dirname, '..');
}

function getCompilerRoot(electronApp) {
    if (electronApp?.isPackaged) {
        return path.join(process.resourcesPath, 'compiler', 'mingw64');
    }

    return path.join(getProjectRoot(), 'compiler', 'mingw64');
}

function getGppPath(electronApp) {
    return path.join(getCompilerRoot(electronApp), 'bin', 'g++.exe');
}

module.exports = {
    getCompilerRoot,
    getGppPath,
    getProjectRoot
};
