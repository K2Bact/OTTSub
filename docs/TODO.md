# OTTSub 할 일 설명과 근거 — 상태는 Dev_Status.xlsx

2026-10-20 사용자 요청으로 OTTSub 항목을 [공통 상태표](../../Dev_Status.xlsx)의 「할 일」 시트에 전부 이관했다. **상태·담당·갱신일의 정본은 표의 앱 `OTTSub`, ID `OTT-1`–`OTT-79`다.** 이 문서는 ID별 범위·판단 조건·근거만 설명하며 별도 체크리스트를 운영하지 않는다.

작업 시작 시 상태표의 OTTSub 줄을 먼저 읽고 [HANDOFF](HANDOFF.md)·[QA](QA.md)·[AI 대화](../OttsubAiTalk.md)와 대조한다. 서로 다르면 현재 코드·검사 증거·사용자 말로 확인한다. 표 쓰기는 `app_common/AGENTS.md` §5.1의 Excel 열림 확인·백업·openpyxl·추가/재열람 규칙을 따른다.

**실기 수행 조건:** 실제 Netflix·스크린리더·Linux·ChromeOS·Mac/물리 화면 검사는 사용자의 별도 재개 지시가 있을 때만 진행한다. 새 대화나 일반 코드 수정 요청으로 그 지시를 대신하지 않는다. 자동 QA·실제 unpacked 확장·실서비스·물리 기기 증거는 분리한다.

## 검증 범위와 관찰 기준

<a id="geo-todo-20261020"></a>
<a id="ott-1"></a>
### OTT-1 GEO 효과 관찰

한국어·영어·스페인어 소개 페이지의 실제 색인, 생성형 답변의 인용 URL·제품 식별·답변 정확도, 유입·설치 지표를 구분해 관찰한다. 공개/HTTP 성공을 검색 성과로 간주하지 않는다. 질문과 기록 형식은 [evaluation.json](../store_assets/geo/evaluation.json), 구현·게시 근거는 [QA](QA.md#geo-publication-20261020)를 따른다. [주간 측정 방법](../store_assets/geo/README.md)과 고정 캠페인 링크로 관찰 조건을 맞춘다. 실제 통계 입력과 인용 증거는 아직 없어 효과 관찰을 완료로 바꾸지 않는다. 자동 AI/API 호출이나 모니터링 예약은 이번 요청 범위가 아니다.

<a id="ott-2"></a>
### OTT-2 Windows 실제 Netflix 재생 경계

실제 작품에서 seek 앞/뒤·intro skip·광고 진입/종료·수동/자동 다음 화·탭 복귀를 확인한다. 현재 회차의 자막과 주/보조 싱크, 일반/CC 및 원본 자막 ON/OFF·중앙 modal 조합을 기록한다. 로컬 합성 QA와 실제 Netflix/DRM을 구분한다. [준비 중단 경계](QA.md#2026-10-16-실제-브라우저-검증-준비--보류)를 따른다.

<a id="ott-3"></a>
### OTT-3 스크린리더 실제 발화

패널에서 싱크 슬라이더의 부호·초 단위, 버튼 이름, 상태 안내창의 역할·포커스 이동/복귀를 사람이 듣는 실제 발화로 확인한다. 기존 DOM/접근성 트리 검사를 실제 발화 증거로 대신하지 않는다. [기존 접근성 실측](QA.md#aeo-review-20261020)을 기준으로 한다.

<a id="ott-4"></a>
### OTT-4 Linux 환경·호환성

환경 확보부터 설치·확장 로드·화면·키보드·저장 복원·오프라인 회귀까지의 [기존 세부 계획](QA.md#2026-10-16-linux-가상환경-검증-계획--실행-전)을 따른다. 환경 구축은 사용자의 재개 지시 후 진행한다.

<a id="ott-5"></a>
### OTT-5 ChromeOS 환경·호환성

실제 ChromeOS 환경을 확보하고 확장 실행·패널·단축키·설정 보존을 확인한다. Linux 결과로 ChromeOS 통과를 대신하지 않는다.

<a id="ott-6"></a>
### OTT-6 Mac 화면·입력 상호작용

전체화면 진입/해제·창 크기, 자막 drag·Option+R 위치 초기화·잠금·hover pause/resume와 원본 재생바/control 간섭을 확인한다. unavailable 저장 언어/CC에서 지원 항목으로 이동하는 실제 native-menu 키 동작도 포함한다. [Mac 중간 보고서](QA.md#2026-10-14-mac-중간-보고서--41)의 실제 확인 범위를 먼저 읽는다.

<a id="ott-7"></a>
### OTT-7 Mac 실제 재생·회차·광고·음성 싱크

실제 Mac/Netflix의 탐색·intro skip·탭 복귀·다음 화, 주/보조 언어·일반/CC·원본 자막 ON/OFF·중앙 modal 조합을 확인한다. 광고 진입/종료는 실제 광고가 관찰된 조건에서만 확인한다. 실제 음성과 대사를 대조하고 CDN token 재발급은 새 실제 관찰 자료로 판단한다.

<a id="ott-8"></a>
### OTT-8 Mac 물리 키보드·IME

실제 키보드 배열/JIS·Option dead-key·한국어 IME 조합과 Command+L/F 등 브라우저 기본 입력 보호를 확인한다. 합성 KeyboardEvent·붙여넣기·OS 자동 입력을 물리 입력 성공으로 확대하지 않는다.

<a id="ott-9"></a>
### OTT-9 Mac 실제 Netflix 성능·장시간 안정성

Windows의 재생/일시정지 각 15분 계측과 실제 Mac/Netflix 측정을 구분한다. 정상 조건의 이미 통과한 시험을 반복하지 않는다. 새 누수 의심 근거가 확인된 경우에만 2시간 관찰로 확대한다. [로컬 성능 근거](QA.md#2026-10-15-성능설정-보존--45)를 따른다.

<a id="ott-10"></a>
### OTT-10 물리 4K·DPR·배율·선명도

물리 화면에서 실제 4K·OS 배율·브라우저 확대/축소와 자막 선명도를 확인한다. 합성 크기/DPR 조합 [228개 검사](QA.md#resolution-mobile-20261020)와 실제 장치 검증을 구분한다.

<a id="ott-11"></a>
### OTT-11 사용자가 제외한 동기화 추진

2026-10-19 사용자 지시 “동기화 자체를 잊어라”를 따른다. 기기 간 설정 동기화·ID 고정·클라우드/물리 두 기기 실험을 할 일이나 아이디어로 다시 제안하지 않는다. 별도 삭제 지시가 없는 기존 저장 구현과 과거 QA는 보존한다.

<a id="ott-40"></a>
## OTT-40 스토어 반영 이력

2026-10-20 사용자가 “이런거 올리지마. 그냥 된 걸로 알고 있어”라고 확인했다. 그 사용자 확인을 표와 콘솔 기록의 근거로 남겼다. [후속 기록](../OttsubAiTalk.md#app-status-confirmed-20261020)을 따른다. 앞으로 배포 루틴의 업로드·심사·게시 여부를 별도 확인 할 일이나 콘솔 대기 행으로 만들지 않는다. Google 계정 접근이나 콘솔 조작은 요청하지 않는다.

## 법률·정책 검토의 판단 범위

<a id="ott-42"></a>
### OTT-42 개인정보 처리 고지

자막·재생 정보의 로컬 처리, 환경설정의 기존 Chrome 저장 경로, 보관·문의, 후원 링크·GitHub 호스팅을 [한·영 원본](../store_assets/geo/privacy.json)에 설명했고 2026-10-21 사용자 지시로 [한국어](https://k2bact.github.io/ottsub-site/ko/#privacy)·[영어](https://k2bact.github.io/ottsub-site/#privacy) 홈페이지에 실제 게시했다. HTTP·검토본 해시·Pages built를 확인했다. 콘솔 정책 필드를 조작한 결과로 확대하지 않는다. 기존 저장 구현 변경이나 동기화 추진은 없다. [게시·검증](../OttsubAiTalk.md#lr-comparison-privacy-publication-20261021)을 따른다.

<a id="ott-43"></a>
### OTT-43 Netflix 약관과 허용 범위

Language Reactor의 현재 200만 사용자·2019년부터의 공개 이력과 6.0.1 배포본의 유사 자막 처리 방식을 확인했다. 오래 운영된 동종 도구라는 실질적 선례를 앞선 검토에 보완했으며 OTTSub만 특이하거나 즉시 중단해야 한다고 결론내리지 않는다. 다만 공개 자료에서 Netflix의 공식 허락·OTTSub 적용 법률 판단이 입증되지는 않았다. 이 계약상 경계는 운영 범위를 판단할 때 참고하고 제품 핵심 동작을 임의 제거하거나 Netflix에 연락하지 않는다. [비교 근거·판정](../OttsubAiTalk.md#lr-comparison-privacy-publication-20261021)을 따른다.

<a id="ott-44"></a>
### OTT-44 개발용 플레이어 사본의 이용 권리

사용자는 2026-10-21 “어차피 배포도 안 하는데”라며 비배포 개발 자료의 유지 판단을 밝혔다. `tests/fixtures/netflix-player-reference.js`와 기존 검증을 보존하고 별도 권리 보완/대체 작업은 추진하지 않는다. 스토어 ZIP·공개 홈페이지에는 들어가지 않는다. 이 작업 범위 결정과 법률상 이용 허락의 확인을 구분한다. [사용자 판단·비배포 확인](../OttsubAiTalk.md#lr-comparison-privacy-publication-20261021)을 따른다.

<a id="ott-45"></a>
### OTT-45 태국어 메뉴와 회귀

태국어 ไทย (TH), th 사전 192키·확장 메타데이터·UI 감지/저장·Thai 영어명 정렬·제공자 라벨 가드를 추가했다. [정식 QA](QA.md#thai-ui-20261021)와 [실제 수정·미실행 경계](../OttsubAiTalk.md#thai-ui-20261021)를 따른다. 자막 언어/지역/CC/track ID와 native request·재생 guard는 바꾸지 않는다. 이번 범위는 개발 소스이며 기존 배포 ZIP·스토어 자료는 당시 파일로 보존한다.

<a id="ott-46"></a>
### OTT-46 태국어 등록 자료와 스크린샷

사용자가 요청한 [태국어 등록 문구·이중/싱크/학습 3장](../store_assets/th/README.md)을 .60 실제 UI와 별도 예시 상태로 준비했다. [검사](QA.md#th-store-shots-20261021)·[기록](../OttsubAiTalk.md#th-store-shots-20261021)에 소스 경계와 미실행 범위를 둔다. 기존 ZIP에서 제작된 이미지로 잘못 표시하지 않으며 배포 확인 대기·업로드/심사 할 일을 추가하지 않는다.

## 품질 보강 작업의 범위와 근거

2026-10-21 사용자가 후보 9개 전부를 승인했다. 상태·담당은 공통 상태표를 따르며 아래는 검증 범위다. [통합 QA](QA.md#quality-20261021)·[AI 응답](../OttsubAiTalk.md#quality-20261021)을 따른다.

<a id="ott-47"></a>
### OTT-47 Gate 12 정식 QA 편입·음성 대조군

Pinned/shared Gate 12 정식 편입. 사전·메타데이터·문자 주입 대조군 통과; 원어민 인증 아님. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-48"></a>
### OTT-48 새 언어 회귀 검사 누락 방지

6개 회귀 스위트 공통 UI 언어 목록 + 독립 inventory/정렬 변형 검사. 현재 15언어. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-49"></a>
### OTT-49 15언어 번역 문장·용어 품질 검토

15언어 의미·용어 검토, 2880항목 문자/기술 표기 검사. 4개 상태 설명 59값 정정; 원어민 감수 별도. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-50"></a>
### OTT-50 복잡한 자막 표시 사례 확대

실제 DOMParser/renderer 4사례: ruby·스타일·겹침·혼합 RTL/LTR·긴 문장·활성 태그 차단 통과. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-51"></a>
### OTT-51 파서 변형·대용량·손상 입력 검사

180개 seeded 입력 등 6개 신규 런타임 검사. 파서 5개 재현 결함 수정 후 통과. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-52"></a>
### OTT-52 고대비·확대·색상 독립 접근성 보강

저대비 3종·무명 스위치 5개·고대비 손잡이 보완. 15언어 forced-colors/320px + 대표 3언어 200% 33검사; 실발화 별도. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-53"></a>
### OTT-53 느린 응답·회차·언어·패널 복합 장애 검사

응답 body 지연·언어·회차·팝업 재열기 복합 5검사 통과. 실제 소스/로컬 bridge, 라이브 Netflix 아님. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-54"></a>
### OTT-54 반복 전환 리소스 수명·누적 검사

전체화면 예약 갱신의 제거 후 재생성 수정. 렌더러 300회·구독 500회·해제 자원/GC heap 상한 통과. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-55"></a>
### OTT-55 URL 대기·지원 불가·복구 상태 안내 개선

URL 대기는 구체적인 선택 안내, 지원 불가는 언어/종류 구분. 15언어 실제 팝업 복구 버튼/무단 변경 없음 확인. 자세한 실행 입력·판정은 통합 QA에 연결했다.

<a id="ott-56"></a>
### OTT-56 프로그램 전체 다각도 재검수·결함 후속

전체 프로그램의 구문·권한·자막/시간·광고/회차·언어·저장·화면·비동기·자원·패키지 경계를 검수했다. 상태 연결 종료 리스너와 긴 자막 Unicode 경계 수정, 모의 dual 상태 응답 정정 및 추가 회귀의 [검사·범위](QA.md#full-review-20261021)·[AI 판정](../OttsubAiTalk.md#full-review-20261021)을 따른다. 상태·담당·갱신일은 공통 상태표가 정본이다. 실서비스·실기 보류를 별도 완료로 바꾸지 않는다.

<a id="ott-57"></a>
### OTT-57 손상 입력·비동기 취소·단일 자막 표시 재검수

잘못된 WebVTT 시간 줄·숫자 명령과 실제 단일 자막 줄바꿈을 재현하고, 손상 저장 설정·응답/재시도 중 취소 가설을 검증했다. [수정·회귀 근거](QA.md#boundary-review-20261021)·[AI 판정](../OttsubAiTalk.md#boundary-review-20261021)을 따른다. 상태·담당·갱신일은 공통 상태표가 정본이며 사용자 보류의 실기 검사를 대신 완료하지 않는다.

<a id="ott-58"></a>
### OTT-58 hover 옵션 전환·이전 시간 초과 진단 재검수

hover 일시정지 OFF 전환의 소유 pause와 대기 callback, 수동/숨김/회차 경계를 검증했다. 기존 전체 실행 시간 초과는 단계 로그를 추가해 재검사했다. [수정·검사·미실행 경계](QA.md#transition-review-20261021)·[AI 판정](../OttsubAiTalk.md#transition-review-20261021)을 따른다. 상태·담당·갱신일은 공통 상태표가 정본이다.

## 구현·검증 작업의 근거 색인

다음 ID는 과거 수행 내용의 근거를 찾는 색인이다. 현재 상태는 공통 상태표에서 확인한다. 각 보고서의 당시 build·직접 실행/기존 로그 인용·미실행 범위를 유지한다.

| ID | 주제 | 자세한 근거 |
|---|---|---|
| <a id="ott-12"></a>OTT-12 | 러시아어 메뉴·지역 감지·라벨 출처 가드 | [기록](../docs/QA.md#russian-ui-20261020) |
| <a id="ott-13"></a>OTT-13 | 포르투갈어(포르투갈) 메뉴·좁은 버튼 문구 | [기록](../docs/QA.md#2026-10-19-포르투갈어포르투갈-메뉴--56) |
| <a id="ott-14"></a>OTT-14 | 대만 번체 메뉴·시스템 우선 언어 정렬 | [기록](../docs/QA.md#2026-10-18-대만-번체-메뉴와-언어-정렬--55) |
| <a id="ott-15"></a>OTT-15 | 터키어 메뉴·감지·선택 복원 | [기록](../docs/QA.md#2026-10-18-터키어-메뉴--53) |
| <a id="ott-16"></a>OTT-16 | 벵골어 메뉴·감지·선택 복원 | [기록](../docs/QA.md#2026-10-18-벵골어-메뉴--52) |
| <a id="ott-17"></a>OTT-17 | 말레이어 메뉴·좁은 화면·검수 후속 | [기록](../docs/QA.md#2026-10-15-말레이어-메뉴--49) |
| <a id="ott-18"></a>OTT-18 | 히브리어 메뉴·RTL HUD 검수 후속 | [기록](../docs/QA.md#2026-10-15-히브리어-검수-후속--43) |
| <a id="ott-19"></a>OTT-19 | AEO 설명문 정정·14언어 접근성 보강 | [기록](../docs/QA.md#aeo-review-20261020) |
| <a id="ott-20"></a>OTT-20 | GEO 설명·FAQ·한영 소개 페이지 기반 구현 | [기록](../docs/QA.md#geo-implementation-20261020) |
| <a id="ott-21"></a>OTT-21 | GEO GitHub Pages 공개·배포 경계 확인 | [기록](../docs/QA.md#geo-publication-20261020) |
| <a id="ott-22"></a>OTT-22 | 1.3.7 현재 코드 전체 자동 QA | [기록](../docs/QA.md#release-137-20261020) |
| <a id="ott-23"></a>OTT-23 | 1.3.7 ZIP 생성·실제 확장 로드 검사 | [기록](../docs/QA.md#release-137-20261020) |
| <a id="ott-24"></a>OTT-24 | 러시아어 이름·짧은/상세 설명·스크린샷 3장 | [기록](../store_assets/ru/README.md) |
| <a id="ott-25"></a>OTT-25 | 포르투갈어 등록 문구·스크린샷 3장 | [기록](../store_assets/pt-pt/README.md) |
| <a id="ott-26"></a>OTT-26 | Gemini 전체 검수 후속·STORE_GUIDE 검사 복구 | [기록](../docs/QA.md#full-program-review-20261020) |
| <a id="ott-27"></a>OTT-27 | Gemini 러시아어 9라운드 보고서 대조 | [기록](../docs/QA.md#ru-review-response-20261020) |
| <a id="ott-28"></a>OTT-28 | Gemini 포르투갈어 9라운드 보고서 대조 | [기록](../docs/QA.md#pt-pt-review-20261019) |
| <a id="ott-29"></a>OTT-29 | wheel 간헐 QA 실패 재현·storage fixture 수정 | [기록](../docs/QA.md#2026-10-16-wheel-간헐-실패-후속--51-제품-유지) |
| <a id="ott-30"></a>OTT-30 | Windows Microsoft Edge 로컬 호환성 | [기록](../docs/QA.md#2026-10-15-microsoft-edge-호환성--47) |
| <a id="ott-31"></a>OTT-31 | 로컬 성능·설정 저장/재시작 결함 보완 | [기록](../docs/QA.md#2026-10-15-성능설정-보존--45) |
| <a id="ott-32"></a>OTT-32 | 일시정지 CPU 최적화 실험·채택 판단 | [기록](../docs/QA.md#2026-10-15-일시정지-cpu-검토--47-유지) |
| <a id="ott-33"></a>OTT-33 | CDN 최소 권한 감사·네트워크 경계 검사 | [기록](../docs/QA.md#2026-10-15-cdn-최소-권한-감사--44) |
| <a id="ott-34"></a>OTT-34 | popup 설정 연결 모듈화·검수 후속 | [기록](../docs/QA.md#2026-10-15-모듈화-검수-후속--47) |
| <a id="ott-35"></a>OTT-35 | 분석 CSV 보관·해상도/모바일 기술 범위 확인 | [기록](../docs/QA.md#resolution-mobile-20261020) |
| <a id="ott-36"></a>OTT-36 | AI 검수·질문·동의·반박 기록 단일 파일 이관 | [기록](../docs/QA.md#pt-pt-review-20261019) |
| <a id="ott-37"></a>OTT-37 | 원본 검수·문서·QA 산출물 프로젝트 내부 정리 | [기록](../docs/QA.md#2026-10-15-파일폴더-정리--50-유지) |
| <a id="ott-38"></a>OTT-38 | QA 입력 해시의 생성 Python 캐시 제외 | [기록](../docs/QA.md#2026-10-19-공유용-qa-입력-정리--55-유지) |
| <a id="ott-39"></a>OTT-39 | 과거 1.3.4–1.3.6 등록 자료·ZIP 준비 이력 보존 | [기록](../store_assets/STORE_GUIDE.md) |
| <a id="ott-41"></a>OTT-41 | Mac 자동 QA·실제 Chrome 기본 동작 일부 | [기록](../docs/QA.md#2026-10-14-mac-중간-보고서--41) |

## 시장 조사 산출물의 범위

<a id="ott-59"></a>
### OTT-59 자막 확장 광고 대응·수익 모델 조사

[로컬 보고서](../artifacts/research/ott-subtitle-market-20261021/OTTSub_자막확장_시장조사.html)의 업체별 가격·무료/유료 경계·광고 싱크 수정 근거를 확인했다. 공식 주장·미확인·사업적 제안을 구분하며 매출이나 실서비스 성능을 인증하지 않는다. [검사](QA.md#market-research-20261021)·[AI 기록](../OttsubAiTalk.md#market-research-20261021)을 따른다. 상태·담당·갱신일은 공통 상태표가 정본이다.

## 핀란드어와 개발 도구

<a id="ott-60"></a>
### OTT-60 핀란드어 메뉴·지역 감지

기존 언어를 유지하며 fi 사전·메타데이터·Suomi (FI) 메뉴를 연결했다. 지역별 자막 identity와 UI resolver를 구분한다. [검사](QA.md#finnish-ui-20261022)·[AI 기록](../OttsubAiTalk.md#finnish-ui-20261022)를 따른다. 상태·담당·갱신일은 공통 표가 정본이다.

<a id="ott-61"></a>
### OTT-61 개발본 시장조사 보고서 링크

개발 라벨에서만 내부 보고서를 표시하고 실제 MV3 확장에서 검색/계산이 동작함을 확인했다. 기존 패키지 allowlist와 배포 라벨의 숨김을 함께 검사했다. [보고서](../tools/dev-research/report.html)·[검사](QA.md#finnish-ui-20261022)·[AI 기록](../OttsubAiTalk.md#finnish-ui-20261022)를 따른다.

## GEO 설명과 측정 기반

<a id="ott-62"></a>
### OTT-62 FAQ·출처별 링크·주간 비교

사용자가 블로그는 제외하고 나머지 유용한 제안을 적용하라고 요청했다. 기존 한영 홈페이지에 싱크 해결/점진적 오차 FAQ·고정 UTM을 반영하고 로컬 주간 비교 도구를 추가했다. [검사](QA.md#geo-improvements-20261022)·[AI 기록](../OttsubAiTalk.md#geo-improvements-20261022)를 따른다. 실제 성과 관찰은 OTT-1과 구분하며 상태·담당·갱신일은 공통 표가 정본이다.

## 스페인어 홈페이지

<a id="ott-63"></a>
### OTT-63 스페인어 페이지·세 언어 탐색

/es/에 제품 소개·FAQ11개·개인정보 고지를 추가하고 한영과 상호 언어 전환·검색 메타·사이트맵·고정 캠페인 링크를 연결했다. [검사](QA.md#site-spanish-20261022)·[AI 기록](../OttsubAiTalk.md#site-spanish-20261022)를 따른다. 상태·담당·갱신일은 공통 표가 정본이며 검색 효과는 OTT-1에서 별도 관찰한다.

## 현재 배포 자료

<a id="ott-64"></a>
### OTT-64 1.3.8 ZIP·핀란드어/태국어/히브리어 자료

사용자가 현재 개발본을 업로드할 ZIP과 fi/th 스크린샷·설명 준비를 요청했다. 기존 he 요청도 함께 반영했다. 새 ZIP·16언어 메타데이터·실제 ZIP UI 이미지9장·이름/짧은/상세 설명을 검증했다. [검사](QA.md#release-138-20261022)·[AI 기록](../OttsubAiTalk.md#release-138-20261022)·[등록 지침](../store_assets/STORE_GUIDE.md)을 따른다. 상태·담당·갱신일은 공통 표가 정본이며 실제 업로드 대기 항목은 만들지 않는다.

## 배포본 홈페이지 연결

<a id="ott-65"></a>
### OTT-65 설정 화면·Chrome 웹사이트 연결

기존 ZIP에 링크가 없음을 확인하고 화면 하단 anchor와 manifest homepage_url을 추가했다. 새 탭·키보드 포커스·16언어/320px와 실제 ZIP/공개 HTTPS를 확인했다. [검사](QA.md#homepage-link-20261022)·[AI 기록](../OttsubAiTalk.md#homepage-link-20261022)를 따른다. 상태·담당·갱신일은 공통 표가 정본이다.

## 안정성·호환성 검토와 후속

<a id="ott-66"></a>
### OTT-66 수정 계획 실행 검토

2026-10-28 사용자 진행 지시로 검사 신뢰성부터7영역을 대조하고 필요한 유한 오프라인 검사를 수행했다. [QA 결과](QA.md#stability-compatibility-20261028)의 새119/119·엔진12/12·강제 worker재시작과 미실행 경계를 구분한다. 제품 소스는 보존했다. 검토 완료가 아래 지적 수정 완료를 뜻하지 않는다.

<a id="ott-67"></a>
### OTT-67 P2 검사기 실패보고와 종료코드 판정

2026-10-29 사용자 실행 지시로 보정 계획을 구현·검증했다. 회귀42/42·정상28재생·새전체120/120와 episode 무개수 계약을 확인했다. [현재 완료 근거](QA.md#qa-panel-fixes-20261029). 아래 미착수 문장은 이전 계획 검토 당시 기록이다.

2026-10-29 회신 수령·검토 완료. 정상episode는total이 없다는 계약과 누락passed/타입·count모순 검증을 보완한 [보정 계획](../OttsubAiTalk.md#gemini-fix-plan-reassessment-20261029)을 기준으로 한다. 구현은 아직 안 했고 회신 기다림은 끝났다.

SC-01. 실제 run/summarizeOutput 함수에서 browser passed=false/errors/failed cases+exit0를 PASS로 집계한다. 비정상/누락 보고도 exit0만으로 통과할 수 있다. 구조화 성공을 요구하고 모순·깨진/빈 보고를 거부하는 보완과 양성/음성 대조군이 필요하다. timeout/spawn/nonzero exit의 실패 판정은 보존한다. 이번119 실행의 raw28 browser보고에는 실패 모순이 없었다. [재현·합격기준](QA.md#stability-compatibility-20261028). 이번 검토에서 검사기를 고치지 않았다. 2026-10-28 사용자 후속으로 [Gemini 해결 계획](../OttsubAiTalk.md#gemini-fix-plan-request-20261028-sc01-sc02)을 요청했고 수신함 저장까지 확인했다. 구현은 미착수다.

<a id="ott-68"></a>
### OTT-68 P3 sidePanel API 방어·지원 기준

2026-10-29 미지원/동기throw/Promise거부 유한처리·Chrome API하한114 선언을 구현했고 실제panel22/22·worker 강제재시작 후fi/2300ms 복원을 검증했다. 새전체120/120. [현재 완료 근거](QA.md#qa-panel-fixes-20261029). 아래 미착수 문장은 이전 기록이며 구버전실기/실서비스 미검증은 유지한다.

2026-10-29 회신 수령·검토 완료. setPanelBehavior=Chrome116 필수 주장은 기각했다. API하한후보114와 전체지원정책을 구분하고 동기throw/비동기reject를 함께 처리하는 [보정 계획](../OttsubAiTalk.md#gemini-fix-plan-reassessment-20261029)을 따른다. 별도탭폴백은 제외하며 구현은 미착수다.

SC-02. manifest의 최소 지원 버전과 `src/side-panel.js`의 API 미지원/등록 거부 처리를 검토한다. VM missing API/Promise rejection 경계를 재현했으며 실제 최신 native Chromium 등록과 강제 재시작은 정상이다. 사용 API 전체의 최소 버전을 근거로 지원 범위를 정하고, 처리되지 않은 예외 대신 유한 진단이 남도록 보완할 후보다. 구형 실제 브라우저 검증은 하지 않았다. 자동 재시도/상주·Firefox 이식 범위를 만들지 않는다. [근거와 경계](QA.md#stability-compatibility-20261028). 이번 검토에서 제품을 고치지 않았다. 2026-10-28 사용자 후속으로 같은 파일의 [Gemini 계획 회신](../OttsubAiTalk.md#gemini-fix-plan-request-20261028-sc01-sc02)을 요청했다. 구현은 미착수다.

<a id="ott-69"></a>
### OTT-69 단축키 카드 안내문 삭제

사용자 스크린샷의 키보드 배열/슬라이더 안내를 공통 DOM에서 삭제했다.16개 언어에 적용되고 실제 단축키/사전192키는 유지한다. 삭제된 요소를 기대하던 기존 browser검사를 수정해28/28, Pinned/Shared 게이트를 확인했다. [현재 QA](QA.md#shortcut-note-removal-20261028). 기존ZIP은 변경하지 않았다.

<a id="ott-70"></a>
### OTT-70 Gemini 추가 검사계획 내부5사이클 요청

요청/RN적재/고정OTTSub깨우기1회/읽음/C1~C5회신/항목별재평가를완료했다. 사용자 지시 범위의 지정AI작업은 재확인하지 않는다는이번허가로진행했고추가왕복은없었다. [최종계획](../artifacts/reason-network/review-runs/RN-LOCAL-REVIEW-71FA0276EF93A1A4/FINAL_PLAN.md)·[원문/반박](../OttsubAiTalk.md#gemini-5cycle-plan-result-20261029)을기준으로한다. 내부5단계별후보변화추적은미흡해5차례정밀검토/실험을독립검증했다고하지않는다.

계획의조건부후보는기존coverage대조후의1.native멀티탭/늦은응답/패널종료,2.heldbody중kind/OFF조합이다. episode보고표준화는선택정비다. 이번완료는계획요청·검토에한정되고제품변경/새검사실행은안했다. 상태정본은공통표다.

<a id="ott-71"></a>
### OTT-71 실제 멀티탭·트랙 전환 지연응답 안정성 검사

사용자실행지시로두후보의기존coverage를대조하고native두탭/늦은응답/패널종료와normal/CC·OFF/ON·heldbody역순완료조합을검사했다. 새제품결함은관찰되지않아제품코드를바꾸지않았다. 검사인프라만보강해새전체121/121·입력176, native5·기존5를포함한compound10과두guard음성대조검출을확인했다. [완료근거](QA.md#context-churn-20261029)·[AI기록](../OttsubAiTalk.md#context-churn-20261029). 패키지5PASS/1SKIP·ZIP9보존. 실서비스/실기/장시간은미실행이다.

## 이전 링크 안내

이관 전 TODO의 완료 기록·재개 순서·배포 참고는 아래 앵커를 유지한다. 현재 범위는 위 ID 설명, 당시 원문은 [이관 전 보관본](../archive/docs/status-ledger-20261020/before/docs/TODO.md)을 읽는다.

<a id="남은-일--geo-후속실기-보류"></a>
<a id="남은-개발검증-과제"></a>
<a id="완료-기록과-보류-범위"></a>
<a id="재개-순서"></a>
<a id="개발-과제-처리-상태"></a>
<a id="배포-루틴-참고--할-일아이디어-목록에서-제외"></a>

<a id="ott-72"></a>
### OTT-72 1.3.9 스토어 ZIP 준비 및 개발본 분리

사용자가 요청한 현재 코드의 스토어 ZIP을 준비한다. 기존 ZIP을 보존하고 정식 버전을 증가시키며 개발 항목 제외·ZIP 무결성·실제 추출본의 언어/설정/링크 동작을 확인한다. 업로드·심사 대기 항목은 만들지 않는다. [배포 검사](QA.md#release-139-20261029)와 공통 상태표를 따른다.

<a id="ott-73"></a>
### OTT-73 한국어·영어 스토어 상세 설명 정정

기존 언어 중 두 언어만 선택해 현재 manifest와 기능 범위에 맞는 전체 설명 수정본을 제공한다. 제품명·짧은 설명·다른 언어·ZIP은 유지한다. [문구 대조와 파일](QA.md#store-listing-139-ko-en-20261029)·공통 상태표를 따른다.

<a id="ott-74"></a>
### OTT-74 Gemini 광고 전체 기능 실제10회 검사 요청

광고 관련 구현/coverage를 열거하고 전체 검사 묶음을 회차별 실제 실행하도록 요청한다. 계획/기존로그/미실행을 실제검사와 구분하고 제품·ZIP 기준을 고정한다. RN적재·지정채팅깨우기·실제읽음·회신을 각각 기록한다. [요청과 전달단계](../OttsubAiTalk.md#gemini-ad-test-10-request-20261029) 및 상태표를 따른다. 상주/예약/자동재시도는없다.

<a id="ott-75"></a>
### OTT-75 Gemini 광고10회 결과·테스트 적절성 독립 검토

회신과 원본 로그·현재검사소스를 대조해 실제실행·개수·실패판정·광고coverage·무결성주장을 항목별재평가한다. 원본은보존하고 정정집계와임시고장사본의실패검출근거를남긴다. [판정과범위](QA.md#codex-ad-test-10-reassessment-20261029)·공통상태표를따른다. 제품/ZIP수정이나다른AI추가왕복은포함하지않는다.

<a id="ott-76"></a>
### OTT-76 프랑스어 메뉴·감지·기존 언어 회귀

fr 메뉴192문구와Chrome metadata를추가하고시스템우선정렬/명시적선택저장/RTL복귀/좁은폭/라벨출처·프랑스/캐나다자막identity분리를확인한다. 기존언어사전·배포ZIP은보존하고실제수정/미실행범위를구분한다. [구현/QA](QA.md#french-ui-20261029)·공통상태표를따른다.

<a id="ott-77"></a>
### OTT-77 Gemini 프랑스어 독립 검수·완료 결과 회신

사용자가 지정한 기존OTTSub 채팅에 프랑스어문구/동작/레이아웃과검사신뢰성 독립검수를 요청하고, 실제읽음/수락·완료회신을 구분한다. task_result는consume으로검증한후 독립재평가한다. [원문과단계](../OttsubAiTalk.md#gemini-french-review-request-20261029)·공통상태표를따른다. 자동재시도나상주감시는없다.

OTT-77 회신수령후독립대조근거: [결과와증거한계](QA.md#codex-french-peer-result-20261029). 요청된귀환/consume까지확인했으며원본실행로그가없는125합계는별도인증하지않는다.

<a id="ott-78"></a>
## OTT-78 Gemini 검수 보고 정정·재발 방지 지침 기록

프랑스어 보고의 증거·수치·상태 문구·조판 설명·검사 단위 오류를 정정하고 실제 OTTSub 정본 지침에 재발 방지 절을 기록하도록 요청했다. 지침 경로/절·backup·diff/전후해시·재열람 근거를 회신받아 검증한다. 새 제품 검사나 자동화/메모리 설정은 범위 밖이다. [요청/실제 전달 단계](../OttsubAiTalk.md#gemini-reporting-rules-request-20261029).

OTT-78 검증 근거: Gemini의 실제 정정문과 AGENTS.md 추가8규칙·백업/전후해시·기존 규칙 보존을 직접 대조했다. [회신 판정](../OttsubAiTalk.md#codex-reporting-rules-result-20261029)·[독립JSON](../artifacts/qa/review-reporting-rules-20261029/codex-reassessment.json). 과거125건의 실행 근거 미보존과 의미 전수감수 미검증은 정정문에서도 유지했다.

<a id="ott-79"></a>
## OTT-79 저장소 공유 경계·과거 이력 정리

현재GitHub main은 로컬참고/AI대화를 제외한 새1커밋이다. 원본/기존이력은 로컬에 보존했고179입력/ZIP10해시를 확인했다. 옛 커밋이 SHA로 조회되므로 완전삭제/공개준비완료로 간주하지 않는다. 기존저장소 이름변경·별도독립비공개저장소 생성·옛저장소 비공개보관안은 자동승인 심사에서 거절돼 미실행이다. 해당구체범위의 인간승인 뒤에만 진행한다. [판정/근거](../OttsubAiTalk.md#repository-cleanup-20261030).

OTT-79 후속 검증 근거: 사용자가 구체적인 재구성안을 “그렇게 해”로 승인했다. 새독립비공개 OTTSub와 옛비공개읽기전용 보관저장소의 서로다른ID·옛객체새저장소404·보관본6커밋/원본유지·검증트리동일을확인했다. [완료근거](../OttsubAiTalk.md#repository-isolation-complete-20261030). 앞의 자동승인거절/대기 문장은 추가승인 전의기록이다.
