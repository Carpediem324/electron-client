const fallbackCode = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << '\\n';
    return 0;
}
`;

let editor;
let currentProblem;
let problems = [];

const statusEl = document.getElementById('status');
const timeEl = document.getElementById('time');
const runButton = document.getElementById('runButton');
const submitButton = document.getElementById('submitButton');
const resetCodeButton = document.getElementById('resetCodeButton');
const stdinEl = document.getElementById('stdin');
const stdoutEl = document.getElementById('stdout');
const problemListEl = document.getElementById('problemList');
const problemTitleEl = document.getElementById('problemTitle');
const problemMetaEl = document.getElementById('problemMeta');
const problemDescriptionEl = document.getElementById('problemDescription');
const inputDescriptionEl = document.getElementById('inputDescription');
const outputDescriptionEl = document.getElementById('outputDescription');
const sampleInputEl = document.getElementById('sampleInput');
const sampleOutputEl = document.getElementById('sampleOutput');

require.config({ paths: { vs: './node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], async () => {
    monaco.editor.defineTheme('algorun-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#101417',
            'editorLineNumber.foreground': '#69747d',
            'editorLineNumber.activeForeground': '#d7dde2'
        }
    });

    editor = monaco.editor.create(document.getElementById('editor'), {
        value: fallbackCode,
        language: 'cpp',
        theme: 'algorun-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 15,
        tabSize: 4,
        insertSpaces: true,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on'
    });

    await loadProblems();
});

runButton.addEventListener('click', async () => {
    if (!editor) return;

    setBusy(true);
    stdoutEl.value = '';
    setStatus('Compiling');
    const runningTimer = setTimeout(() => setStatus('Running'), 300);

    try {
        const result = await window.algorun.runCode({
            source: editor.getValue(),
            input: stdinEl.value
        });

        clearTimeout(runningTimer);
        showResult(result);
    } catch (error) {
        clearTimeout(runningTimer);
        showError(error);
    } finally {
        setBusy(false);
    }
});

submitButton.addEventListener('click', async () => {
    if (!editor || !currentProblem) return;

    setBusy(true);
    stdoutEl.value = '';
    setStatus('Compiling');
    const runningTimer = setTimeout(() => setStatus('Running'), 300);

    try {
        const result = await window.algorun.submitCode({
            source: editor.getValue(),
            problemId: currentProblem.id
        });

        clearTimeout(runningTimer);
        showResult(result);
    } catch (error) {
        clearTimeout(runningTimer);
        showError(error);
    } finally {
        setBusy(false);
    }
});

resetCodeButton.addEventListener('click', () => {
    if (!editor) return;
    editor.setValue(currentProblem?.starterCode || fallbackCode);
    stdoutEl.value = '';
    setStatus('Ready');
    timeEl.textContent = '0 ms';
});

async function loadProblems() {
    problems = await window.algorun.listProblems();
    renderProblemList();

    if (problems.length > 0) {
        await selectProblem(problems[0].id);
    }
}

function renderProblemList() {
    problemListEl.innerHTML = '';

    for (const problem of problems) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'problem-item';
        item.dataset.problemId = problem.id;
        item.innerHTML = `
            <span>${escapeHtml(problem.title)}</span>
            <small>${escapeHtml(problem.category)} · ${problem.testCaseCount} tests</small>
        `;
        item.addEventListener('click', () => selectProblem(problem.id));
        problemListEl.appendChild(item);
    }
}

async function selectProblem(problemId) {
    currentProblem = await window.algorun.getProblem(problemId);
    if (!currentProblem) return;

    for (const item of problemListEl.querySelectorAll('.problem-item')) {
        item.classList.toggle('active', item.dataset.problemId === problemId);
    }

    const sample = currentProblem.samples?.[0] || { input: '', output: '' };
    problemTitleEl.textContent = currentProblem.title;
    problemMetaEl.textContent = `${currentProblem.category} · ${currentProblem.level} · ${currentProblem.testCaseCount} tests`;
    problemDescriptionEl.textContent = currentProblem.description;
    inputDescriptionEl.textContent = currentProblem.inputDescription;
    outputDescriptionEl.textContent = currentProblem.outputDescription;
    sampleInputEl.textContent = sample.input;
    sampleOutputEl.textContent = sample.output;
    stdinEl.value = sample.input;
    stdoutEl.value = '';
    editor?.setValue(currentProblem.starterCode || fallbackCode);
    setStatus('Ready');
    timeEl.textContent = '0 ms';
}

function showResult(result) {
    setStatus(result.status);
    timeEl.textContent = `${result.durationMs || 0} ms`;
    stdoutEl.value = result.output || result.stdout || result.stderr || '';
}

function showError(error) {
    setStatus('Runtime Error');
    timeEl.textContent = '0 ms';
    stdoutEl.value = error?.message || String(error);
}

function setBusy(isBusy) {
    runButton.disabled = isBusy;
    submitButton.disabled = isBusy;
    resetCodeButton.disabled = isBusy;
}

function setStatus(status) {
    statusEl.textContent = status;
    statusEl.className = `status status-${status.toLowerCase().replace(/\s+/g, '-')}`;
    if (status === 'Compiling') {
        timeEl.textContent = '...';
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
