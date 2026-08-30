const fs = require('fs/promises');
const path = require('path');
const { getCompilerRoot, getGppPath } = require('../utils/paths');
const { runExecutable, runFile } = require('./processRunner');

const COMPILE_TIMEOUT_MS = 15000;
const RUN_TIMEOUT_MS = 5000;

async function compileAndRun(source, input, options = {}) {
    const compiled = await compileSource(source, options, 'algorun-run');

    if (!compiled.ok) {
        return compiled.result;
    }

    return runCompiled(compiled, input);
}

async function judgeSource(source, testCases, options = {}) {
    const compiled = await compileSource(source, options, 'algorun-submit');

    if (!compiled.ok) {
        return {
            status: compiled.result.status,
            output: compiled.result.output,
            durationMs: compiled.result.durationMs,
            cases: []
        };
    }

    const cases = [];
    let totalDurationMs = compiled.result.durationMs;

    for (let index = 0; index < testCases.length; index += 1) {
        const testCase = testCases[index];
        const run = await runCompiled(compiled, testCase.input);
        totalDurationMs += run.durationMs || 0;

        const actual = normalizeOutput(run.stdout);
        const expected = normalizeOutput(testCase.output);
        const passed = run.status === 'Success' && actual === expected;

        cases.push({
            index: index + 1,
            name: testCase.name || `Case ${index + 1}`,
            status: passed ? 'Passed' : run.status === 'Success' ? 'Wrong Answer' : run.status,
            input: testCase.input,
            expected: testCase.output,
            actual: run.stdout,
            stderr: run.stderr,
            durationMs: run.durationMs
        });

        if (!passed) {
            return {
                status: cases[cases.length - 1].status,
                output: formatJudgeOutput(cases),
                durationMs: totalDurationMs,
                cases
            };
        }
    }

    return {
        status: 'Accepted',
        output: formatJudgeOutput(cases),
        durationMs: totalDurationMs,
        cases
    };
}

async function compileSource(source, options = {}, workDirName) {
    const electronApp = options.app;
    const compilerRoot = getCompilerRoot(electronApp);
    const gppPath = getGppPath(electronApp);

    if (!await exists(gppPath)) {
        return {
            ok: false,
            result: {
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
            }
        };
    }

    const workDir = await prepareWorkDir(electronApp, options.tempRoot, workDirName);
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
            ok: false,
            result: {
                status: compile.timedOut ? 'Timeout' : 'Compile Error',
                stdout: compile.stdout,
                stderr: compile.stderr,
                output: compile.stderr || compile.stdout,
                durationMs: compile.durationMs,
                compilerPath: gppPath,
                workDir
            }
        };
    }

    return {
        ok: true,
        exePath,
        workDir,
        env,
        compilerPath: gppPath,
        result: {
            status: 'Compiled',
            stdout: compile.stdout,
            stderr: compile.stderr,
            output: compile.stdout,
            durationMs: compile.durationMs,
            compilerPath: gppPath,
            workDir
        }
    };
}

async function runCompiled(compiled, input) {
    const run = await runExecutable(compiled.exePath, {
        cwd: compiled.workDir,
        env: compiled.env,
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
        compilerPath: compiled.compilerPath,
        workDir: compiled.workDir
    };
}

async function prepareWorkDir(electronApp, tempRoot, workDirName = 'algorun') {
    const baseDir = tempRoot || getDefaultTempRoot(electronApp);
    const workDir = path.join(baseDir, workDirName);
    await fs.rm(workDir, { recursive: true, force: true });
    await fs.mkdir(workDir, { recursive: true });
    return workDir;
}

function getDefaultTempRoot(electronApp) {
    if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
        return path.join(process.env.LOCALAPPDATA, 'AlgoRun', 'temp');
    }

    return path.join(electronApp.getPath('userData'), 'temp');
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

function normalizeOutput(value) {
    return String(value ?? '').replace(/\r\n/g, '\n').trimEnd();
}

function formatJudgeOutput(cases) {
    return cases.map((testCase) => {
        const lines = [`${testCase.name}: ${testCase.status} (${testCase.durationMs} ms)`];

        if (testCase.status !== 'Passed') {
            lines.push(`Input:\n${testCase.input}`);
            lines.push(`Expected:\n${testCase.expected}`);
            lines.push(`Actual:\n${testCase.actual || ''}`);
            if (testCase.stderr) {
                lines.push(`Stderr:\n${testCase.stderr}`);
            }
        }

        return lines.join('\n');
    }).join('\n\n');
}

module.exports = {
    compileAndRun,
    judgeSource
};
