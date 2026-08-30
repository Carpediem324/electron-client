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

function runExecutable(file, options = {}) {
    return new Promise((resolve) => {
        const startedAt = process.hrtime.bigint();
        let stdout = '';
        let stderr = '';
        let finished = false;
        let timedOut = false;
        let child;
        let timer;

        try {
            child = spawn(file, [], {
                cwd: options.cwd,
                env: options.env,
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
                stderr: error.message,
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

        timer = setTimeout(() => {
            timedOut = true;
            killProcessTree(child.pid);
            setTimeout(() => {
                finish({
                    ok: false,
                    code: null,
                    signal: 'SIGTERM',
                    timedOut: true
                });
            }, 250);
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
                stderr: stderr || error.message
            });
        });

        child.on('close', (code, signal) => {
            finish({
                ok: code === 0 && !timedOut,
                code,
                signal,
                timedOut
            });
        });

        child.stdin.end(options.stdin || '', 'utf8');
    });
}

function killProcessTree(pid) {
    if (!pid) return;

    if (process.platform === 'win32') {
        execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => {});
        return;
    }

    try {
        process.kill(pid, 'SIGKILL');
    } catch {
        // Process may already have exited.
    }
}

function elapsedMs(startedAt) {
    return Number((process.hrtime.bigint() - startedAt) / 1000000n);
}

module.exports = {
    runExecutable,
    runFile
};
