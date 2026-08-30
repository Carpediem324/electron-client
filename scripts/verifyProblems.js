const path = require('path');
const fs = require('fs/promises');
const { judgeSource } = require('../services/compilerService');
const { getProblemForJudge, listProblems } = require('../services/problemService');

const app = {
    isPackaged: false,
    getPath: () => path.join(process.env.APPDATA || process.env.TEMP, 'AlgoRunVerify')
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

    const accepted = await judgeSource(acceptedSource, problem.testCases, { app });
    assert(
        accepted.status === 'Accepted',
        `Expected Accepted, got ${accepted.status}: ${JSON.stringify(accepted.cases?.[0] || accepted)}`
    );

    const wrong = await judgeSource('int main(){return 0;}', problem.testCases, { app });
    assert(
        wrong.status === 'Wrong Answer',
        `Expected Wrong Answer, got ${wrong.status}: ${JSON.stringify(wrong.cases?.[0] || wrong)}`
    );

    const compileError = await judgeSource('int main( {', problem.testCases, { app });
    assert(compileError.status === 'Compile Error', `Expected Compile Error, got ${compileError.status}`);

    const timeoutRoot = path.join(process.cwd(), '.verify-runtime');
    await fs.rm(timeoutRoot, { recursive: true, force: true });

    const timeout = await judgeSource('int main(){while(true){}}', problem.testCases, {
        app,
        tempRoot: timeoutRoot
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

    await fs.rm(timeoutRoot, { recursive: true, force: true });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
