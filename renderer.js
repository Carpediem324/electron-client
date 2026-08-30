const defaultCode = `#include <iostream>

using namespace std;

int main() {
    int a, b;
    cin >> a >> b;

    cout << a + b << '\\n';

    return 0;
}
`;

let editor;

const statusEl = document.getElementById('status');
const timeEl = document.getElementById('time');
const runButton = document.getElementById('runButton');
const stdinEl = document.getElementById('stdin');
const stdoutEl = document.getElementById('stdout');

require.config({ paths: { vs: './node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], () => {
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
        value: defaultCode,
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
});

runButton.addEventListener('click', async () => {
    if (!editor) return;

    runButton.disabled = true;
    stdoutEl.value = '';
    setStatus('Compiling');
    const runningTimer = setTimeout(() => {
        setStatus('Running');
    }, 300);

    try {
        const result = await window.algorun.runCode({
            source: editor.getValue(),
            input: stdinEl.value
        });

        clearTimeout(runningTimer);
        setStatus(result.status);
        timeEl.textContent = `${result.durationMs || 0} ms`;
        stdoutEl.value = result.output || result.stdout || result.stderr || '';
    } catch (error) {
        clearTimeout(runningTimer);
        setStatus('Runtime Error');
        stdoutEl.value = error?.message || String(error);
    } finally {
        runButton.disabled = false;
    }
});

function setStatus(status) {
    statusEl.textContent = status;
    statusEl.className = `status status-${status.toLowerCase().replace(/\s+/g, '-')}`;
    if (status === 'Compiling') {
        timeEl.textContent = '...';
    }
}
