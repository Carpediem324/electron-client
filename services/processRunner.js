const { execFile, spawn } = require('child_process');

function runFile(file, args, options = {}) {
    return new Promise((resolve) => {
        const startedAt = process.hrtime.bigint();
        const child = execFile(file, args, {
            cwd: options.cwd,
            env: options.env,
            timeout: options.timeoutMs,
            windowsHide: true,
            maxBuffer: options.maxBuffer || 1024 * 1024 * 8
        }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                code: error?.code ?? 0,
                signal: error?.signal ?? null,
                timedOut: Boolean(error?.killed && error?.signal === 'SIGTERM'),
                stdout,
                stderr,
                durationMs: elapsedMs(startedAt)
            });
        });

        child.on('error', (error) => {
            resolve({
                ok: false,
                code: error.code || 1,
                signal: null,
                timedOut: false,
                stdout: '',
                stderr: error.message,
                durationMs: elapsedMs(startedAt)
            });
        });
    });
}

async function runExecutable(file, options = {}) {
    const retries = options.spawnRetries ?? 3;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const result = await tryRunExecutable(file, options);
        const canRetry = result.code === 'UNKNOWN' && /spawn UNKNOWN/i.test(result.stderr || '');

        if (!canRetry || attempt === retries) {
            return result;
        }

        await delay(200 * (attempt + 1));
    }
}

function tryRunExecutable(file, options = {}) {
    return new Promise((resolve) => {
        const startedAt = process.hrtime.bigint();
        let stdout = '';
        let stderr = '';
        let finished = false;
        let timedOut = false;
        let child;
        let timer;

        try {
            const command = process.platform === 'win32' ? 'cmd.exe' : file;
            const args = process.platform === 'win32' ? ['/d', '/s', '/c', quoteWindowsCommandPath(file)] : [];

            child = spawn(command, args, {
                cwd: options.cwd,
                env: options.env,
                windowsVerbatimArguments: process.platform === 'win32',
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch (error) {
            resolve({
                ok: false,
                code: error.code || 1,
                signal: null,
                timedOut: false,
                stdout: '',
                stderr: formatProcessError(error),
                blockedByWindowsSecurity: isWindowsSecurityBlock(error),
                durationMs: elapsedMs(startedAt)
            });
            return;
        }

        const finish = (result) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            resolve({
                ...result,
                stdout,
                stderr: result.stderr ?? stderr,
                durationMs: elapsedMs(startedAt)
            });
        };

        timer = setTimeout(async () => {
            timedOut = true;
            await killProcessTree(child.pid);
            finish({
                ok: false,
                code: null,
                signal: 'SIGTERM',
                timedOut: true
            });
        }, options.timeoutMs || 5000);

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString('utf8');
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString('utf8');
        });

        child.on('error', (error) => {
            finish({
                ok: false,
                code: error.code || 1,
                signal: null,
                timedOut: false,
                stderr: stderr || formatProcessError(error),
                blockedByWindowsSecurity: isWindowsSecurityBlock(error)
            });
        });

        child.on('close', (code, signal) => {
            finish({
                ok: code === 0 && !timedOut,
                code,
                signal,
                timedOut,
                blockedByWindowsSecurity: isWindowsSecurityExit(code, stderr)
            });
        });

        child.stdin.end(options.stdin || '', 'utf8');
    });
}

function killProcessTree(pid) {
    if (!pid) return Promise.resolve();

    if (process.platform === 'win32') {
        return new Promise((resolve) => {
            execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => resolve());
        });
    }

    try {
        process.kill(pid, 'SIGKILL');
    } catch {
        // Process may already have exited.
    }

    return Promise.resolve();
}

function elapsedMs(startedAt) {
    return Number((process.hrtime.bigint() - startedAt) / 1000000n);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function quoteWindowsCommandPath(file) {
    return `"${String(file).replaceAll('"', '""')}"`;
}

function formatProcessError(error) {
    if (isWindowsSecurityBlock(error)) {
        return [
            'Windows blocked the compiled program before AlgoRun could execute it.',
            'This can happen when Smart App Control or Microsoft Defender blocks a newly generated executable.',
            error.message
        ].join('\n');
    }

    return error.message;
}

function isWindowsSecurityBlock(error) {
    if (process.platform !== 'win32') return false;

    const code = String(error?.code || '').toUpperCase();
    const message = String(error?.message || '');

    return (
        code === 'EACCES' ||
        code === 'EPERM' ||
        code === 'UNKNOWN' ||
        /access is denied|operation did not complete|blocked|unsafe|smart app control|device guard/i.test(message)
    );
}

function isWindowsSecurityExit(code, stderr) {
    if (process.platform !== 'win32') return false;

    return (
        code === 1260 ||
        /smart app control|device guard|blocked|unsafe|operation did not complete/i.test(String(stderr || ''))
    );
}

module.exports = {
    runExecutable,
    runFile
};
