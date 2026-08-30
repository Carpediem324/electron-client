const fs = require('fs/promises');
const path = require('path');
const { getCompilerRoot, getGppPath } = require('../utils/paths');
const { runExecutable, runFile } = require('./processRunner');

const COMPILE_TIMEOUT_MS = 15000;
const RUN_TIMEOUT_MS = 5000;

async function compileAndRun(source, input, options = {}) {
    const electronApp = options.app;
    const compilerRoot = getCompilerRoot(electronApp);
    const gppPath = getGppPath(electronApp);

    if (!await exists(gppPath)) {
        return {
            status: 'Compile Error',
            stdout: '',
            stderr: [
                `Bundled C++ compiler was not found: ${gppPath}`,
                `Expected compiler root: ${compilerRoot}`,
                'Place a complete MinGW-w64 toolchain at compiler/mingw64 before running AlgoRun.'
            ].join('\n'),
            output: '',
            durationMs: 0,
            compilerPath: gppPath
        };
    }

    const workDir = await prepareWorkDir(electronApp, options.tempRoot);
    const sourcePath = path.join(workDir, 'main.cpp');
    const exePath = path.join(workDir, 'main.exe');
    await fs.writeFile(sourcePath, source, 'utf8');

    const env = buildToolchainEnv(compilerRoot);
    const compile = await runFile(gppPath, [
        'main.cpp',
        '-std=c++17',
        '-O2',
        '-fdiagnostics-color=never',
        '-o',
        'main.exe'
    ], {
        cwd: workDir,
        env,
        timeoutMs: COMPILE_TIMEOUT_MS
    });

    if (!compile.ok) {
        return {
            status: compile.timedOut ? 'Timeout' : 'Compile Error',
            stdout: compile.stdout,
            stderr: compile.stderr,
            output: compile.stderr || compile.stdout,
            durationMs: compile.durationMs,
            compilerPath: gppPath,
            workDir
        };
    }

    const run = await runExecutable(exePath, {
        cwd: workDir,
        env,
        stdin: input,
        timeoutMs: RUN_TIMEOUT_MS
    });

    const status = run.timedOut ? 'Timeout' : (run.ok ? 'Success' : 'Runtime Error');

    return {
        status,
        stdout: run.stdout,
        stderr: run.stderr,
        output: status === 'Success' ? run.stdout : (run.stderr || run.stdout),
        durationMs: run.durationMs,
        compilerPath: gppPath,
        workDir
    };
}

async function prepareWorkDir(electronApp, tempRoot) {
    const baseDir = tempRoot || path.join(electronApp.getPath('userData'), 'temp');
    const workDir = path.join(baseDir, 'algorun');
    await fs.rm(workDir, { recursive: true, force: true });
    await fs.mkdir(workDir, { recursive: true });
    return workDir;
}

function buildToolchainEnv(compilerRoot) {
    const binPath = path.join(compilerRoot, 'bin');
    return {
        ...process.env,
        PATH: `${binPath}${path.delimiter}${process.env.PATH || ''}`
    };
}

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    compileAndRun
};
