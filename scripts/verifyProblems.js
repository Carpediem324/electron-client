const path = require('path');
const fs = require('fs/promises');
const { judgeSource } = require('../services/compilerService');
const { getProblemForJudge, listProblems } = require('../services/problemService');

const app = {
    isPackaged: false,
    getPath: () => path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'AlgoRunVerify')
};

const acceptedSource = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << '\\n';
    return 0;
}
`;

async function main() {
    const problems = await listProblems();
    assert(problems.length === 80, `Expected 80 problems, got ${problems.length}`);

    const problem = await getProblemForJudge('basic-001-a-plus-b');
    assert(problem, 'A+B problem was not found');

    const tempRoot = path.join(app.getPath('userData'), 'runner');
    await cleanupTempRoot(tempRoot);

    const accepted = await judgeSource(acceptedSource, problem.testCases, { app, tempRoot });
    assert(
        accepted.status === 'Accepted',
        `Expected Accepted, got ${accepted.status}: ${JSON.stringify(accepted.cases?.[0] || accepted)}`
    );

    const wrong = await judgeSource('int main(){return 0;}', problem.testCases, { app, tempRoot });
    assert(
        wrong.status === 'Wrong Answer',
        `Expected Wrong Answer, got ${wrong.status}: ${JSON.stringify(wrong.cases?.[0] || wrong)}`
    );

    const compileError = await judgeSource('int main( {', problem.testCases, { app, tempRoot });
    assert(compileError.status === 'Compile Error', `Expected Compile Error, got ${compileError.status}`);

    const timeout = await judgeSource('int main(){while(true){}}', problem.testCases, {
        app,
        tempRoot
    });
    assert(
        timeout.status === 'Timeout',
        `Expected Timeout, got ${timeout.status}: ${JSON.stringify(timeout.cases?.[0] || timeout)}`
    );

    console.log(JSON.stringify({
        problems: problems.length,
        accepted: accepted.status,
        wrong: wrong.status,
        compileError: compileError.status,
        timeout: timeout.status
    }));

    await cleanupTempRoot(tempRoot);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function cleanupTempRoot(tempRoot) {
    try {
        await fs.rm(tempRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch {
        // Windows can keep recently executed files locked for a moment after tests finish.
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
