# AlgoRun

Windows에서 C++ 코딩 테스트 문제를 연습할 수 있는 Electron 데스크톱 앱입니다.

AlgoRun은 MinGW-w64 GCC 컴파일러를 앱에 함께 포함하는 방향으로 개발 중입니다. 사용자는 별도로 Visual Studio Build Tools, MinGW, GCC를 설치하거나 `PATH`를 수정하지 않아도 앱 안에서 C++17 코드를 컴파일하고 실행할 수 있습니다.

## 현재 개발 상태

현재 버전은 `1.0.0`입니다.

지금까지 구현된 핵심 기능은 다음과 같습니다.

| 구분 | 상태 | 내용 |
| --- | --- | --- |
| Electron 앱 기본 구조 | 완료 | `main`, `preload`, `renderer` 구조 구성 |
| 코드 에디터 | 완료 | Monaco Editor 기반 C++ 코드 편집 |
| C++ 컴파일 | 완료 | 번들된 MinGW-w64 `g++.exe`로 C++17 컴파일 |
| 직접 실행 | 완료 | 입력값을 넣고 현재 코드를 한 번 실행 |
| 문제 제출 | 완료 | 선택한 문제의 테스트 케이스로 자동 채점 |
| 내장 문제 | 완료 | 자체 제작 문제 80개 포함 |
| 채점 결과 | 완료 | Accepted, Wrong Answer, Compile Error, Runtime Error, Timeout 표시 |
| Windows 보안 차단 감지 | 완료 | Device Guard, Smart App Control 계열 차단을 별도 상태로 감지 |
| 빌드 스크립트 | 완료 | `build.bat`로 Windows 설치 파일 생성 |
| 설치 파일 생성 | 완료 | `electron-builder` NSIS 설치 파일 빌드 성공 |

## 주요 기능

### 1. C++17 코드 실행

앱에서 작성한 C++ 코드를 실행 작업 폴더에 `main.cpp`로 저장한 뒤, 포함된 컴파일러로 실행 파일을 생성합니다.

```text
g++ main.cpp -std=c++17 -O2 -fdiagnostics-color=never -o algorun-user-program.exe
```

실행 시 사용자가 입력한 값을 `stdin`으로 전달하고, `stdout`과 `stderr`를 앱 화면에 표시합니다.

### 2. 문제 선택 및 제출

왼쪽 문제 목록에서 문제를 선택하면 다음 정보가 표시됩니다.

- 문제 제목
- 카테고리
- 난이도
- 설명
- 입력 설명
- 출력 설명
- 예제 입력과 출력
- 기본 starter code

`Submit`을 누르면 현재 코드를 한 번 컴파일한 뒤, 해당 문제의 모든 테스트 케이스에 대해 실행합니다.

### 3. 채점 결과

현재 지원하는 결과 상태는 다음과 같습니다.

```text
Accepted
Wrong Answer
Compile Error
Runtime Error
Timeout
Blocked by Windows
```

출력 비교는 Windows 줄바꿈을 정규화하고, 전체 출력 끝의 불필요한 공백은 제거한 뒤 비교합니다.

### 4. Windows 보안 정책 대응

Windows Device Guard, Smart App Control, Microsoft Defender 같은 보안 정책이 앱에서 생성한 실행 파일을 막는 경우가 있습니다.

이 경우 사용자의 코드 문제가 아니라 Windows가 `algorun-user-program.exe` 실행을 차단한 상황입니다. 현재는 이런 메시지를 감지해 `Blocked by Windows` 상태로 분류하도록 처리했습니다.

또한 실행 파일 생성 위치를 `temp` 폴더가 아닌 아래 경로로 옮겨 차단 가능성을 줄였습니다.

```text
%LOCALAPPDATA%\AlgoRun\runner
```

## 프로젝트 구조

```text
electron-client/
├─ main.js
├─ preload.js
├─ renderer.js
├─ index.html
├─ styles.css
├─ build.bat
├─ package.json
├─ package-lock.json
├─ problems/
│  └─ basic.json
├─ services/
│  ├─ compilerService.js
│  ├─ processRunner.js
│  └─ problemService.js
├─ scripts/
│  ├─ startElectron.js
│  └─ verifyProblems.js
├─ utils/
│  └─ paths.js
└─ compiler/
   └─ mingw64/
```

## 실행 방법

개발 환경에서 실행할 때는 PowerShell 정책 문제를 피하기 위해 `npm.cmd`를 사용합니다.

```bat
npm.cmd start
```

현재 `npm start`는 내부적으로 `scripts/startElectron.js`를 실행합니다. 이 스크립트는 `ELECTRON_RUN_AS_NODE` 환경변수가 켜져 있어도 Electron이 정상 앱 모드로 실행되도록 해당 값을 제거합니다.

## 빌드 방법

설치 파일을 만들 때는 다음 배치 파일을 실행합니다.

```bat
build.bat
```

또는 직접 Electron Builder를 실행할 수 있습니다.

```bat
npm.cmd run build
```

빌드 산출물은 `dist` 폴더에 생성됩니다.

```text
dist/AlgoRun Setup 1.0.0.exe
```

현재 개발용 빌드는 코드 서명 인증서가 없기 때문에 `signExecutable: false`로 설정되어 있습니다. 정식 배포 단계에서는 Windows SmartScreen과 보안 정책 대응을 위해 코드 서명 인증서를 적용하는 것이 필요합니다.

## 검증 방법

내장 문제와 채점 흐름은 다음 명령어로 확인합니다.

```bat
npm.cmd run verify:problems
```

현재 검증 항목은 다음과 같습니다.

- 내장 문제 80개 로드 확인
- Accepted 판정 확인
- Wrong Answer 판정 확인
- Compile Error 판정 확인
- Timeout 판정 확인

최근 검증 결과:

```json
{"problems":80,"accepted":"Accepted","wrong":"Wrong Answer","compileError":"Compile Error","timeout":"Timeout"}
```

## 보안 주의

AlgoRun은 사용자가 작성한 C++ 코드를 로컬 PC에서 컴파일하고 실행하는 앱입니다. 따라서 신뢰할 수 없는 코드를 실행하면 파일 접근, 프로세스 실행, 네트워크 접근 같은 로컬 시스템 동작이 발생할 수 있습니다.

현재 버전은 학습용 로컬 실행 도구이며, 완전한 샌드박스나 컨테이너 격리는 아직 구현되어 있지 않습니다. 공개 배포 전에는 다음 항목을 추가로 검토해야 합니다.

- 실행 파일 코드 서명
- 사용자 코드 실행 격리
- 파일 시스템 접근 제한
- 네트워크 접근 제한
- 악성 코드 또는 무한 실행 방지 강화
- 보안 프로그램 오탐 대응 방식 정리

## 지금까지 개발한 내용 정리

### 1차 개발

- Electron 기반 데스크톱 앱 구조 생성
- Renderer와 Main 프로세스 분리
- `contextIsolation: true`, `nodeIntegration: false` 설정
- Preload를 통한 안전한 IPC API 구성

### 2차 개발

- Monaco Editor 적용
- C++ 기본 코드 템플릿 추가
- 커스텀 입력창과 출력창 구성
- 실행 상태 표시 UI 추가

### 3차 개발

- MinGW-w64 GCC 컴파일러 번들링
- 개발 모드와 패키징 모드에서 컴파일러 경로 자동 계산
- `g++` 컴파일 서비스 구현
- 실행 파일 프로세스 실행 및 결과 수집 구현

### 4차 개발

- 자체 제작 코딩 테스트 문제 80개 추가
- 문제 목록, 문제 상세, 예제 입출력 표시
- 문제별 starter code 적용
- 제출 시 테스트 케이스 기반 자동 채점 구현

### 5차 개발

- Compile Error, Runtime Error, Timeout 판정 처리
- Windows에서 timeout 발생 시 `taskkill`로 프로세스 트리 종료
- 제출 실행 후 작업 폴더 정리
- 검증 스크립트 `verify:problems` 추가

### 6차 개발

- Windows Device Guard, Smart App Control 차단 케이스 분석
- 보안 정책으로 실행이 막힌 경우 `Blocked by Windows`로 분류
- 실행 경로를 `temp`에서 `runner`로 변경해 차단 가능성 완화
- 실행 파일명을 `algorun-user-program.exe`로 명확화

### 7차 개발

- `ELECTRON_RUN_AS_NODE=1` 환경변수 때문에 앱이 Node 모드로 실행되던 문제 수정
- `scripts/startElectron.js` 런처 추가
- `npm.cmd start` 정상 실행 확인

### 8차 개발

- `build.bat`에서 같은 버전 재빌드 시 실패하던 문제 수정
- `--allow-same-version` 옵션 추가
- 코드 서명 인증서가 없는 개발 환경에서 빌드 실패하던 문제 수정
- NSIS 설치 파일 빌드 성공 확인

## 앞으로 할 일

### 우선순위 높음

- 앱 아이콘 추가
- 설치 파일 이름과 앱 이름 정리
- Windows 코드 서명 인증서 적용
- Device Guard 또는 SmartScreen 차단을 줄이기 위한 배포 방식 정리
- 빌드 전 자동 검증 흐름 추가

### 기능 개선

- 문제 검색 기능
- 카테고리별 필터
- 난이도별 필터
- 풀이 상태 저장
- 마지막으로 작성한 코드 자동 저장
- 문제별 제출 기록 저장
- 실행 결과 로그 저장

### 채점 개선

- 테스트 케이스별 상세 보기 개선
- 여러 예제 입력 지원
- 메모리 제한 표시
- 시간 제한을 문제별로 다르게 설정
- 출력 비교 옵션 확장

### UI 개선

- 문제 목록 가독성 개선
- 결과 패널 디자인 개선
- 에러 메시지 한글화
- 긴 문제 설명 스크롤 경험 개선
- 창 크기별 반응형 레이아웃 개선

### 배포 준비

- GitHub Releases 배포 자동화
- 설치 파일 체크섬 제공
- README 스크린샷 추가
- 사용 방법 문서 추가
- 라이선스 정리
- 서드파티 고지 문서 보강

## 사용한 주요 기술

- Electron
- Node.js
- Monaco Editor
- MinGW-w64 GCC
- electron-builder
- NSIS

## 번들 컴파일러

현재 포함된 컴파일러는 WinLibs MinGW-w64 GCC입니다.

- Distribution: WinLibs standalone build of GCC and MinGW-w64 for Windows
- Version: GCC 15.2.0, MinGW-w64 14.0.0
- Thread model: POSIX
- Exception model: SEH
- Runtime: MSVCRT
- Architecture: Windows x86_64
- Source: https://github.com/brechtsanders/winlibs_mingw/releases/tag/15.2.0posix-14.0.0-msvcrt-r7

라이선스 관련 내용은 `THIRD_PARTY_NOTICES.md`를 참고합니다.

## 현재 제한 사항

- Windows x64만 지원합니다.
- C++ 단일 파일 `main.cpp` 실행만 지원합니다.
- 온라인 저지 연동은 아직 없습니다.
- 사용자 계정, 점수, 랭킹 기능은 아직 없습니다.
- 컴파일 제한 시간은 15초로 고정되어 있습니다.
- 실행 제한 시간은 5초로 고정되어 있습니다.
- 정식 코드 서명은 아직 적용되지 않았습니다.
