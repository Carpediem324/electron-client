const fs = require('fs/promises');
const path = require('path');
const { getProjectRoot } = require('../utils/paths');

const PROBLEM_FILE = path.join(getProjectRoot(), 'problems', 'basic.json');

let cache;

async function listProblems() {
    const problems = await loadProblems();
    return problems.map(toPublicProblem);
}

async function getProblem(problemId) {
    const problems = await loadProblems();
    const problem = problems.find((item) => item.id === problemId);
    return problem ? toPublicProblem(problem) : null;
}

async function getProblemForJudge(problemId) {
    const problems = await loadProblems();
    return problems.find((item) => item.id === problemId) || null;
}

async function loadProblems() {
    if (cache) {
        return cache;
    }

    const content = await fs.readFile(PROBLEM_FILE, 'utf8');
    cache = JSON.parse(content);
    return cache;
}

function toPublicProblem(problem) {
    return {
        id: problem.id,
        title: problem.title,
        category: problem.category,
        level: problem.level,
        description: problem.description,
        inputDescription: problem.inputDescription,
        outputDescription: problem.outputDescription,
        starterCode: problem.starterCode,
        samples: problem.samples,
        testCaseCount: problem.testCases.length
    };
}

module.exports = {
    getProblem,
    getProblemForJudge,
    listProblems
};
