# OTTSub

**작업 상태:** [Dev_Status.xlsx](../Dev_Status.xlsx)의 앱 `OTTSub` / `OTT-1`–`OTT-80`가 정본이다. [TODO](docs/TODO.md)는 ID별 설명·근거, [HANDOFF](docs/HANDOFF.md)는 최신 build와 검사 범위를 안내한다.

Netflix 자막 싱크·이중 자막·학습 설정 Chrome 확장 프로그램. 현재 개발본은 **1.3.9-local-french-ui-20261029.70 / 17언어**다. 마지막 제품 전체 QA는 [프랑스어 추가 후 기록](docs/QA.md#french-ui-20261029)의 122/122이며, 이번 Git 정리 검사를 새 제품 전체 QA로 세지 않는다. 기존 스토어 ZIP 1.3.9는 프랑스어 추가 전의 16언어 자료로 로컬에 보존한다.

**Mac 검증은 미완료이며, 2026-10-14 사용자 요청으로 추가 테스트를 보류했다.** 자동 QA 통과와 실제 Chrome 일부 확인을 구분한 상세 보고서는 [QA](docs/QA.md#2026-10-14-mac-중간-보고서--41)에 있다.

인계받는 작업자는 **[AGENTS](AGENTS.md) → [HANDOFF](docs/HANDOFF.md) → [AI 대화](OttsubAiTalk.md) → [QA](docs/QA.md) → [TODO](docs/TODO.md)** 순서로 읽는다. 사용자가 보류한 검사는 재개 요청 전까지 시작하지 않는다. 현재 관리 문서는 아래 **6개**이며, 기존 docs/REVIEW.md는 이관 안내를 유지한다.

- [현재 상태](docs/HANDOFF.md)
- [남은 일](docs/TODO.md)
- [검사 방법·실제 Mac](docs/QA.md)
- [구조·모듈 분리 계획 양식](docs/ARCHITECTURE.md)
- [AI 대화·검수 판정·오류 정정](OttsubAiTalk.md)
- [개발 이력](docs/HISTORY.md)

| 위치 | 역할 |
|---|---|
| src/popup/icons/_locales + manifest.json | 확장 실행 파일 |
| tests/scripts/tools | 반복 검사·도구. 기준 파일은 tests/fixtures |
| artifacts/qa | 현재/새 QA 결과 |
| store_assets/dist | 등록 자료·기존 배포 ZIP |
| archive | 과거 문서·원본 검수·백업·HAR/JSON·옛 QA·실험 |

검수 원문은 `archive/docs/reviews/<검수 날짜·주제>/gemnisaying-original.md`에 한 벌씩 보관하며, 앞으로 모든 AI 간 대화·반박·수정 답변은 루트의 [OttsubAiTalk.md](OttsubAiTalk.md)에서 읽고 작성한다. 기존 REVIEW와 archive의 판정·답변도 이 파일에 모았다. 테스트 프로필의 설정과 검사 증거는 보존하고 재생성 가능한 브라우저 캐시만 정리한다. 최근 정리의 이동표·해시 검증은 [정리 기록](archive/maintenance/2026-10-15-cleanup/verification.json)에 있다.

[작업 규칙](AGENTS.md), [등록 지침](store_assets/STORE_GUIDE.md), [최신 QA](artifacts/qa/latest.md).

GEO용 [한국어 제품 소개](https://k2bact.github.io/ottsub-site/ko/)·[영어 제품 소개](https://k2bact.github.io/ottsub-site/)를 게시했다. [등록 자료·페이지 안내](store_assets/README.md)에서 관리하며, 2026-10-30 사용자 지시에 따라 이 저장소는 정리한 코드의 공개 저장소이며, 기존 이력은 비공개 [ottsub-dev](https://github.com/K2Bact/ottsub-dev)에 보관한다. 공개 페이지에는 앱 소스를 포함하지 않는다. [게시·검사 및 실제 검색 효과의 경계](OttsubAiTalk.md#geo-publication-20261020)를 따른다.
현재 폴더를 실제 작업 원본으로 사용하며 별도 업로드 복사본은 만들지 않는다. GitHub 대상은 공개 [K2Bact/OTTSub](https://github.com/K2Bact/OTTSub)의 main이다. 기존 과거 이력의 [ottsub-dev](https://github.com/K2Bact/ottsub-dev)는 비공개·읽기 전용으로 유지한다. Mac에서는 이 저장소를 clone한 뒤 manifest.json이 있는 루트 폴더를 Chrome의 '압축해제된 확장 프로그램을 로드합니다'로 선택한다. 자세한 자동 QA와 실기 절차는 [검사 방법](docs/QA.md)을 따른다. 모든 작업 파일은 OTTSub 안에 둔다. ZIP 생성·업로드는 요청 때만 한다.

Git에는 실행 파일, 공유용 현재 문서, 테스트/도구, 등록 자료를 포함한다. `.gitignore`가 archive/artifacts/dist와 로그·HAR·배포 ZIP·임시 프로필을 제외한다. 과거 원본/제출 ZIP은 원래 Windows 폴더, 이번 Mac raw QA는 검사한 Mac의 로컬에 보존한다. Git clone에는 이 증거 파일과 최신 QA 링크의 대상이 없을 수 있다. 상세 결과·해시·검증 한계는 Git으로 공유하는 QA 문서 안에 기록했으며, 재개 후 QA를 실행하면 그 기기에 새 로컬 결과가 생성된다. 반복 검사에 필요한 숫자 자료와 공통 언어 gate는 tests/fixtures에 포함한다.

다른 Windows PC에서도 같은 commit의 소스를 받아 manifest.json이 있는 루트를 개발모드로 로드할 수 있다. 현재 개발 manifest에는 ID 고정용 key가 없으므로 두 PC의 ID 일치는 별도로 확인해야 한다. 오프라인 CDN 검사의 공개 self-signed 인증서/시험 키 2개는 tests/fixtures/cdn-network에 포함하며 실제 서비스나 store ZIP에는 사용하지 않는다.

## Git에 포함하지 않는 로컬 자료

`OttsubAiTalk.md`의 내부 AI 대화와 `tests/fixtures/netflix-player-reference.js`의 외부 플레이어 참고 사본은 로컬에 보존하며 Git에서 제외한다. `archive/`, `artifacts/`, `dist/`, HAR, 브라우저 프로필과 계정 내보내기 파일도 제외한다. 이 원본 폴더를 통째로 외부에 제출하지 않는다.

전체 QA 중 `test_native_acquisition_runtime.cjs`는 그 로컬 참고 사본을 읽는다. 새 clone에는 이 사본이 없으므로 현재 기본 전체 QA가 그대로 재현된다고 주장하지 않는다. 사본이 없을 때의 실패를 통과/SKIP으로 바꾸거나, 이용 권리가 확인되지 않은 사본을 외부에 다시 올리지 않는다. 나머지 자체 작성 코드와 테스트는 Git에 포함한다. 기존 Windows 작업 폴더의 참고 사본과 검사 기능은 유지한다.

CDN 회귀의 `server-key.pem`과 `server-cert.pem`은 공개하도록 만든 loopback 전용 self-signed 시험 자료다. 서비스 비밀키로 사용하지 않는다. Gitleaks에서는 이 시험 키와 언어 엔진 무결성 SHA-256이 탐지될 수 있으므로, 결과 원문과 정확한 파일/해시를 대조한다. 발견 항목을 숨기기 위해 경로 전체를 허용하지 않는다. 비밀정보 점검은 필요할 때 `gitleaks git --redact=100 --log-opts=--all .`로 수동 실행하며 자동 hook이나 감시 작업을 등록하지 않는다.

사용자 지시에 따라 `OTTSub`는 공개하고 `ottsub-dev`는 비공개로 유지한다. 저장소 공개 자체가 Alignerr 참여 자격이나 제출 자료의 이용 조건을 충족했다는 인증은 아니다.
