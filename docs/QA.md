# 검사 결과와 실사용 범위 — 1.3.9 / .71

<a id="rights-reserved-20261030"></a>
## 2026-10-30 권리 유보 고지 — .71

현재 개발본은 **1.3.9-local-rights-notice-20261030.71**이며 17개 UI 언어×192키를 유지한다. K2Bact 권리를 보유한 부분에만 전체 조건을 적용하고 공식 배포본의 일반 최종 사용자 이용(직장 포함)은 무료로 허용한다. 추가 소스 재사용·수정/재배포·판매 등은 사전 서면 허락이 필요하되 법률상 예외·GitHub 열람/포크 권리·제3자 고유 조건을 보존한다. 정본은 [LICENSE](../LICENSE)다.

- **직접 실행한 전체 QA: 122/122 PASS**, 290.384초. syntax46/runtime31/legacy15/browser30. [summary](../artifacts/qa/2026-10-30T00-28-14-618Z-23572/summary.json)의 180개 입력이 현재 파일과 일치하고 실행 중 변경은 없다. 프로세스가 없는 JSON 구문 검사는 status, 실행 검사는 status와 exitCode를 함께 확인했다.
- 패키지 경계 테스트는 **8실행·7 PASS·1 SKIP**이다. 기존 ZIP이 현재 개발 입력보다 이전 버전인 비교 1개를 건너뛰었고, 신규 LICENSE 원문 포함/빈 조건 거부/기존 README 제외 경계를 검증했다. 새 ZIP은 만들지 않았다.
- 새 권리 고지 검증은 **23그룹 PASS**(실제 팝업17언어, 홈페이지3언어, 기타 경계3그룹)다. 320px 실제 팝업 copyright 표시/키보드 포커스, 새 탭 #terms 연결, 홈페이지320/360/430/768/1280px 넘침 및 전체 조건 링크를 확인했다. 스토어 기존 설명16개에 고지1회·기존 도움말 보존을 확인했다.
- 기존 사이트 검사 **41그룹**, GEO/주간 비교 회귀 **28그룹** PASS. 모두 별도 오프라인 Chromium 151.0.7922.34, 외부 리소스 요청/AI호출 없이 실행했다. 그룹을 제품 case 수로 합산하지 않는다.
- 공개 사이트 commit `7ec19b6d67914f582ec358bf87d2f27ae14109fc`: GitHub Pages built와 HTML3/CSS/전체조건/README의 실제 HTTP200·검토본 SHA256 일치, 나머지 파일 보존을 확인했다. [한국어 고지](https://k2bact.github.io/ottsub-site/ko/#terms)·[영문 전체 조건](https://k2bact.github.io/ottsub-site/LICENSE.txt).

**검사기 보정과 실패 보존:** 신규 검사 첫 실행은 CRLF/LF 비교와 smooth-scroll 중 요소 캡처로 5그룹 실패했다. 줄바꿈을 정규화하고 reduced-motion을 컨텍스트 시작부터 적용해 전체 페이지를 캡처한 세 번째 실행은23그룹 PASS다. 두 번째 실행의 영어 캡처 타임아웃1개도 보존했다. 기존 사이트 검사는 10-29 승인으로 삭제한 키보드 문구/광고 설명 추가와 새 개발자 연락처 링크를 옛 기준으로 실패 처리했다. 정확히 그 문구와 링크 계약만 보정해 41/28그룹 통과했다. 실패 보고·stdout/stderr·실행명령·시각·수정 전 검사기를 각각 고유 폴더에 보존했으며 통과 기록으로 덮어쓰지 않았다.

[작업 근거 폴더](../artifacts/qa/rights-notice-20261030/): `full-qa-command.json`, `rights-check-latest.json`, `site-check-commands-attempt4.json`, `preservation-and-results.json`, `site-publication.json`, `site-live-verification.json`. 기존17 metadata·10ZIP·로컬 외부참고 원본 SHA256은 보존했다. 문구 번역의 원어민/전문 법률 감수, 실제 Netflix/DRM·물리 OS·장시간 검사는 실행하지 않았다. Google 계정/스토어 콘솔은 변경하지 않았고 자동화/추가 AI왕복도 없다. OTT-81.

<a id="repository-public-policy-20261030"></a>
## 2026-10-30 저장소 공개 범위 변경

2026-10-30 사용자 최신 지시의 저장소 운영 기준은 [OTTSub](https://github.com/K2Bact/OTTSub) 공개, [ottsub-dev](https://github.com/K2Bact/ottsub-dev) 비공개·읽기 전용 보관이다. 코드와 과거 이력의 독립 경계를 유지하며 로컬 AI대화/외부참고/계정자료는 Git에서 제외한다. 실제 변경·익명 접근·비공개 차단 결과는 [검증 기록](../artifacts/security/repository-visibility-20261030/result.json)에 기록한다. OTT-80. 아래 비공개 전용 정책과 이전 보관 이름은 각 당시 기록이다.

이번 변경은 GitHub 공개 설정·이름·문서 정책이다. 공개 전 source/tree·비밀정보 검사와 공개 후 익명 API 접근, 개발 보관본 비공개 차단, 옛 commit/blob 격리와 원본/ZIP 보존을 대조한다. 제품 전체 QA를 새로 실행한 수치로 세지 않는다.

<a id="repository-isolation-complete-20261030"></a>
## 2026-10-30 독립 비공개 저장소와 옛 객체 격리 검증

2026-10-30 사용자가 저장소 이름변경·새비공개저장소 생성·비공개보관을 명시승인해 실행했다. 원래주소 OTTSub는새독립비공개저장소이고, 기존저장소는 OTTSub-private-history-20261030에서 비공개·읽기전용으로6커밋을보존한다. 새저장소에서옛커밋/참고blob404·340파일동일·17언어·179입력/ZIP10보존을확인했다. [실행/검증](../OttsubAiTalk.md#repository-isolation-complete-20261030)·OTT-79. 아래승인대기는당시기록이다.

GitHub의 이름 경로와 고정 repository ID를 각각 대조했다. 옛 Git commit/blob404, 정상 manifest blob200, revision API422의 No commit found, 보관 저장소의 원래6커밋과blob200을확인했다. 교체직후 최초200의원인은미확정이며리다이렉트차단진단원문을보존했다. 제품전체QA를다시실행한기록은아니다.

<a id="repository-cleanup-20261030"></a>
## 2026-10-30 저장소 정리 검사와 원격 객체 보존 경계

2026-10-30 저장소의 새 main1커밋·로컬자료2종 Git제외·340파일/17언어·비공개를 확인했다. 제품179입력/ZIP10보존. 옛SHA조회200이 남아 독립 저장소 격리안을 준비했으나 이름변경/새생성/보관은 자동승인 거절로 실행되지 않았다. [범위/현재판정](../OttsubAiTalk.md#repository-cleanup-20261030)·OTT-79.

이번 검사는 Git경계·manifest리소스·해시·공식Gitleaks의 원문/판정·복구bundle 및 GitHub 재조회다. 새 제품 전체QA가 아니다. raw Gitleaks는2건·exit1이며 알려진 공개시험키/무결성SHA로 분류한 근거를 보존했다. 새 clone에는 로컬 참고fixture가 없어 native acquisition QA 전체 재현을 보장하지 않는다.

<a id="codex-reporting-rules-result-20261029"></a>
## 2026-10-29 보고 정정·지침 반영 독립 확인

2026-10-29 Gemini의 보고 정정·지침 기록 회신을 검증했다. 기존 지침을 보존한 AGENTS.md의8개 예방 규칙과 백업/전후해시를 직접 확인했고,179개 QA입력·ZIP10개는 동일하다. [독립 판정](../OttsubAiTalk.md#codex-reporting-rules-result-20261029)·OTT-78. 새 제품 검사나 추가AI왕복은 없으며 아래 회신 대기는 당시 기록이다.

<a id="gemini-reporting-rules-request-20261029"></a>
## 2026-10-29 검수 보고 정정·지침 보완 요청 — 결과 대기

2026-10-29 사용자 지시로 Gemini에 프랑스어 검수 보고 정정과 실제 프로젝트 지침에 재발 방지 규칙 기록을 요청했다. RN적재·지정깨우기1회·실제읽음/수락을 확인했고 전달기는 종료했다. 지침 변경 근거 회신 대기이며 제품/테스트/ZIP 변경은 없다. [요청/단계](../OttsubAiTalk.md#gemini-reporting-rules-request-20261029)·OTT-78.

<a id="codex-french-peer-result-20261029"></a>
## 2026-10-29 프랑스어 검수 회신 재평가

Gemini는125/125·새결함없음을보고했다. 실제새French브라우저JSON8결과(계획8/오류0)는확인했지만검수폴더에는result.json뿐이고나머지stdout/stderr/종료코드/해시목록은없다. 따라서125건신규독립실행을인증하지않는다. 현재제품파일은60개(아이콘포함64)이며59주장과실제없는배지문구·따옴표공백설명을정정했다. 기존전체QA179입력과ZIP10개해시는그대로다. 이번Codex제품테스트/수정은없다. [항목별판정/증거](../OttsubAiTalk.md#codex-french-peer-result-20261029)·[판정JSON](../artifacts/qa/french-peer-reassessment-20261029/result.json).

<a id="gemini-french-review-request-20261029"></a>
## 2026-10-29 Gemini 프랑스어 독립 검수 요청 — 결과 기다림

사용자 지시로.70 프랑스어192문구와관련동작/레이아웃/검사타당성의독립검수를 요청했다. RN1건과공식지정채팅깨우기1회, 실제읽음/receiver수락을확인했다. 임시전달기는꺼졌고결과회신은아직없다. 이번송신을새검사통과로표시하지않는다. [요청/영수증](../OttsubAiTalk.md#gemini-french-review-request-20261029)·OTT-77.

<a id="french-ui-20261029"></a>
## 2026-10-29 프랑스어 메뉴 — .70 / 17개 언어

사용자 요청으로 **Français (FR), UI locale fr**을 추가했다. 현재 개발본은 **1.3.9-local-french-ui-20261029.70**이며 정식 version은1.3.9를 유지한다. 새ZIP은 만들지 않고 기존 배포ZIP10개를 보존했다. 메뉴 번역이며 Netflix에 없는 자막을 생성하거나 프랑스어 자막 지원을 새로 구현한 작업은 아니다.

- 프랑스어 **192키**와 `_locales/fr/messages.json` 추가. 이름47/75·짧은설명113/132 UTF-16 code units. 기존16개 사전/메타데이터는동일하다. 표준프랑스어 vous·sous-titres·segment·décalage 용어를 적용하고 시간/단축키 토큰은보존했다. 문장부호 앞 NBSP·곡선아포스트로피·말줄임표는공통fixFrenchTypography를 거쳤다.
- fr/fr-FR/fr_CA/fr-BE/fr-CH를 UI fr로정규화하며 Netflix자막의fr-FR/fr-CA identity/URL은분리한다. 시스템언어를첫줄에두고나머지는영어이름순으로정렬한다. French는Finnish와German 사이에온다. 제공자라벨은기존labelLocale 신뢰계약을그대로사용한다.
- Pinned/Shared Gate1·2·12·OTTSub 프로필과 **Gate10 프랑스어 조판** 통과. Gate10은정본과동일한파일을고정fixture에추가해공식audit에연결했고, 아포스트로피/공백/말줄임표 음성대조군도정식runtime에포함했다. 기존미지원프랑스어/고아locale fixture는미지원it로바꾸고기존폴백검사의미를유지했다.

**최종 전체 QA:** [2026-10-29T10-25-48-972Z-23392](../artifacts/qa/2026-10-29T10-25-48-972Z-23392/summary.json) **122/122 스위트·292.0초**, 입력179·실행중변경0·제외그룹0. 구문46/runtime31/legacy15/browser30. 패키지는6건중5PASS·기존ZIP동일성1SKIP이며이SKIP을실제실행성공으로세지않는다. 프랑스어전용브라우저 **8/8**에는텍스트62/title30/ARIA34 바인딩, 7상태×320/360/430px, 4가림버튼Range폭, RTL복귀, 명시적labelLocale, 키보드모달, 실제unpacked chrome.storage 저장/리로드, 배포라벨의개발보고서링크숨김이포함된다.

**초기 실패/보정:** [첫전체](../artifacts/qa/2026-10-29T10-17-18-468Z-5980/summary.json)는117/122·소스변경0으로보존했다. 프랑스어복구상태의긴배지때문에320px에서가로넘침이발생해프랑스어상태4개를짧게고치고7상태폭검사로보강했다. 다른4건은실제미번역이아닌프랑스어동형어Normal 허용1건, 기존1.3.8 ZIP/승인된동일백업을금지하던레거시목록3건이었다. 목록은1.3.8과정확한백업경로만추가하고백업bytes가원본과같은지도assert한다. archive/artifacts전체를검사에서제외하거나정상ZIP을삭제하지않았다. 보정후4개단독검사와최종전체를통과했다.

화면의4버튼은가용59px 안에서Aucun31.11px/Second.38.91px/Princip.36.69px/Les deux43.36px였다. [학습카드캡처](../artifacts/qa/french-ui-20261029/focused-browser-after/french-learning-card-320.png)는자동회귀용이며스토어스크린샷을새로제작한것은아니다. 앱광고/clock/seek/episode/다운로드기능·권한은변경하지않았다. 실제Netflix/DRM·원어민전수감수·물리AZERTY/Mac·스크린리더실발화·타OS·장시간은미실행이다. 외부AI/예약/상주/Git/업로드작업은없다.

[종합JSON](../artifacts/qa/french-ui-20261029/result.json)·[AI기록](../OttsubAiTalk.md#french-ui-20261029)·OTT-76을따른다.

<a id="codex-ad-test-10-reassessment-20261029"></a>
## 2026-10-29 Gemini 광고10회 검사의 결과·설계 독립 검토

원요청에 대응하는 RN회신 **01M639A9HQY7CHV9DBW08F83Q0**(reply_to **01M6364BD3TMNBB4QC19QMF89D**)을 수령했다. Gemini의 검사 원문은 [보존본](../archive/docs/reviews/2026-10-29-ad-10runs/gemnisaying-original.md)에 그대로 남겼다. **선정된16스위트×10회의 실행 성공은 수용하지만, 광고 모든 조합의 전수 인증과2,850개 케이스라는 해석은 수용하지 않는다.**

| 판정 항목 | 독립 확인 및 정정 |
|---|---|
| 실제 실행 | stdout160개와 round-summary10개 대조. 정식 브라우저 보고 계약으로60개 JSON, TAP 최종 집계/plan/번호로100개 로그를 재판정해160/160 PASS. 실제 실패/취소/SKIP/TODO 모순 없음.10회 소요480.138초 |
| 정확한 건수 | 회차당80개 브라우저 명시case+204개 runtime=284개, 누적 **2,840개 명시case + 개수 미보고 episode 통합10회**. episode를임의1case로세었던2,850은 정정 |
| 핵심 광고 검사 | gate17·recovery33은 실제 제품의 감지/가림/복구 및 MAIN/ISOLATED·hover/clock/다운로드 경계를 자극하고 assert한다. 단순 상수/재구현 검사로 일괄기각하지 않음 |
| 범위 과장 | observer15는 ZIP에서 제외하는별도진단기. status5는 광고를 만들지 않는응답fixture, compound10은 광고 상태 없이 언어/CC/OFF/지연body를 검사한다. 광고×CC/OFF 또는 광고×native탭 지연응답을직접합친검사로인용불가. 동일fixture10회는간헐성회귀증거이며10종새입력/실서비스증거가아님 |
| 집계기 빈틈 | 원본 artifact runner의 실제파서에 빈cases·0case·total모순·문자열passed·가짜episode·미완성TAP·SKIP TAP을 넣으면 **7/7 허위PASS**. 현재정식계약/엄격TAP재집계는모두통과를거부. 원본 allPassed는 productChanged/zipChanged/기대ZIP불일치도 반영하지 않음 |
| 보존 근거 | 원본59입력은 개수/불변boolean만저장해과거파일별해시전수독립인증불가. 이번검토의63제품파일·234원본증거파일·기존ZIP10개SHA는전후일치. 배포ZIP SHA는 `8ae291c7efe385ccb66ee37174fa6e04bae4da17b945fc54913b3b3bb4d22526` 유지 |

검사 자체가 실패를 잡는지 추가 검증했다. 정상 gate 브라우저 **17/17 PASS**. 자식 프로세스가 읽는adapter 소스의 adSignal만항상absent로바꾸자AD01/02가실패했고, gate의displaySuppressed만false로바꾸자기존11검사중9개가실패했다. 두임시변형모두검출됐으며제품파일은전혀쓰지않았다. 이는핵심guard의실패검출근거이지전체모듈mutation전수인증은아니다. 보조집계는처음Node의spec출력을TAP로가정해KeyError로중단됐고, 보존한동일로그의`ℹ`집계로정정했다. 해당시험을재실행하거나실패를숨기지않았다.

**수정한 결과:** 원본실행로그/집계기는증거로보존하고 [정정집계](../artifacts/qa/ad-audit-review-20261029/reanalysis.json)·[판정/근거](../artifacts/qa/ad-audit-review-20261029/result.json)·[실패검출시험](../artifacts/qa/ad-audit-review-20261029/oracle-checks.json)을 현재 해석의 기준으로 둔다. 과거artifact runner는공식검사기의대체로사용하지않는다. 정식scripts/run-qa.cjs와제품코드는변경하지않았다. 실제Netflix/DRM·실광고DOM/비공개API·구버전/다른OS/장시간은미실행이고, 새10회반복·외부AI송신/깨우기·예약/상주는없다. OTT-74는회신수령/선정묶음10회확인완료, OTT-75는이번검토완료다.

<a id="gemini-ad-test-10-request-20261029"></a>
## 2026-10-29 Gemini 광고 관련 전체10회 검사 요청 — 실행 결과 아님

RN `01M6364BD3TMNBB4QC19QMF89D` 수신함 적재1건. 검증된 고정OTTSub의ID/idle을확인했으나 계획검토전용깨우기는 테스트에사용할수없어 미실행했고 실제읽음/회신/검사결과는없다. 재시도·새전달기·프로그램테스트는실행하지않았다. 요청은 회차별전체광고검사·실패/시간초과/미실행구분·원본로그/해시보존이다. 기존Netflix/DRM실재생보류는유지한다. [원문/정확한단계](../OttsubAiTalk.md#gemini-ad-test-10-request-20261029)·OTT-74.

<a id="store-listing-139-ko-en-20261029"></a>
## 2026-10-29 한국어·영어 스토어 상세 설명 정정

사용자 요청대로 기존 언어 중 한국어와 영어만 선택했다. [한국어 전체 수정본](../store_assets/ko-kr/listing.txt)·[영어 전체 수정본](../store_assets/en-us/listing.txt)을 제품 세부정보의 설명란에 사용한다. 시작 안내에 manifest의 최소조건인 데스크톱 Chrome114 이상을 명시하고, 첫 문장에서 OTTSub 자체의 무료 이용과 별도 Netflix 구독을 구분했다. 영문의 모호한 no ads를 제거하고 두 언어의 광고 설명에 Netflix 광고를 차단/제거하는 기능이 아님을 명시했다. 사용자가 삭제했던 키보드 배열 안내가 설명문에도 남아 있어 두 언어에서 제거했다. 그 밖의 기능·16언어 목록·FAQ·공개 도움말 주소는 유지했다.

원본/수정본 diff와 문구를 대조했으며 manifest 최소버전·다른14개 언어·이름/짧은 설명·제품 코드·ZIP10개 해시 보존을 확인했다. 한국어 3,214자, 영어 5,485자다. 프로그램 동작 변경이 없어 제품 테스트 재실행이나 ZIP 재생성은 하지 않았다. 스토어 화면은 접속하지 않았으며 실제 등록정보 수정은 사용자가 한다. [검증 JSON](../artifacts/qa/store-listing-139-ko-en-20261029/result.json)·[AI 기록](../OttsubAiTalk.md#store-listing-139-ko-en-20261029)·OTT-73을 따른다.

<a id="release-139-20261029"></a>
## 2026-10-29 스토어 1.3.9 ZIP — 개발본 분리 및 실제 ZIP 검사

사용자의 ZIP 생성 지시로 기존 1.3.8을 보존하고 **1.3.9**를 준비했다. 개발 폴더는 **1.3.9-local-store-20261029.69**이며 스토어 manifest에는 version_name을 제거했다. 제품 코드와 16개 언어는 직전 .68 검수본 그대로다. 직전 전체 QA의 입력176개가 작업 시작 시 모두 일치함을 확인한 뒤 manifest 버전만 올렸다.

- [스토어 ZIP](../dist/ottsub-store-1.3.9.zip): **185,823 bytes·63개 런타임 파일·16개 locale**, SHA-256 `8ae291c7efe385ccb66ee37174fa6e04bae4da17b945fc54913b3b3bb4d22526`.
- 패키지 정식 검사 **6/6 PASS·SKIP 0**. ZIP 전 항목과 현재 정제된 소스의 바이트 일치, CRC, 경로/권한/manifest 참조 검증을 확인했다. 진단기·테스트·문서·보고서 파일·개발용 버전 표시는 배포 입력에서 제외했다.
- 실제 ZIP 추출본을 별도 Chromium **151.0.7922.34**에 로드한 검사 **37/37 PASS**. 16언어 저장/리로드·RTL/LTR·시스템 우선 정렬·320px·모달 포커스·홈페이지 클릭을 확인했다. 각 언어에서 시장조사 링크 숨김/href 미설정, 정식 버전 표시, 삭제한 키보드 안내 부재를 확인했다. 실제 sidePanel의 openPanelOnActionClick 등록도 확인했다.
- 기존 ZIP9개는 SHA-256이 모두 같으며 1.3.0~1.3.9 총10개를 보존한다. 1.3.8과 새 ZIP의 런타임 차이는 manifest 버전/Chrome114 선언, 안내문 삭제, sidePanel 오류 방어다. 검사기 보강은 ZIP 밖 개발 도구다.

이번에는 전체 QA를 반복하지 않았다. [직전 전체121/121](../artifacts/qa/2026-10-29T02-49-47-164Z-25716/summary.json)는 .68 실행 기록이며 그 검사 입력과 이번 버전 메타데이터·등록 지침 변경을 구분한다. 새 UI 언어가 없으므로 현지화 설명·스크린샷을 새로 제작했다고 표시하지 않는다. 실제 Netflix/DRM·물리 기기/구버전 브라우저·장시간 검증은 기존 보류 범위다. 사용자 Google 계정·콘솔·업로드·Git·다른 AI 송신·예약 작업은 실행하지 않았다.

[검사 JSON](../artifacts/qa/release-139-20261029/result.json)·[실제 ZIP 검사](../artifacts/qa/release-139-20261029/smoke.json)·[AI 기록](../OttsubAiTalk.md#release-139-20261029)·OTT-72를 따른다.

<a id="context-churn-20261029"></a>
## 2026-10-29 추가 안정성 검사 실행 — 멀티탭/패널 종료·kind/OFF 지연 응답

사용자의 “해봐” 지시로 [보정 검사계획](../artifacts/reason-network/review-runs/RN-LOCAL-REVIEW-71FA0276EF93A1A4/FINAL_PLAN.md)의 주요 두 후보를 실행했다. 기존 language/episode late body와 timeout/late query 검사를 먼저 대조하고 빠진 조합만 보강했다. **새 제품 결함은 관찰되지 않았고 제품 코드·manifest·개발버전.68은 변경하지 않았다.** 검사인프라2개를수정하고native검사1개를추가했다. 선택적episode보고표준화는결함근거가없어착수하지않았다.

[새 전체 QA](../artifacts/qa/2026-10-29T02-49-47-164Z-25716/summary.json) **121/121·421.5초**, 구문46/runtime31/legacy15/browser29, 입력176·제외그룹0·실행중변경0. browser29 raw JSON도독립대조했다. 패키지는6건중5PASS·구버전ZIP 동일성1SKIP이며새ZIP없이기존9개해시를보존했다.

| 검사 | 직접 실행 결과 | 범위/의미 |
|---|---|---|
| native 멀티탭 | 5/5 그룹 | 실제 현재popup·native tabs/query/onActivated/sendMessage와실제할당tabId. Netflix backend만명시적fixture로대체한임시확장 |
| old-tab reply | PASS | B상태반영후A지연응답7700ms강제전달해도잘못된UI0건, 안정화후이전탭신규poll0건 |
| 교차활성화 | 10/10 | native탭A/B를10회교차, 매번현재탭의1.1s/2.2s UI복원. 고정101/202 ID가아님 |
| pagehide/늦은응답 | PASS | 500ms poll·1500ms deadline·상태onActivated구독0, 종료후9900ms응답이UI를변경하지않음 |
| kind/body/OFF 조합 | 새4조합 PASS | 주/보조×stale-first/current-first, CC요청을normal로교체. superseded signal.abort=true·옛body parse0·잘못된DOM0·다른역할cue유지 |
| OFF/ON 의미 | PASS | 보조OFF동안정상현재응답의캐시는허용하되표시하지않고ON에서현재normal자막복원. 표시OFF를모든정상다운로드취소정책으로바꾸지않음 |
| owner 음성대조군 | CAUGHT | 산출물확장사본에서finish guard만제거하자UI7.7s오염을같은oracle이검출. 원본/시험module SHA차이확인 |
| cancellation 음성대조군 | CAUGHT | 임시페이지의fetcher post-body abort guard만제거하자stale parse를oracle이검출. 제품파일은보존 |

복합장애suite는기존5+역할/완료순서4+음성대조1로**10그룹**이다. native5와합친집중15에는기존5도포함되므로전부새제품검사15개라고표현하지않는다. native5중음성대조1과compound10중음성대조1의PASS는결함을심은사본이검사에잡혔다는뜻이다. [coverage map](../artifacts/qa/context-churn-20261029/coverage-map.json)·[종합 JSON](../artifacts/qa/context-churn-20261029/result.json)을따른다.

네트워크는로컬충족fixture/차단이고사용자Chrome프로필·실제Netflix/DRM/광고·물리입력/다른OS·장시간계측은없었다. native검사도브라우저탭안에연popup이므로실제toolbar/side-panel물리UX까지검증한것은아니다. 일반문서수명의watchdog나정상캐시동작을누수/오염으로오인하지않았다. 새상주/예약/자동재시도/외부AI왕복0건.

보존/파일: scripts/run-qa.cjs에새suite등록, tests/test_compound_failures_browser.cjs확장, tests/test_status_churn_browser.cjs추가. 기존175입력중173동일·검사인프라2변경·1추가로176. src/popup/_locales/icons/manifest 및ZIP9은동일. OTT-71완료와 [AI기록](../OttsubAiTalk.md#context-churn-20261029)을따른다. 전체QA원본로그는위정식결과폴더에있고최초집중로그도artifacts/qa/context-churn-20261029에보존했다.

<a id="gemini-5cycle-plan-result-20261029"></a>
## 2026-10-29 Gemini 추가 검사계획 내부5사이클 요청 — 계획만

사용자 지시로 최신.68/120전체QA·175입력 요약을 제공해 내부5사이클 후보발굴/기존근거대조/반례/계획갱신을 요청했다. RN요청1·고정OTTSub깨우기API1·실제읽음·회신1을 확인했다. [요청/회신/항목별판정](../OttsubAiTalk.md#gemini-5cycle-plan-result-20261029)·[실행manifest](../artifacts/reason-network/review-runs/RN-LOCAL-REVIEW-71FA0276EF93A1A4/manifest.json)을 따른다. finalized·cleanup=disabled_worker_not_running·추가왕복/재시도0이다.

C1~C5계획은 수령했지만 내부5단계별변경추적이부족하고116주장을반복해5차례정밀검토완료/독립실험5회를인증하지않는다. C1은이미있는언어변경/역순body검사를제외하고트랙종류/OFF조합의빈틈만조건부후보, C2는native두탭/늦은응답/패널종료조합으로보정했다. 이미보낸메시지까지0으로만드는기준·무조건heap기준선·sidepanel21이라는낡은수치도정정했다. C3(falseChrome116/이미검사한함수누락)는기각, C4(episode보고표준화)는선택정비이며현재결함이아니다. C5의무조건전체rollback/실행허가불필요주장은범위대로보정했다.

[최종계획](../artifacts/reason-network/review-runs/RN-LOCAL-REVIEW-71FA0276EF93A1A4/FINAL_PLAN.md): 먼저기존coverage대조,1.native두탭상태소유권,2.heldbody중kind/OFF조합,3.선택episode보고정리. 이번에는제품코드/새검사를실행·수정하지않았고175입력/ZIP9해시를보존했다. OTT-70의완료는요청/수신/계획재평가완료이며검사실행완료가아니다.

<a id="qa-panel-fixes-20261029"></a>
## 2026-10-29 보정 계획 구현 — P2 검사기·P3 sidePanel 방어, .68

사용자의 “수정한 계획대로 실행” 지시로 [보정 계획](../OttsubAiTalk.md#gemini-fix-plan-reassessment-20261029)을 구현했다. 현재 **1.3.8-local-qa-panel-guard-20261029.68**이다. scripts/run-qa.cjs·src/side-panel.js·manifest.json을 수정하고 회귀 검사1개를 정식 QA에 포함했다. 실제 Netflix 처리·UI 언어16×192키·권한·기존ZIP9개는 유지했다.

| 검사 | 직접 실행 결과 | 경계 |
|---|---|---|
| 수정 전 음성 대조군 | 2건 모두 의도된 실패 | 실제 기존 코드에서 exit0 실패보고/미지원API 결함 검출. [수정 전 로그](../artifacts/qa/qa-panel-fixes-20261029/before-negative-controls.log) |
| 새 회귀 검사 | 42/42 PASS | 정상/실패/누락·잘못된 타입/개수·plannedTotal·예외·timeout/spawn/nonzero·worker 누락/동기throw/reject. [로그](../artifacts/qa/qa-panel-fixes-20261029/focused-runtime.log) |
| 과거 정상 보고 재생 | 28/28 PASS | 실제 run/summarizeOutput에 기존 stdout 재생. 총개수 없는 episode는 checks=null 유지. [재생 결과](../artifacts/qa/qa-panel-fixes-20261029/historical-replay.json) |
| 새 전체 로컬 QA | 120/120 스위트 PASS·267.9초 | 구문46/runtime31/legacy15/browser28, 입력175·실행 중 변경0·제외그룹0. [정식 결과](../artifacts/qa/2026-10-29T02-06-14-997Z-33396/summary.json) |
| native unpacked panel | 22/22 PASS | 새 전체 QA의 실제 Chromium 확장. mock Netflix 입력과 실제 확장 API를 구분 |
| worker 강제 재시작 | stopped→running·설정/언어/싱크 복원 PASS | 별도 임시 확장에서 fi·2300ms 저장/표시 복원. [native 결과](../artifacts/qa/qa-panel-fixes-20261029/native-worker.json). 자연idle/브라우저전체재시작이 아님 |
| 패키지 경계 | 6건 실행 중 5PASS·1SKIP | 기존1.3.8 ZIP은 이전 소스라 동일성1건을 의도적으로 SKIP. 새ZIP을 요청하지 않아 보존했다. skip을6/6 실행성공으로 적지 않음 |

**P2:** 브라우저 JSON을 종류별로 검증하고 reportValid/reportPassed를 exitCode와 함께 사용한다. 오류/실패case·success 누락/잘못된 타입·깨진/빈 보고·count모순·부분실행은 FAIL이다. 실제 episode 계약만 이름/결과 근거로 허용하며 임의 count를 만들지 않는다. TIMEOUT/ERROR/nonzero 실패와 기존 정상 보고를 보존한다. 브라우저 이외는 기존 종료 계약과 이미 해석 가능한 TAP 실패 수만 사용한다. 새 전체 raw28 JSON도 독립 대조해 실패 모순0을 확인했다.

**P3:** API/함수 존재 확인과 호출을 포함하는 try/await/catch로 미지원·동기throw·비동기reject를 처리한다. 정상 시작당 등록1회, 실패당 유한 진단1회, 자동재시도0회다. 상태 캐시/영구timer·새탭/창 폴백·새권한을 추가하지 않았다. minimum_chrome_version을114로 명시했다. 근거는 [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) 및 [114 발표의 setPanelBehavior](https://developer.chrome.com/blog/extension-side-panel-launch)다. 앱의 Chrome API 사용 범위(기존 storage/runtime/tabs·MAIN/ISOLATED·sidePanel)와 호출 시 필요한 기능 검토를 바탕으로 선언한 API기준이며 실제Chrome114/구형Edge 전수 호환성 보증은 아니다. 직접 실행은 현재 Chromium151.0.7922.34다.

보존: 이전174입력 중171개 동일·3개 수정, 회귀1개 추가로175개. 기존ZIP9개 SHA256 동일. 삭제했던 키보드 안내는 복구하지 않았다. [종합 JSON](../artifacts/qa/qa-panel-fixes-20261029/result.json)·[AI 기록](../OttsubAiTalk.md#qa-panel-fixes-20261029)·상태표OTT-67/68을 따른다. rollback 원본은 artifacts/qa/qa-panel-fixes-20261029/before/에 있다. 실제Netflix/DRM/광고·장시간/실기/타OS/실발화는 미실행이며 추가AI/RN·깨우기/예약/상주·업로드/Git공유도 하지 않았다.

<a id="gemini-fix-plan-reassessment-20261029"></a>
## 2026-10-29 Gemini P2/P3 계획 회신 검토 — 코드·검사 미실행

회신01M62N35J3SQ3P2FCDT6XMCJGF의 발신/수신/reply_to를 기존 요청과 대조했다. [Gemini 원문](../OttsubAiTalk.md#gemini-fix-plan-sc01-sc02-20261029)과 현재 소스·이전 전체QA의 raw browser28개를 읽어 [항목별 보정 계획](../OttsubAiTalk.md#gemini-fix-plan-reassessment-20261029)을 기록했다. 구현/새 테스트 실행은 하지 않았다.

기존보고는25개 boolean+total·2개 numeric+total·1개 episode boolean/no-total이다. Gemini의 전수total 주장은 틀렸고 원안의 total>0 판정은 정상episode1개를 거부한다. 반대로 passed 누락/잘못된 타입/개수 모순은 여전히 허위통과할 수 있어 schema별 명시적 성공/실패 판정이 필요하다. ad-observer는 현재 assert와 exitCode1이 있어 지목한 실제 실패누락 예는 맞지 않는다.

Chrome116 필수라는 근거도 기각했다. [공식114 발표](https://developer.chrome.com/blog/extension-side-panel-launch)에 setPanelBehavior 예가 있고116 표시는 open()에 해당한다.114는 API기준 후보이며 전체 구버전/Edge 실측 통과가 아니다. P3 함수존재검사+.catch는 호출순간 동기throw까지 처리하지 못하므로 try/await/catch 계획으로 보정했다. 별도탭/창 폴백은 범위에서 제외했다.

[검토 JSON](../artifacts/qa/gemini-fix-plan-review-20261029/result.json)·[기존28계약](../artifacts/qa/gemini-fix-plan-review-20261029/existing-contracts.json)·[회신 증거](../artifacts/qa/gemini-fix-plan-review-20261029/received-reply.json). 최신sidebar는22이며 syntax:manifest.json이라는 job은 없다. 과거probe의 결함재현 성공을 수정완료 합격으로 재사용하지 않는다. 이번 검토 전후 제품174입력/ZIP9은 동일. 상태표OTT-67/68은 회신대기→미구현 할 일2행을 백업 후 재열람했다. 추가RN송신/깨우기/자동화0건.

<a id="shortcut-note-removal-20261028"></a>
## 2026-10-28 단축키 안내 문구 삭제·P2/P3 계획 요청

사용자가 스크린샷으로 지정한 미국식 키보드 배열/화면 슬라이더 설명을 공통 popup DOM에서 삭제해16개 언어 화면에 반영했다. 실제 키 처리·단축키 항목·사전192키·manifest버전1.3.8/.67은 유지했다. 삭제된 요소를 찾던 기존 browser검사는16개 언어에서 안내 요소0개·단축키 항목 유지·주언어 설명 번역 일치·320px 넘침 없음으로 바꿨다.

[관련 브라우저 검사](../artifacts/qa/shortcut-note-removal-20261028/language-browser.log) **28/28**, [Pinned](../artifacts/qa/shortcut-note-removal-20261028/l10n-pinned.json)/[Shared](../artifacts/qa/shortcut-note-removal-20261028/l10n-shared.json) 다국어 게이트 통과. 변경은 popup/popup.html·기존 browser검사2입력뿐이고 나머지172입력 및 기존ZIP9개 SHA256 동일. 아래119/119는 문구 삭제 전 전체 실행이며 이번 변경 후 새 전체 실행이라고 주장하지 않는다. 실서비스/실기/장시간 미실행.

P2 SC-01(OTT-67)·P3 SC-02(OTT-68)는 구현하지 않고 사용자 지시대로 Gemini에게 해결 계획을 요청했다. [AI 요청](../OttsubAiTalk.md#gemini-fix-plan-request-20261028-sc01-sc02)·[전달 영수증](../artifacts/qa/shortcut-note-removal-20261028/delivery.json)을 따른다. RN message 01M61E2KMFNBDPMK5C1VTPZC8P를 기존 수신함에1회 저장했으며 pull연결의 읽음/회신과 저장은 구분한다. 새 전달기/Sidecar/예약/자동재시도는 시작하지 않았다. 상태표는 문구삭제 OTT-69 완료·두 계획 기다림3행을 백업 후 갱신·재열람했다.

<a id="stability-compatibility-20261028"></a>
## 2026-10-28 수정 계획에 따른 안정성·호환성 검토 — .67 유지

사용자의 진행 지시에 따라 [지연 회신 재평가 후 최종 계획](../artifacts/reason-network/review-runs/RN-LOCAL-REVIEW-FE650AAF5670EE1E/FINAL_PLAN_AFTER_LATE_REPLY.md)을 실행했다. 검사 도구를 먼저 읽고 7개 영역의 코드·기존 증거를 대조한 뒤, 필요한 유한 오프라인 검사를 수행했다. **제품 코드·정식 테스트·ZIP은 수정하지 않았다.** 새 AI 토론·예약·상주·자동 재시도도 만들지 않았다.

[새 전체 QA](../artifacts/qa/2026-10-28T13-42-36-403Z-34396/summary.json)는 **119/119·260.2초**다. 구문46·런타임30·레거시15·브라우저28 스위트이며 제외 그룹이 없다. package 내부 **6/6·skip0**, 입력174개가 실행 전·후 및 이전 .67 QA와 모두 같다. [독립 원본 로그 대조](../artifacts/qa/stability-compatibility-20261028/independent-log-check.json)에서도 실제 browser28 보고와 종료코드의 실패 모순은 없고 Node runtime29 보고의 실패/skip은0이다. legacy15의 내부 결과를 모두 구조화 검증했다는 뜻은 아니다.

| 영역 | 확인한 결과 | 근거와 한계 |
|---|---|---|
| 검사 신뢰성 | P2 SC-01 재현 | 실제 run/summarizeOutput 함수에 실패 보고+exit0를 주면 PASS. 이번 실제28 보고는 모두 성공과 일치 |
| 자원·수명주기 | 단기 반복 기준 통과 | renderer300회 후 전역 listener·observer·overlay 기준선 복귀, 강제GC heap +127,444 bytes(<3MiB). settings-binding500회·상태연결400회 종료 후 콜백 차단 |
| 장애 내성 | 취소·늦은응답·손상입력 검사 통과 | body/backoff 취소와 timer정리, 회차 교체·서로 다른 탭의 늦은 응답. 후보3개×각2회·각6초, 상위 recovery32범위·범위당3회·10초cooldown을 구분 |
| 설정·상태 | 설정 검사와 강제 worker 재시작 통과 | 손상·읽기실패·역순·삭제/갱신 대조. 별도 실제 Chromium 확장에서 CDP stopped→running 후 저장값 동일·fi 메뉴 복원. 자연 idle이나 전체 브라우저 재시작과 다름 |
| Chrome·Edge | 실제 설치 엔진의 화면12/12 | Chrome156.0.8078.48·Edge156.0.4314.42, fi/th/he×DPR1.25/2×320 CSS px. 실제 popup 소스+mock 확장 API. native API는 별도 Chromium151.0.7922.34에서 확인. SC-02 방어 후보 |
| 성능 | 기존 단기 검사 통과 | 캐시·resize/DPR·단기heap. 문서 수명 watchdog와 패널 polling이 존재한다는 사실만으로 누수 판정하지 않음. 장시간 CPU/heap 미측정 |
| 보안·격리 | 기존 경계 검사와 추가 입력 검사 통과 | sender/action/schema·HTTPS/hostname/port·redirect·안전 DOM·5MiB입력 제한·최소 권한·배포 제외 대조. DOM bridge는 인증 채널이 아님 |

### 미수정 지적과 재현 기준

**SC-01 / P2 / OTT-67 — 검사기 실패 보고 판정.** `scripts/run-qa.cjs:101`은 exit0만으로 상태를 PASS로 만들고 `passed:false`, errors, failed cases와 결합하지 않는다. [추가 probe](../artifacts/qa/stability-compatibility-20261028/focused-probes.json)는 실제 두 함수를 VM에서 읽어 fake child에 양성/음성 출력을 넣었다. 실패JSON+exit0와 비정상JSON+exit0가 PASS임을 재현했다. 향후 테스트가 종료코드를 빠뜨리면 실패를 놓칠 수 있다. 구조화 성공 보고를 요구하고 명시적 실패·누락/깨짐·empty report를 실패로 처리하는 보완이 필요하다. timeout/spawn오류/nonzero exit가 실패로 처리되는 대조군은 정상이다. 이번119개가 허위 통과였다고 확대하지 않는다.

**SC-02 / P3 / OTT-68 — API 미지원·등록 거부 방어.** `src/side-panel.js:2`는 API 존재 확인·Promise 거부 처리가 없고 manifest에 minimum_chrome_version이 없다. VM의 missing API에서 TypeError, 주입한 Promise 거부에서 처리되지 않은 rejection을 관측했다. [Chrome 공식 API 문서](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)는 sidePanel을 Chrome114+ MV3+로 명시하고 등록 Promise 거부 처리 예를 제공한다. 모든 사용 API의 최소 기준을 대조한 뒤 지원 범위·유한 실패 안내를 정하는 후속 후보다. 현재 native Chromium 등록·강제 재시작은 정상이며 구버전 실제 설치 실패나 현 Chrome/Edge native API 장애를 관측한 것은 아니다. 자동 반복 복구·Firefox 이식은 추가하지 않는다.

[추가 진단11건](../artifacts/qa/stability-compatibility-20261028/focused-probes.json)은 미수정 지적 재현 성공도 포함한다. 이11을 제품11기능 무결함이나 수정 완료로 집계하지 않는다. MAIN bridge의 중복 설치1 listener, 잘못된 입력10개 차단, 가상1초1000요청→20응답과9video 모호성 거부를 확인했다.

[Chrome·Edge/worker 추가 결과](../artifacts/qa/stability-compatibility-20261028/browser-probes.json)는 별도12/12+worker 강제재시작 결과다. 최초 추가 probe는 이미 펼친 카드를 무조건 클릭해 닫은 조건 오류와 worker 객체 교체만 기다린 관측 오류가 있었다. [첫 결과](../artifacts/qa/stability-compatibility-20261028/browser-probes-first.json)·[첫 스크립트](../artifacts/qa/stability-compatibility-20261028/browser-probes-first.cjs)를 보존하고 **산출물 검사 코드만** 바로잡아 재실행했다. 전체119 QA나 제품을 바꾼 재시도가 아니다. worker 저장 비교에는 진단용 임의키도 포함하며 실제 offset UI 전수 복원을 주장하지 않는다.

### 경계·보존·기록

실제 Netflix/DRM·광고, 자연 worker idle, 전체 브라우저 재시작, 현재 설치 Chrome/Edge native toolbar/실제 등록 경로, 물리 배율/4K·타OS·실발화·장시간 계측은 미실행이다. 기존 실기 보류를 유지한다. 기본 sandbox Git 조회 오류는 같은 경로를 읽기 전용 권한으로 재확인해 worktree 정상임을 확인했고 저장소 설정을 바꾸지 않았다.

[종합 JSON](../artifacts/qa/stability-compatibility-20261028/result.json)에 영역별 관찰/추론/미확인·재현/합격기준·174입력/9ZIP 보존을 기록했다. 이번 검토는 OTT-66 완료, 미수정 지적은 OTT-67/68 할 일이며 상태 정본3행을 백업 후 갱신·재열람했다. [AI 기록](../OttsubAiTalk.md#stability-compatibility-20261028)을 따른다.

<a id="homepage-link-20261022"></a>
## 2026-10-22 배포본 홈페이지 연결 — .67

수정 전 .66 ZIP에는 homepage_url과 공개 홈페이지 링크가 모두 없었다. **1.3.8-local-homepage-20261022.67**의 manifest와 설정 화면 하단에 https://k2bact.github.io/ottsub-site/ 를 추가했다. 외부 링크는 target=_blank·rel=noopener noreferrer·LTR 주소 표시·키보드 포커스를 사용한다. 권한·사전·Netflix 처리 로직은 그대로다.

[전체 QA **119/119·314.6초·입력174개**, 실제 ZIP 확장 **37/37**, 패키지6/6(skip0)](../artifacts/qa/2026-10-21T16-57-47-415Z-11408/summary.json) 통과. [실제 ZIP 검사](../artifacts/qa/homepage-link-20261022/smoke.json)는 16언어·320px·포커스·기존 메뉴·저장/리로드와 홈페이지 새 탭 열기를 확인한다. 클릭 대상 응답은 네트워크를 차단한 오프라인 스텁이며, [공개 HTTPS 확인](../artifacts/qa/homepage-link-20261022/public-homepage.json)에서 별도로 HTTP200·OTTSub 본문을 확인했다.

[검증](../artifacts/qa/homepage-link-20261022/verification.json): ZIP **185,601 bytes·63파일**, SHA-256 4e2b68ec97218c922dc7753e23a580ecc3cbfd4dbb0e3a565e9d2809a129bb2f. ZIP/현재 sanitized 입력/추출본 전 파일이 동일하며 .66 대비 ZIP 변경은 manifest.json·popup HTML/CSS 3파일뿐이다. 구버전8 ZIP과 링크 추가 전 .66 ZIP을 보존했다. [핀란드어](../store_assets/fi/README.md)·[태국어](../store_assets/th/README.md) JPEG6장을 새 ZIP으로 촬영하고 전부 열어 확인했다. metadata/listing은 변경하지 않았다. 캡처 프레임 높이를 조정해 학습 화면 하단 링크가 잘리지 않게 했다.

최초 전체 실행은 기본 sandbox의 실제 Chromium 시작 제한과 백업 ZIP의 금지 확장자 검사에서 실패했다. 원본 로그를 보존하고 보관본은 해시를 유지한 .zip.bak로 옮겼다. 최초 실행을 중단한 뒤 별도 오프라인 프로필에서 전체를 다시 통과했다. 테스트 조건·권한·제한 시간을 완화하지 않았다.

캡처 입력의 popup HTML만 변경한 [변형 검사](../artifacts/qa/homepage-link-20261022/capture-mutation.json)는 실제 ZIP과 달라진 파일 해시를 브라우저 실행 전에 차단했다(CAUGHT). 양성 캡처6장과 이 음성 대조군을 구분한다.

실제 Netflix/DRM·다른 OS/물리 기기·실발화·원어민 전수 검증은 새로 하지 않았다. 스토어 업로드/Google 계정 접근·Git 공유·홈페이지 재게시를 하지 않았다. [AI 기록](../OttsubAiTalk.md#homepage-link-20261022)·공통 표 OTT-65를 따른다.


<a id="release-138-20261022"></a>
## 2026-10-22 배포 1.3.8·핀란드어/태국어/히브리어 자료

대상 **1.3.8-local-store-20261022.66 / 16언어×192키**. [새 전체 QA](../artifacts/qa/2026-10-21T16-24-38-457Z-5828/summary.json) **119/119·347.7초·입력174개**, 생략 그룹/실행 중 변경 없음. 패키지 unittest는 **6/6·skip0**이며 [실제 ZIP 확장](../artifacts/releases/1.3.8/smoke.json) **36/36**다. 16언어 저장·리로드·시스템 우선 정렬·RTL/LTR·320px·모달 키보드 포커스·러시아어 접근성34바인딩과 배포본의 개발 보고서 링크 숨김을 확인했다. 최초 smoke는 모든 언어에서 해외 후원 링크를 가정해 한국어 Ctee에서 실패했다. 기존 언어별 링크 동작에 맞춰 검사만 정정했고 원본 실패를 attempt-1/smoke.json에 보존했다.

[최종 검증](../artifacts/releases/1.3.8/verification.json)의 ZIP **185,472 bytes·63파일**은 현재 sanitized 입력과 추출본 전 파일 바이트가 같다. 기존8 ZIP은 SHA-256 동일하다. .65 대비 제품 manifest의 버전값만 바꿨고 sourceHash 변화는 manifest·STORE_GUIDE·과거1.3.7 ZIP 보존을 허용한 테스트3개다. 새 권한·Netflix 요청/profile·트랙 identity·clock/ad/seek/episode guard 변경은 없다. 진단·홈페이지·시장 보고서·이미지·version_name은 ZIP 밖이다.

핀란드어·태국어·히브리어의 metadata.txt는 ZIP 사전과 같다. 이름/짧은 설명은 각각 **fi59/75·126/132, th45/75·93/132 UTF-16 code units**이며 he 측정은 최종 JSON을 따른다. listing.txt와 새 ZIP 실제 UI로 만든 **1280×800 RGB JPEG9장**을 모두 확인했다. 음수 싱크·학습 카드 펼침·가림·호버·잘림·예시 하단 문구와 ZIP/runtime/image 해시를 대조했다. 이미지는 실제 Netflix 영상 캡처가 아니다. [등록 지침](../store_assets/STORE_GUIDE.md)·[fi](../store_assets/fi/README.md)·[th](../store_assets/th/README.md)·[he](../store_assets/he/README.md)를 따른다.

고정/공유 l10n 게이트를 통과했고 기존 설명문의16언어 목록 전환을 반영한 [등록 설명/홈페이지 도구](../artifacts/releases/1.3.8/listing-check/verification.json) **41/41**도 통과했다. 새 게시/색인/AI 추천 성과의 증거로 집계하지 않는다. 실제 Netflix/DRM·원어민 전수·실발화·다른 OS 실기는 미실행이다. Google 계정/개발자 콘솔·실제 업로드·앱 Git 공유·사이트 게시를 하지 않았다.

<a id="site-spanish-20261022"></a>
## 2026-10-22 스페인어 홈페이지·세 언어 탐색

[기존 홈페이지 검사](../artifacts/qa/site-spanish-20261022/base-check/verification.json) **41/41**, [추가 브라우저 검사](../artifacts/qa/site-spanish-20261022/improvement-verification.json) **28/28** 통과. 각 페이지의 본문·FAQ11개·개인정보 고지·메타·구조화 데이터·고정 UTM, 세 언어 사이 6방향 이동, 320/360/430/768/1280px 문서 넘침을 JS 비활성 Chromium에서 확인했다. es-320.png·es-faq-320.png를 직접 보았으며 스페인어 예시 대사도 언어 태그 es로 제공한다.

[실제 게시 확인](../artifacts/qa/site-spanish-20261022/live-verification.json): Pages built·commit af23ec10020d6ce6a1b0da2ae349b03ca24b0819, 스페인어/한영 HTML·CSS·사이트맵 **5파일 HTTP200·검토본 바이트 일치**. 새 스페인어 HTML 외에 기존 한영 HTML·CSS·사이트맵만 갱신했고 아이콘·다른 공개 파일을 보존했다. [결과](../artifacts/qa/site-spanish-20261022/result.json)의 앱 입력174개·ZIP8개는 같으며 앱 전체 QA를 새로 실행한 결과가 아니다.

원어민 스페인어 감수·실제 AI 인용/검색 색인·유입 효과는 미실행/미측정이다. Google 계정/콘솔·새 ZIP·앱 저장소 업로드·실제 Netflix 검증은 수행하지 않았다. 앱은 .65 그대로다. [AI 기록](../OttsubAiTalk.md#site-spanish-20261022)·상태표 OTT-63을 따른다.

<a id="geo-improvements-20261022"></a>
## 2026-10-22 GEO FAQ·캠페인 링크·주간 측정

[기존 홈페이지 검사](../artifacts/qa/geo-improvements-20261022/final-base-check-2/verification.json) **35/35**, [추가 브라우저 검사](../artifacts/qa/geo-improvements-20261022/improvement-verification.json) **18/18**, [주간 계산·CSV 검사](../artifacts/qa/geo-improvements-20261022/measurement-tests.log) **12/12**다. 한영 11개 FAQ·0.3초 부호·0.1초 단계·오차 증가 한계, JS 비활성 상태의 설명·메타·개인정보 고지, 320/360/430/768/1280px, 6개 스토어 링크의 고정 UTM과 canonical/schema의 깨끗한 URL을 확인했다. 미측정·누락·0분모·설치자/이벤트 구분·기간/조건 불일치·명시적 테스트 분리·중복/겹침 입력·HTML 주입을 검사했다. ko-faq-320.png와 weekly-synthetic-1280.png를 직접 보았다. 주간 표의 합성 숫자는 실제 실적이 아니다.

[실제 게시 확인](../artifacts/qa/geo-improvements-20261022/live-verification.json): Pages built·게시 commit fafe443f1f85812097371ea101caa66a97b43fa9, 한국어/영어 **HTTP200·검토본과 바이트 일치**. 기존 공개 저장소의 HTML2개만 갱신하고 다른 파일·설정을 보존했다. 직접 localhost 미리보기 readiness는 제한된 소켓/시간 초과로 확인되지 않았으며 오프라인 Chromium과 실제 공개 HTTPS 증거를 구분한다.

최초 기존 검사에서 .58 당시 해시를 .65와 비교해 실패했다. 원본 실패는 base-check/verification.json에 보존하고 최신 통과 전체 QA 입력을 기준으로 바로잡아 검사를 다시 통과했다. 제품·assertion 기대값·기능을 맞추려고 바꾼 것이 아니다. [보존/결과](../artifacts/qa/geo-improvements-20261022/result.json)의 기존 **174개 입력·ZIP8개**는 같다. 제품 전체 QA는 새로 돌리지 않았다.

실제 통계 원본·AI 답변/인용·검색 색인·성과는 미측정이다. 계정/Google 콘솔·새 분석 SDK·자동 AI/API·예약 모니터링·블로그·새 ZIP은 실행하지 않았다. 로컬 [주간 비교 도구](../store_assets/geo/README.md)와 [AI 판정](../OttsubAiTalk.md#geo-improvements-20261022)을 따른다.

<a id="finnish-ui-20261022"></a>
## 2026-10-22 핀란드어 메뉴·개발본 보고서 링크

대상 **1.3.7-local-finnish-ui-20261022.65**. [새 전체 일괄 QA](../artifacts/qa/2026-10-21T15-33-48-412Z-18136/summary.json) **119/119 스위트·336.5초·입력 174개**이며 생략 그룹·실행 중 입력 변경은 없다. 그룹별 값과 sourceHashes는 summary, [변경·보존 확인](../artifacts/qa/finnish-ui-20261022/verification.json)을 따른다. 패키지 unittest 내부의 구버전 ZIP/현재 소스 동일성 1 SKIP은 별도다.

핀란드어 사전 **192키**, UI/메타데이터 **16언어**의 pinned/shared Gate 1·2·12와 OTTSub 프로필을 통과했다. fi/fi-FI/fi_FI/fi-SE UI 감지와 명시적 선택·지역별 다운로드 identity 분리를 확인했다. 원래 15사전/메타데이터·기존 ZIP8개·시장조사 원본 HTML은 보존했다. extName **59/75**, extDescription **126/132 UTF-16 code units**다.

새 정식 browser **7/7**는 핀란드어 상태·시스템 우선 정렬, RTL→LTR, 320/360/430px·4개 가림 버튼 Range 폭, 제공자 locale 가드, 실제 unpacked 저장/리로드, 개발 링크와 보고서 filter/계산의 MV3 CSP 실행, 배포 라벨에서 링크 숨김을 확인한다. [320px 캡처](../artifacts/qa/2026-10-21T15-33-48-412Z-18136/finnish-learning-expanded-320.png)와 전체 실행의 development-report.png를 보존했다. 첫 제한된 실행은 full Chromium 시작 권한에서 막혔고 별도 로컬 QA 실행으로 통과했다.

보고서는 tools/dev-research의 별도 extension page이며 inline JS 대신 report.js를 읽는다. CSP·권한·Netflix request/profile·clock/ad/seek/episode guard는 변경하지 않았다. store 입력 allowlist에서 tools와 보고서는 제외되고 version_name을 제거하면 링크가 표시되지 않는다. 새 ZIP 생성·실서비스/DRM 재생·원어민 감수·OS 시스템 언어 변경·실발화·타 OS 물리 검증은 하지 않았다. [AI 판정](../OttsubAiTalk.md#finnish-ui-20261022)을 따른다.

<a id="market-research-20261021"></a>
## 2026-10-21 자막 확장 시장 조사 보고서 확인

[보고서](../artifacts/research/ott-subtitle-market-20261021/OTTSub_자막확장_시장조사.html)는 공식 자료의 가격·기능·지원 답변을 정리한 연구 산출물이다. [로컬 검사 결과](../artifacts/qa/market-research-20261021/result.json)의 **21/21**은 보고서의 검색·모델 필터·출처 앵커·계산 입력 경계·인쇄 복원·375/768/1440px 문서 넘침 검사다. overview/comparison/mobile/print 이미지도 직접 확인했다. 첫 Chromium 실행은 sandbox 기본 캐시 경로로 바이너리를 못 찾아 실패했고, 이미 설치된 사용자 캐시 경로를 지정한 뒤 통과했다. 실패 기록도 같은 QA 폴더에 보존했다.

기존 전체 QA summary의 입력 **170개 SHA-256**이 현재와 같고 기존 **ZIP 8개**를 보존했다. 제품 전체 QA를 새로 실행한 결과로 집계하지 않는다. 새 결제·AI·확장 설치·Netflix 실재생 시험은 없으며 경쟁사의 광고 수정은 개발자 공개 이력 수준이다. 상태는 공통 표 OTT-59, 판단은 [AI 기록](../OttsubAiTalk.md#market-research-20261021)을 따른다.

<a id="transition-review-20261021"></a>
## 2026-10-21 추가 검수 — hover 옵션 전환·시간 초과 진단

대상은 **1.3.7-local-transition-review-20261021.64**다. [새 전체 일괄 QA](../artifacts/qa/2026-10-21T11-47-24-853Z-19632/summary.json)는 **117/117 스위트·281.2초·입력 170개**이며 생략 그룹과 실행 중 입력 변경이 없다. [수정·해시 검증](../artifacts/qa/transition-review-20261021/verification.json)을 따른다. 이전 .63의 일괄 114/116과 단독 재실행 결과는 아래 이력에 보존하며 이번 소스의 증거로 대체하지 않는다.

**제품 수정 1건 — hover 일시정지 OFF 전환.** hover로 이미 멈춘 상태에서 기능을 끄면 소유 상태가 남아 영상이 계속 멈췄고, 진입 debounce가 대기 중이면 OFF 이후 뒤늦게 pause될 수 있었다. 실제 content harness의 [수정 전 2실패/3검사](../artifacts/qa/transition-review-20261021/hover-before.log)와 실제 디코딩 HTMLVideoElement의 [수정 전 재현](../artifacts/qa/transition-review-20261021/hover-browser-before.log)을 보존했다. 저장 설정 변경 시 대기 타이머를 취소하고 소유 상태를 해제하며, 현재 화면에 표시 가능한 동일 영상에서 확장이 직접 소유한 일시정지만 재개한다. 이미 큐에 있던 callback도 OFF 여부를 재확인한다.

**직접 확인:** 새 정식 runtime **6/6**은 소유 pause 해제·진입 대기 취소·수동 pause 보존·회차를 떠난 뒤 재생 금지·늦은 callback 차단·숨긴 페이지 재생 금지를 검증한다. 실제 unpacked 확장과 로컬 생성 WebM의 hover suite **10/10**에서는 실제 play/pause·pointer hit testing·광고/복구 회귀를 실행했다. 기존 재생/광고/탐색/회차 guard와 request/profile·원본 자막 선택은 바꾸지 않았다.

**이전 시간 초과의 경계:** 기존 두 브라우저 suite에 launch·case·cleanup별 wall time과 가용 메모리 로그를 추가했다. assertion·45초 제한과 검사 내용을 유지했다. 이번 전체 실행에서 광고 복구 **33/33**, 종료까지 **22.4초**([단계 로그](../artifacts/qa/2026-10-21T11-47-24-853Z-19632/ad-recovery-phases-10568.ndjson)), 기존 설정 **12/12**, 종료까지 **11.4초**([단계 로그](../artifacts/qa/2026-10-21T11-47-24-853Z-19632/settings-sync-1792583514444-24796/phases.ndjson))로 정상 종료했다. 이전 시간 초과는 이번에 재현되지 않았으며 과거의 정확한 원인을 확정했다고 주장하지 않는다. 메모리 수치는 원인 인증이 아니다.

실행 소스 변경은 content의 내부 hover 처리와 build 이름 2파일이며 [차이](../artifacts/qa/transition-review-20261021/product.diff)를 보존했다. 사전·메타데이터·다른 실행 파일, 기존 ZIP 8개·등록 자료 136개 해시는 같다. package unittest 내부는 **5 PASS·구버전 ZIP/현 소스 동일성 1 SKIP**이며 새 ZIP은 만들지 않았다. 변경 전 원본은 archive/docs/transition-review-20261021/before다.

Windows Node/Python/오프라인 Chromium 검사이며 AI/API를 호출하지 않았다. 실제 Netflix/DRM·실서비스 다시간, 물리 기기/OS 배율·다른 OS, 스크린리더 실발화·원어민 전수 감수는 미실행이다. [AI 판정](../OttsubAiTalk.md#transition-review-20261021)·공통 상태표 OTT-58을 따른다.

<a id="boundary-review-20261021"></a>
## 2026-10-21 추가 재검수 — 손상 입력·취소·단일 자막 줄바꿈

대상은 **1.3.7-local-boundary-review-20261021.63**다. [최종 전체 일괄 QA](../artifacts/qa/2026-10-21T10-55-04-310Z-28360/summary.json) **114/116 스위트, 394.3초, 입력 169개**, 실행 중 입력 변경 0·생략 그룹 없음이다. 시간 초과 2개를 소스 변경 없이 단독 재실행하여 광고 복구 **33/33·23.7초**, 기존 설정 회귀 **12/12·15.1초**를 통과했다. [재실행 목록](../artifacts/qa/boundary-review-20261021/browser-retries.json)·[판정 및 해시 검증](../artifacts/qa/boundary-review-20261021/verification.json)을 따른다. 그룹은 구문 45·runtime 29·legacy 15·browser 27이며, 116스위트 모두의 기능 검증을 확인했지만 단일 전체 실행은 114/116이다. 당시 가용 RAM 약 1.1GB가 관찰됐으며 브라우저 시간 초과의 정확한 원인은 미확정이다. 정식 45초 제한은 유지했다. 각 스위트 수와 내부 검사 수를 혼동하지 않는다.

| 재현한 문제 | 수정 및 직접 확인 |
|---|---|
| 비정상 WebVTT 시간 줄 | 음수·접두 문자열·끝 토큰의 쓰레기 문자 일부를 정상 시간으로 읽었다. 시간 줄 시작과 마지막 시간 토큰의 구분자를 확인한다. 정상 cue ID·CRLF·쉼표 밀리초·배치 옵션은 유지한다. 잘못된 입력 경계이며 실제 Netflix 트랙 장애로 확대하지 않는다. |
| 손상된 숫자 명령 | JSON 객체의 `toString`/`valueOf` 값 때문에 숫자 변환에서 예외가 발생했다. 기존 0 fallback을 유지하도록 변환 예외를 처리했다. 조정은 delta 0, 설정은 0이며 정상 변환·반올림·±60000 제한은 그대로다. 같은 확장 내부의 비정상 명령 범위이며 외부 sender는 기존에도 거부했다. |
| 단일 자막의 불필요한 줄바꿈 | 900px player에서 짧은 영어·기울임·아랍어·태국어가 모두 두 줄로 나뉘었다. 축소된 wrapper와 자막의 96% 제한이 겹친 것이 원인이라 단일 모드 wrapper를 내용 영역 전체 너비로 맞췄다. 4개 짧은 문장은 한 줄, 긴 문장은 화면 안에서 줄바꿈, 명시적 개행과 단일/이중 전환을 확인했다. 빈 영역 클릭 통과·실제 글자 드래그도 유지한다. |

[수정 전 실패](../artifacts/qa/boundary-review-20261021/runtime-before.log)는 보존했다. 새 정식 runtime **7검사**, browser **4검사**를 편입했다. [너비 수정 전/후 probe](../artifacts/qa/boundary-review-20261021/wrap-probe.json)·최종 QA의 실제 CSS 측정과 캡처를 대조했다. 첫 전체 실행은 줄바꿈 보완 전 [116/116](../artifacts/qa/2026-10-21T10-33-46-973Z-20344/summary.json)이며, 그 통과를 최종 소스의 증거로 대신하지 않고 CSS·회귀 추가 뒤 전체를 다시 실행했다.

**검사 도구의 지연도 수정했다.** 중간 전체 실행은 [114/116](../artifacts/qa/2026-10-21T10-42-29-342Z-13992/summary.json)으로 legacy 2개가 20초 제한에 걸렸다. 로그의 모든 assertion은 통과했으며, ZIP inventory 검사가 매 파일마다 manifest를 다시 읽고 있었다. 단독 계측에서 manifest 46,202회/15.2초를 확인하고, 같은 구조의 세 검사 모두 한 번 읽기와 dirent 기반 탐색으로 바꾼 뒤 각 약 1.3~1.7초가 됐다. 세 번째 검사를 보완하기 위해 중간 재실행은 중단했고 그 로그는 보존했다. archive/artifacts 검사를 유지하며 junction/symlink는 따라가지 않는다. [허용 ZIP·dist/artifacts 무단 ZIP·링크 경계 9검사](../artifacts/qa/boundary-review-20261021/scan-guards.json)도 통과했다. 테스트 제외·assertion/20초 제한 완화 없이 수정 후 전체를 다시 실행했다.

**문제가 아니었던 가설:** 저장된 객체 설정은 실제 storage schema가 제거하고 독립적인 정상 설정은 복원했다. 실제 popup의 초기화·키보드 대상 전환도 정상이어서 이 경로는 고치지 않았다. 응답 body 대기·재시도 backoff 중 취소도 이전 데이터 파싱/추가 요청을 막고 타이머를 해제했다. 주장을 재현하지 못한 부분을 결함 수에 넣지 않았다.

실행 파일 변경은 parser·sync-engine·CSS·build 이름 4파일이다. 15언어 사전/메타데이터·Netflix request/profile/native 선택·clock/ad/seek/episode guard는 변경하지 않았다. ZIP 8개·등록 자료 136개 해시를 보존했다. 패키지 unittest는 **6개 중 5 PASS·이전 ZIP/현재 소스 동일성 1 SKIP**이다. 기존 배포 ZIP을 현재판 테스트 근거로 대신하거나 새 ZIP을 만들지 않았다. 변경 전 원본은 archive/docs/boundary-review-20261021/before에 보존한다.

검사는 Windows의 Node/Python/별도 오프라인 Chromium이며 AI/API를 호출하지 않는다. 실제 Netflix/DRM·실서비스 다시간 재생, 물리 화면/OS 배율·다른 OS, 스크린리더 실발화·원어민 전수 감수는 미실행이다. [AI 판정](../OttsubAiTalk.md#boundary-review-20261021)과 공통 상태표 OTT-57을 따른다.

<a id="full-review-20261021"></a>
## 2026-10-21 프로그램 전체 다각도 재검수 — .62

[전체 판정 12영역](../artifacts/qa/full-review-20261021/verification.json)·[최종 전체 QA](../artifacts/qa/2026-10-21T10-20-17-297Z-31116/summary.json)를 따른다. **114/114 스위트, 277.7초, 입력 167개**, 실행 중 입력 변경 0·생략 그룹 없음이다. 최초 .61 재실행은 [111/112](../artifacts/qa/2026-10-21T10-11-34-349Z-22092/summary.json)였고, 아래 테스트 fixture 1건을 바로잡은 뒤 .62 전체를 다시 실행했다.

| 관점 | 직접 확인과 판정 |
|---|---|
| 구문·권한·실행 진입점 | 전체 구문/manifest 리소스, MAIN/ISOLATED 경계, 실제 unpacked 확장 worker·side panel. 권한·load 순서는 동일. |
| 자막·재생·광고·회차 | 기존 clock/ad/seek/episode/원본 선택 회귀 + 독립 선형 oracle와 무작위 탐색·되감기·offset·미세 겹침 8,800회 대조. |
| 네트워크·보안 | URL 기본 양성 10개 + host/port/userinfo/protocol/역슬래시 정규화 120변형, 실제 parser→renderer의 활성 마크업 12종 차단, 외부 sender·잘못된 action 거부. |
| 언어·화면·접근성 | 15언어 Gate1/2/12·메타데이터, 실제 UI 75회 언어 전환, 기존 320/360/430·고대비·글자 확대·키보드·focus 검사, 새 dark forced-colors 캡처 열람. |
| 비동기·설정·리소스 | 늦은 tab query/이전 응답·timeout·다른 build·설정/재열기 회귀. renderer 300/설정 구독 500 외 상태 연결 400/HUD 200회 반복·종료를 추가. |
| 패키지 경계 | 현재 메모리상 배포 입력·진단 제외 검사. 기존 ZIP과 현재 소스가 달라 **6개 중 5 PASS·동일성 비교 1 SKIP**이며 구버전 ZIP 성공을 현재판 증거로 대신하지 않는다. 새 ZIP 미생성. |

**실제 수정 2건:** `status-connection.stop()`의 pagehide 리스너 미해제를 400회 반복으로 재현하고 소유 리스너 제거·멱등 종료를 보완했다. 일반 단일 popup 사용에서 동일한 누적이 관찰됐다는 뜻은 아니다. `sync-engine`의 1,000 UTF-16 code units 절단 경계에서 정상 이모지/확장 한자가 반으로 잘리는 것을 재현하고 끝의 잘린 high surrogate만 제거했다. grapheme cluster 전체 보존이나 시간/광고 guard 변경으로 범위를 넓히지 않았다.

**검사 도구 수정 1건:** 모의 `getStatus`가 `set_dual_mode` 이후에도 항상 true를 돌려주어 고대비 스위치를 되돌렸다. 공유 fixture가 명령 결과를 반영하도록 고쳤다. [접근성 33검사 3회 연속](../artifacts/qa/full-review-20261021/accessibility-repeats.json) 및 최종 전체 실행에서 통과했다. assertion·timeout을 완화하거나 실패 로그를 지우지 않았다. 새 정식 runtime 7검사·browser 5검사도 편입했다.

신뢰 도메인의 `evilcdn.nflxvideo.net`도 허용된 하위 도메인이므로 이를 외부 host로 취급한 최초 probe 기대값은 정정했다. 역슬래시를 경로로 정규화한 URL 역시 실제 hostname으로 판단한다. 기존 redirect-follow의 최종 데이터 검사는 중간 redirect 요청 자체를 금지하는 장치가 아니며 현재 동작을 임의 변경하지 않았다.

제품 변경은 상태 연결·문자 절단·build 라벨 3파일이며 기존 15사전/메타데이터·Netflix request/profile/native 선택·clock/ad/seek/episode guard·ZIP 8개·등록 자료 136개 해시를 보존했다. 변경 전 원본은 archive/docs/full-review-20261021/before, AI 간 응답은 [OttsubAiTalk](../OttsubAiTalk.md#full-review-20261021), 상태 정본은 App_Status의 OTT-56이다.

실제 Netflix/DRM, 실서비스 다시간 재생, 물리 4K/OS 배율, 스크린리더 실발화, 원어민 전수 감수, 다른 OS/물리 기기의 확인을 뜻하지 않는다.

상태표 OTT-56 1행은 백업·재개방 후 다른 셀/서식/필터/규칙 보존을 대조했고 QA 사본 이미지도 열람했다. [렌더러 기록](../artifacts/qa/full-review-20261021/ledger-render-verification.json): 이미지·수식 오류 검색 0건 출력 뒤 번들 렌더러가 -1073740791로 종료한 도구 경계는 XLSX 검증 성공과 구분한다.

<a id="quality-20261021"></a>
## 2026-10-21 품질 보강 9항목 — .61

- **직접 실행:** [새 전체 QA](../artifacts/qa/2026-10-21T08-46-52-908Z-2940/summary.json) 정식 전체 QA **112/112, 275.4초, 입력 165개**. 생략 그룹·실행 중 입력 변경 0. [검증 JSON](../artifacts/qa/quality-20261021/verification.json), [동일 입력 Shared 게이트](../artifacts/qa/quality-20261021/shared-l10n-final.json), [수정 전 로그](../artifacts/qa/quality-20261021/)를 따른다. 이전 .60 105/105를 현재 .61의 검사로 인용하지 않는다.
- **언어 검사:** 정식 `audit-l10n`에 고정/공유 Gate 12의 사전·메타데이터 문자 가드를 포함했다. UI/사전/메타데이터 inventory 불일치·중복·문자 혼입 변형을 검사하며, 6개 회귀 스위트의 언어 loop는 실제 UI 목록을 따른다. 독립 정렬/키 완전성 검사를 유지했다. [AI 번역 검토](../artifacts/qa/quality-20261021/copy-review.json)는 15언어 상태/도움말 의미와 주요 용어 검토 + 2,880항목 계약 검사이며 원어민 인증이 아니다. 상태 설명 4키의 59개 값을 정정했다.
- **파서·렌더링:** 신규 런타임 6검사(180 seeded 입력×12cue, 5×1024×1024 UTF-16 code units 제한, 150,000개 닫히지 않은 `<` worker 상한 등)와 실제 DOMParser/renderer 4검사가 통과했다. 역전/0길이 cue, Infinity 시간, 대사 NOTE/STYLE/REGION 누락, VTT 크기 제한 누락, 태그 정리 지연의 5개 재현 결함을 수정했다. ruby 기본 문자·스타일 상속·줄바꿈·동시간 겹침·긴 Thai/혼합 RTL-LTR·inert 마크업을 확인했다.
- **접근성:** 실제 popup의 저대비 보조 글자 3종을 #999로 바꾸고 스위치 5개에 기존 사전의 접근성 이름을 연결했다. 캡처에서 추가로 발견한 forced-colors 스위치 손잡이 소실은 시스템 Canvas/ButtonText/Highlight 색상으로 보완했다. 15언어×(320 CSS px reflow·텍스트 대비/이름 + forced-colors 선택/포커스/키보드 스위치의 손잡이·위치)와 en/ar/th 200% 글자 확대 총 **33검사**다. [대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) 4.5:1/큰 글자 3:1, [텍스트 확대](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) 기준을 참조했다. CSS viewport/폰트 배율의 합성 입력이며 물리 400% zoom·스크린리더 발화나 전체 WCAG 적합성 인증으로 확대하지 않는다.
- **복합 장애·자원:** 실제 shipped content script/로컬 popup bridge의 body 지연→언어 변경→회차 전환→popup reload→역순 응답 완료 **5검사** 통과. 전체화면 후 제거 직전 예약 callback이 overlay를 재생성하는 결함을 generation guard로 수정했다. renderer **300회**, popup 구독 **500회** 반복과 전역 listener/ResizeObserver/DOM 해제·GC heap 증가 상한 **4검사** 통과. 해당 실행의 heap 증가 127,444 bytes이며 3MiB 상한 검사의 관찰값이다. 브라우저/서비스 전체 메모리 누수 부재의 증명은 아니다.
- **안내:** 15언어 실제 popup에서 unavailable 언어/CC종류, URL 대기 시 Netflix 메뉴 선택 안내, 복구 지연의 원본 표시/새로고침 버튼과 언어 자동 변경 없음 **15검사** 통과. 변경된 상태 설명은 연결과 준비 완료, 대기와 일시정지, 주/보조 로딩 독립성을 구분한다.

실제 Netflix/DRM·물리 4K/OS 배율·스크린리더 실발화·원어민 전수 감수·다른 OS/하드웨어·실서비스 장시간 검사는 이 증거 밖이다. ZIP 8개와 기존 등록 자료 136개는 이전 해시 그대로다. 현재 상태는 App_Status의 OTT-47–55, AI 간 상세 응답은 [기록](../OttsubAiTalk.md#quality-20261021)을 따른다.

상태표 OTT-47–55의 9행은 즉시 백업 후 갱신하고 다른 셀·서식·필터·유효성 규칙 보존을 재개방 대조했다. QA용 사본만 숨김을 풀어 3개 이미지를 렌더링·열람했다. [렌더러 기록](../artifacts/qa/quality-20261021/ledger-render-verification.json): 이미지와 수식 오류 검색 0건을 출력한 뒤 번들 렌더러가 비정상 종료(-1073740791)했으며, XLSX 검증 성공과 도구 종료 실패를 구분한다.

<a id="th-store-shots-20261021"></a>
## 2026-10-21 태국어 스토어 스크린샷 3종·등록 문구 — .60 유지

[검증](../artifacts/qa/th-store-shots-20261021/verification.json)·[UI 상태/해시](../store_assets/th/verification.json)·[원본 입력](../artifacts/qa/th-store-shots-20261021/source.json)·[제작 안내](../store_assets/th/README.md)를 따른다. 실제 62개 배포 입력 스냅샷과 현재 소스·캡처 도구의 runtimeHashes가 전부 같다. 새 ZIP은 생성하지 않고 기존 ZIP 8개와 정식 QA 입력 155개·다른 언어 자료를 보존했다.

직접 생성한 3장 모두 **1280×800 RGB JPEG**, JPEG 시그니처·이미지 decode·SHA-256을 확인했다. 오프라인 Chromium에서 실제 th UI·LTR·영어/태국어 선택·페이지 오류 0·가로/텍스트 넘침 0·footer와 본문 분리를 확인했다. 싱크 화면은 실제 slider 이벤트 후 -100ms/-0.1s이고 학습 화면은 보조 가림·hover pause·학습 카드 펼침이 활성화됐다. 세 이미지를 열어 Thai 결합 문자와 제목·패널·하단 예시 표기를 확인했다.

이름/짧은 설명은 th/messages.json과 같으며 **45/75·93/132 UTF-16 code units**다. 상세 설명은 사용법·기능·단축키·FAQ 5문항·Netflix 조건·개인정보처리방침·독립 확장 안내를 포함한다. [도구 옵션 검사](../artifacts/qa/th-store-shots-20261021/cli-verification.json)는 기존 ru 기본 ZIP 소스/61파일 경로 보존과 잘못된 옵션·프로젝트 외부 runtime 거부를 확인했다. 캡처 도구 구문 검사도 통과했다. 제품 변경이 없어 전체 105스위트를 반복 실행하지 않고 그 통과본 입력 155개가 현재와 같은지 대조했다.

실제 Netflix/DRM 영상·업로드·Google 계정/콘솔·새 ZIP·원어민 전수 감수·타 OS 검사는 하지 않았다. 상태표 OTT-46과 이전 대화 본문·문서 링크 보존은 [최종 확인](../artifacts/qa/th-store-shots-20261021/final-verification.json)을 따른다.

<a id="thai-ui-20261021"></a>
## 2026-10-21 태국어 메뉴·언어/문자 가드·15언어 회귀 — .60

- **현재 실행:** [정식 전체 QA](../artifacts/qa/2026-10-20T23-46-59-104Z-9212/summary.json) **105/105, 234.3초, 입력 155개**, 변경 중인 입력 0·생략 그룹 없음. 각 그룹의 실제 수는 summary.json을 따른다. [새 전용 검증](../artifacts/qa/thai-ui-20261021/verification.json)은 기존 14언어 사전/메타데이터·8ZIP SHA-256·manifest version_name 이외 불변·허용한 변경 파일을 대조했다.
- **번역 검사:** pinned/shared Gate 1·2·OTTSub 프로필 통과, **15×192키**, Thai/Latin Gate 12 사전·메타데이터 위반 0, 9종 비허용 문자 주입 모두 차단. metadata 이름 **45/75**, 설명 **93/132 UTF-16 code units**. 영어와 같은 5키는 OTTSub와 숫자 증감 표기다. [감사](../artifacts/qa/thai-ui-20261021/audit.json)를 따른다. 이 검사가 원어민 전수 감수는 아니다.
- **UI/동작:** 언어명·DOM/속성·전체 15시스템 언어 정렬/복원 **28개**, 320/360/430px×15언어×3상태 배치 **135개**, 플랫폼 단축키·휠 **42개**, 실제 unpacked 확장 저장/복원·모달 **22개**를 직접 확인했다. 학습 카드 펼침과 가림 4버튼 Range 폭 검사를 포함한다. [320px 화면](../artifacts/qa/2026-10-20T23-46-59-104Z-9212/review-th-320.png), [실제 확장](../artifacts/qa/2026-10-20T23-46-59-104Z-9212/thai-extension-panel.png)을 열어 확인했다.
- **identity·신뢰 경계:** th/th-TH/th_TH는 UI만 th로 정규화한다. 자막 th/th-TH/th-Latn은 별도 URL·identity로 유지한다. Thai 제공자 라벨은 명시적 th 계열 labelLocale+Thai 문자·검사 대상의 다른 문자군 없음일 때 채택하고, 다른 UI에 Thai 문자열이 그대로 새어 나오지 않는지 검사했다. 이 가드는 문장의 언어/원어민 품질을 판별하지 않는다.
- **패키지·미실행:** 기존 1.3.7 ZIP은 .59/14언어 그대로다. package suite의 현재 입력 검사는 통과했고 **기존 ZIP과 새 개발 소스 동일성 검사 1개는 요청 없이 ZIP을 재생성하지 않으므로 의도적으로 skip**했다. 실제 Netflix/DRM·Google 계정/콘솔·새 ZIP·원어민 감수·실제 스크린리더·타 OS 검사는 하지 않았다. 자동 검사에서 320px은 사이드 패널 폭 검증이며 모바일 Chrome 지원을 뜻하지 않는다.

<a id="lr-comparison-privacy-publication-20261021"></a>
## 2026-10-21 Language Reactor 정적 비교·한영 개인정보처리방침 실제 게시 — .59 유지

[게시 영수증](../artifacts/qa/lr-comparison-20261021/publication.json), [실제 공개 검증](../artifacts/qa/lr-comparison-20261021/live-verification.json), [정적 비교](../artifacts/qa/lr-comparison-20261021/comparison.json)를 따른다. 공개 저장소 commit은 `3e5504f25109bbe0a75500d692f1c1ebac405105`이며 Pages built의 commit과 같다. 실제 HTML 2개·CSS·아이콘·사이트맵의 HTTP 200·SHA-256이 직전 18/18 로컬 검수본과 일치한다. 공개 tree는 기존 6파일+README이며 앱 저장소 private를 재확인했다. [한국어 방침](https://k2bact.github.io/ottsub-site/ko/#privacy)·[영어 방침](https://k2bact.github.io/ottsub-site/#privacy)을 공개했다. 이전 18/18을 새 브라우저 실행 수로 집계하지 않는다.

Google 공식 확장 업데이트 endpoint에서 LR 6.0.1 CRX3를 받아 ZIP CRC·안전한 압축 경로를 검사하고 설치 없이 분석했다. 크기 4,789,312 bytes·109파일이며 SHA-256은 `5776167ded3b6b787af4c726d532bb044a90bdaa383eff858e3f8f8bfc75b1e2`다. ID/header 대조와 암호학적 서명 검증은 구분하며 후자는 하지 않았다. 파일 해시와 0-based Unicode 문자 offset으로 페이지 주입·manifest 관찰·자막 다운로드/파싱·자체 표시·요청 profile 변경·native track 선택의 6개 관찰을 기록했다. 타사 코드를 실행·재사용하거나 공개 저장소에 넣지 않았다.

상태표의 기존 3행·14셀만 갱신했고 다른 모든 셀·서식·필터·숨김·틀 고정·드롭다운·색 규칙·사용자 확인 OTT-40을 보존했다([상태표 영수증](../artifacts/qa/lr-comparison-20261021/ledger.json)). 실제 콘솔 변경 행은 없다. [최종 검사](../artifacts/qa/lr-comparison-20261021/final-verification.json)에 문서 링크·이전 AI 본문·154개 QA 입력·61개 ZIP 입력·기존 8ZIP 보존과 관련 legacy 실행 로그를 기록한다. 새 전체 제품 QA·실제 Netflix/DRM·Google 계정/콘솔·새 ZIP·타 OS 검사는 수행하지 않았다.

STORE_GUIDE 수정 뒤 관련 legacy QA를 직접 재실행해 **400/400 + 비동기 hook 1/1**, redteaming **32/32**를 통과했다([QA 로그](../artifacts/qa/lr-comparison-20261021/qa-automated.log), [redteaming 로그](../artifacts/qa/lr-comparison-20261021/redteaming.log)). 새 상태표 3행의 렌더를 열어 확인했고 오류 검색 0건이었다. 미리보기 라이브러리의 이미지/검색 결과 생성과 프로세스 exit 1은 구분하며, XLSX 저장·재열람·다른 셀/서식 보존은 별도 검증으로 통과했다.

<a id="legal-review-20261021"></a>
## 2026-10-21 법률·정책 검토와 로컬 개인정보 고지 보완 — .59 유지

기술/표시 확인은 [findings.json](../artifacts/qa/legal-review-20261021/findings.json), 전용 [검사 JSON](../artifacts/qa/legal-review-20261021/verification.json), 판정·공식 법령/약관은 [AI 기록](../OttsubAiTalk.md#legal-review-20261021)을 따른다. 법률 적법성이나 사업 허가를 자동 PASS로 인증하지 않는다.

직접 실행한 로컬 확인 **18/18**: 기존 QA 입력 154개 중 STORE_GUIDE만 의도적으로 변경, 기존 ZIP 8개 SHA-256, 정책의 실제 저장/통신 경계, 한영 preview/public canonical·noindex, 기존 6파일 공개 경계, 2언어×5폭(320/360/430/768/1280px)의 JS 비활성 의미·링크·넘침을 검사했다. 한영 정책 캡처 2장을 직접 확인했다. 처음 16/18은 2개 긴 섹션 캡처의 부드러운 스크롤 안정화 실패였으며 [원본](../artifacts/qa/legal-review-20261021/attempt-1/verification.json)을 보존했다. 기존 reduced-motion CSS를 쓰는 검증 환경으로 다시 실행해 통과했다. 제품 레이아웃 assertion을 완화하지 않았다.

STORE_GUIDE 수정 뒤 legacy QA **400/400 + 비동기 hook 1/1**, redteaming **32/32**를 직접 통과했다([로그](../artifacts/qa/legal-review-20261021/qa-automated.log), [redteaming](../artifacts/qa/legal-review-20261021/redteaming.log)). 현재 sanitized package 입력과 기존 1.3.7 ZIP **61파일의 바이트가 전부 같다**. 전체 제품 105스위트를 새로 돌린 결과로 집계하지 않는다. 새 ZIP·공개 게시·스토어/계정·실제 Netflix/DRM·다른 OS 조작은 하지 않았다.

상태표에 실제 정책 보완·약관 판단·개발 자료 이용 권리 항목 3개를 추가했고 기존 행/서식/드롭다운·색·필터·틀 고정을 보존했다([영수증](../artifacts/qa/legal-review-20261021/ledger.json)). 기존 사용자 필터로 새 행도 숨겨져 있어 원본은 유지하고 QA 사본에서 해당 3행만 펼쳐 표시를 확인했다. 스토어 게시 여부를 묻는 루틴 행은 만들지 않았으며 OTT-40의 사용자 확인을 유지했다.

<a id="app-status-confirmed-20261020"></a>
## 2026-10-20 사용자 확인에 따른 OTT-40 정정

사용자가 1.3.7 배포를 완료로 확인해 표의 OTT-40은 완료, 연결 콘솔 기록은 게시됨으로 갱신했다. 기존 2행만 수정했고 추가·삭제·정렬은 하지 않았다. 쓰기 직전 원본 백업·SHA-256 대조 후 openpyxl로 저장·재열람했으며, 다른 모든 셀 값/수식/서식·시트/열·드롭다운·조건부 색 규칙·필터·틀 고정을 보존했다. [결과](../artifacts/qa/app-status-20261020/confirmation/result.json)·[사용자 지시](../OttsubAiTalk.md#app-status-confirmed-20261020)를 따른다. 이전 이관의 확인 필요 표기는 당시 이력이다. 제품 코드·ZIP 변경이나 새 제품 QA·콘솔 조작은 없다.

<a id="app-status-20261020"></a>
## 2026-10-20 공통 App_Status 상태표 이관 — .59 유지

사용자 요청과 `app_common/AGENTS.md` §5.1에 따라 [기존 상태표](../../App_Status.xlsx)를 openpyxl로 열어 바로 수정·저장하고 재열람했다. 「할 일」에 OTTSub **41건(OTT-1–41, 114–154행)**, 「콘솔 기록」에 **1건(17행)**을 아래에 추가했다. 이관 당시 완료 29·할 일 1·보류 9·안 함 1·확인 필요 1이며 이후 상태는 표를 읽는다. 동기화 추진은 사용자 취소를 기록했고 스토어 실제 업로드/심사/게시를 완료로 추정하지 않았다.

쓰기 직전 `_status_backup/App_Status_20261020-225147_ChatGPT.xlsx`로 원본을 복사하고 SHA-256 일치를 확인했다. 기존 Sudoku 59건·DroneWithAI 53건과 기존 콘솔 15건·사용법, 값/수식/서식/열/시트 순서·드롭다운·조건부 색 규칙·필터·틀 고정을 대조했다. 새 줄만 추가했고 기존 행을 삭제·정렬하지 않았다. 모든 추가 줄에 앱·작성자, 작업 줄에 실제 날짜 형식의 갱신일을 기록했다. [저장·보존 검증](../artifacts/qa/app-status-20261020/result.json)을 따른다.

전후 미리보기로 새 41행과 콘솔 행의 표시·줄바꿈·색을 직접 확인했고 Artifact Tool의 수식 오류 검색은 0건이었다. 미리보기 도구는 PNG·검사 결과를 생성했으나 프로세스 종료 코드는 1이었으므로 도구 프로세스 전체 성공으로 집계하지 않는다. XLSX의 실제 저장·재열람·기존 내용/서식 보존은 별도 openpyxl 검사로 통과했다. [최종 대조](../artifacts/qa/app-status-20261020/final-verification.json)는 문서의 모든 OTT ID·근거 경로/앵커, 이전 AI 기록 보존과 현재 QA 입력을 확인한다.

이번에는 제품 테스트를 재실행하지 않았다. 기존 최신 전체 QA 105/105의 **154개 입력 SHA-256**과 현재 파일, 1.3.7 ZIP 해시를 다시 대조했다. 제품 build `.59`·실행 로직·기존 ZIP은 그대로다. 이전 [TODO 원문](../archive/docs/status-ledger-20261020/before/docs/TODO.md)을 보존하고 상태의 정본을 표로 바꿨다. 실제 Netflix/DRM·발화·물리 OS 검증이나 스토어 업로드·Google 계정 접근은 하지 않았다.

<a id="release-137-20261020"></a>
## 2026-10-20 1.3.7 배포 준비 — .59

사용자 요청으로 [1.3.7 ZIP](../dist/ottsub-store-1.3.7.zip)과 [러시아어 등록 자료](../store_assets/ru/README.md)를 준비했다. [전체 정식 QA](../artifacts/qa/2026-10-20T11-54-21-208Z-21584/summary.json) **105/105, 267.0초**, 입력 154개·실행 중 변경 0건이다. 패키지 경계 6/6은 내부 skip 0이며, [새 ZIP의 실제 unpacked 확장 검사](../artifacts/releases/1.3.7/smoke.json)도 **13/13** 통과했다.

Pinned/Shared Gate 1·2·OTTSub 프로필과 실제 Gate 12, 문자 혼입 음성 대조군 8개를 직접 확인했다. 러시아어 메타데이터는 53/75·126/132 UTF-16 code units다. [실제 ZIP UI로 만든 1280×800 RGB JPEG 3장](../store_assets/ru/verification.json)은 UI ru/LTR·버전 1.3.7·영어/러시아어 선택·음수 싱크·학습 카드 펼침·여백·이미지 해시를 검증했고 직접 열어 확인했다.

[최종 대조](../artifacts/releases/1.3.7/verification.json)는 61개 ZIP 항목·추출본·현재 패키지 입력의 바이트 일치, 14개 locale, 진단/비공개 자료/GEO 사이트 제외, 기존 ZIP 7개 보존을 확인한다. .58 대비 추적 입력 변화는 manifest 버전, STORE_GUIDE, 과거 1.3.6 ZIP 보존을 명시한 기존 검사 3개뿐이다. 실제 Netflix/DRM·원어민 전수·물리 OS/스크린리더 검사는 포함하지 않았다. 스토어 업로드·심사 신청은 하지 않았다.

<a id="geo-publication-20261020"></a>
## 2026-10-20 GEO 소개 페이지 실제 게시 확인

사용자 승인 후 [한국어](https://k2bact.github.io/ottsub-site/ko/)·[영어](https://k2bact.github.io/ottsub-site/)를 게시했다. [실제 HTTP 검사](../artifacts/qa/geo-20261020/live-verification.json)는 HTML 2개·CSS·아이콘·사이트맵의 HTTP 200·검토본 SHA-256, 두 디렉터리 주소의 HTTP 200·index 메타·canonical·reciprocal hreflang·og:url을 통과했다. GitHub Pages build는 built이며 공개 저장소는 소개 페이지 6파일과 GitHub가 만든 README뿐이다. 기존 `K2Bact/OTTSub`가 여전히 private임도 다시 확인했다. 루트 robots.txt는 404이며 외부 호스트 정책을 바꾸지 않았다.

게시 URL을 연결한 최종 14언어 설명으로 [로컬 35/35](../artifacts/qa/geo-20261020/verification.json)를 재검사했다. [게시 전 결과](../artifacts/qa/geo-20261020/verification-before-publication.json)도 해시 대조 후 보존했다. 실제 검색 도구의 새 주소 열람은 현재 내부 오류로 확인하지 못했다. HTTPS 직접 접근 통과를 검색 색인·AI 인용 성공으로 확대하지 않으며 후속 관찰은 미완료다. [사용자 승인·결과](../OttsubAiTalk.md#geo-publication-20261020)를 따른다.

<a id="geo-implementation-20261020"></a>
## 2026-10-20 GEO 콘텐츠·정적 소개 페이지

[전용 검사](../store_assets/geo/verify.cjs)를 직접 실행해 **35/35** 통과했다([JSON](../artifacts/qa/geo-20261020/verification.json)). 검사 범위는 14언어 설명의 정의·사용법·FAQ와 기존 기능 보존, 로컬 noindex와 공개 주소 설정 시 canonical/hreflang/sitemap, 게시 주소·출력 경계의 잘못된 입력 거부, 실제 싱크 엔진으로 예시 부호 확인, JavaScript 비활성 상태의 본문·메타데이터·JSON-LD 일치, 2언어 × 5개 폭(320/360/430/768/1280px)의 레이아웃과 언어·내부 링크 동작이다. 외부 리소스 요청 0건은 이 정적 페이지 검사 결과이며 확장 프로그램의 네트워크 요청 0건을 뜻하지 않는다.

한국어 1280px·영어 320px 전체 캡처를 직접 열어 확인했다. [한국어 캡처](../artifacts/qa/geo-20261020/ko-1280.png)·[영어 캡처](../artifacts/qa/geo-20261020/en-320.png) 및 나머지 2장도 보존한다. 기존 전체 QA 입력 **154개**와 기존 ZIP **7개** 해시가 모두 같아 제품 전체 스위트는 반복 실행하지 않았다. 패키지 경계 검사는 별도로 실행해 **6개 중 5개 통과·1개 내부 skip**을 확인했다. skip은 .57 ZIP과 .58 개발 소스 차이이며 새 ZIP은 만들지 않았다.

[공개 검색 관찰](../artifacts/qa/geo-20261020/public-baseline.json)은 검색·스토어 열람의 스냅샷이다. 계정 로그인·콘솔·AI/API 테스트를 하지 않았으며 캐시에서 본 1.3.5를 실시간 최신 게시 상태로 단정하지 않는다. [GitHub Pages 후보](../artifacts/qa/geo-20261020/github-pages-candidate.json)는 소개 페이지 6파일만 포함하며 앱 소스가 없다. 현재 결과는 로컬 검증이며 실제 게시·색인·생성형 답변의 인용·추천·설치 증가를 인증하지 않는다. [전체 판정·실행 경계](../OttsubAiTalk.md#geo-implementation-20261020)를 따른다.

<a id="aeo-review-20261020"></a>
## 2026-10-20 Gemini AEO 변경 검토 — .58 유지

[주장별 판정·실제 수정](../OttsubAiTalk.md#aeo-review-20261020)을 따른다. 이번에 새로 실행한 [정식 전체 QA](../artifacts/qa/2026-10-20T04-46-00-393Z-25268/summary.json)는 **105/105, 223.0초**, 구문 45·런타임 25·레거시 15·브라우저 20 통과다. 추적 입력 154개와 현재 파일이 같으며 실행 중 변경 0건이다. 이전 러시아어 QA와 비교한 제품 입력 차이는 `popup/popup.html`의 접근성 속성 쌍 13개 추가뿐이며 이 보강을 유지했다.

[추가 실측](../artifacts/qa/aeo-review-20261020/accessibility.json)은 14개 언어의 바인딩 406개·Chromium 접근성 이름 182개·접근성 이름으로 찾은 주/보조 버튼 조작 28회를 통과했다. 정식 레이아웃 126/126, CDN 30/30, 실제 unpacked 사이드패널 21/21도 이번 전체 실행에 포함된다. 패키지 검사는 6개 중 1개 내부 skip(기존 .57 ZIP과 .58 개발 소스 차이)이며 새 ZIP 일치 검사를 한 것은 아니다.

[문구·백업·링크·현재 입력 대조](../artifacts/qa/aeo-review-20261020/verification.json)는 상세 설명 14개와 원문 백업·기존 ZIP 7개 해시 보존을 확인한다. 첫 전체 실행 85/105는 브라우저 검색 경로 오류였고, 별도 접근성 검사 첫 타임아웃은 픽스처 옵션 개수에 대한 검사 준비 조건 오류였다. 실패 산출물과 수정한 검사 조건은 AI 기록에 연결해 보존했다. 실제 Netflix/DRM·화면낭독기 발화·원어민 전수·Mac 추가 실기·AI 검색 노출 효과는 미검증이다.

<a id="ru-review-response-20261020"></a>
## 2026-10-20 러시아어 Gemini 검수 후속 — .58 유지

[주장별 판정·정정](../OttsubAiTalk.md#ru-review-response-20261020)과 [원문](../archive/docs/reviews/2026-10-20-russian/gemnisaying-original.md)을 보존했다. 새 제품 결함은 확인하지 않았고 제품/정식 테스트/ZIP은 변경하지 않았다. [후속 검증 JSON](../artifacts/qa/ru-review-20261020/verification.json)은 Pinned/Shared·실제 Gate 12 직접 실행, 현재 154개 입력·기존 13개 사전/메타데이터·ZIP 7개 해시 직접 대조 통과를 기록한다. 런타임 3파일은 [79/79 직접 재실행](../artifacts/qa/ru-review-20261020/runtime-79.log)했고, 브라우저 26/40/7/21 및 dropdown 4/4는 Gemini 보존 로그와 대조했다.

Gemini의 독립 9라운드나 전체 105개 정식 스위트를 이번 후속에서 재실행하지 않았다. 기존 전체 105/105는 아래의 .58 동일 입력 실행이다. 검수문 파일/API 표기와 ZIP 해시 검사의 실제 범위를 정정했으며 실사용/원어민 전수·기존 실기 보류 경계는 그대로다.

<a id="russian-ui-20261020"></a>
## 2026-10-20 러시아어 메뉴 — .58

**1.3.6-local-russian-ui-20261020.58 / 14언어·각 192키**다. [전체 실행 결과](../artifacts/qa/2026-10-19T16-28-25-614Z-27716/summary.json)는 **105/105(191.7초)**, syntax 45/runtime 25/legacy 15/browser 20이며 입력 해시 **154개**, 실행 중 변경/runner 생략 없음이다. [추가 문자계·보존 검사](../artifacts/qa/russian-ui-20261020/audit.json)와 [최종 검증](../artifacts/qa/russian-ui-20261020/verification.json)을 함께 본다.

최초 실행은 [98/105](../artifacts/qa/2026-10-19T16-23-39-956Z-15728/summary.json)였으며 7개 브라우저가 Chromium 시작 시 접근 거부 종료 코드 3221225506으로 중단됐다. 같은 제품/검사 입력을 샌드박스 밖의 동일 오프라인 조건에서 재실행한 위 최종 결과와 구분한다. 실패 기록을 삭제하거나 제품 assertion 실패를 허용하지 않았다.

- Pinned/실제 shared Gate 1·2·OTTSub 프로필 통과, Gate 12 사전/메타데이터 위반 0건. Russian은 Cyrillic/Latin을 허용하며 Greek·Hangul·Hiragana·Han·Devanagari·Arabic·Hebrew·Bengali 주입 8종을 모두 차단했다. 문자계 허용 검사는 러시아어와 우크라이나어 등 키릴 언어를 문장 내용으로 판별하거나 원어민 감수를 인증하지 않는다.
- 러시아어 Chrome 메타데이터는 이름 **53/75**, 설명 **126/132 UTF-16 code units**다. 기존 13개 사전·메타데이터는 수정 전과 객체 값이 전부 같다. 러시아어에서 영어와 같은 값은 OTTSub 이름/±수치 버튼 5개뿐이다.
- 실제 popup 언어/라벨 스위트 **26/26**: 러시아어 복원·RTL→LTR·100개 이상 text/title/aria 바인딩과 14개 시스템 언어 각각의 초기화·시스템 첫 행/나머지 영어 이름순·수동 ru↔en 변경/리로드를 직접 검사했다. 시스템 언어 입력은 Chrome API fixture이며 OS 언어를 변경한 것은 아니다.
- 레이아웃 **126/126**: 320/360/430px × 14언어 × 연결/지연/미연결, 러시아어 4개 가림 버튼 Range 폭까지 검사했다. [320px 학습 카드](../artifacts/qa/russian-ui-20261020/targeted/russian-panel-320.png)를 직접 시각 확인했다. 14언어로 늘어난 행렬이 단독 실행 47.5초여서 해당 suite의 runner 제한만 45→75초로 늘렸고 assertion/상태 검사는 유지했다.
- 실제 unpacked 확장 사이드 패널 **21/21**, 러시아어 native storage 저장/리로드·RTL→LTR·14언어 도움말 포커스 검사 포함. [실제 확장 패널](../artifacts/qa/2026-10-19T16-28-25-614Z-27716/russian-extension-panel.png). 플랫폼 단축키 브라우저 **40/40**도 러시아어를 포함했다.
- 현재 소스의 패키지 경계 검사는 통과했다. 기존 1.3.6 ZIP이 이전 .57 소스이므로 동일성 조건을 만족할 때만 실행하는 기존 ZIP 재검사는 내부 skip 1이다. 새 ZIP을 생성한 것으로 집계하지 않으며 기존 7개 ZIP 해시는 그대로다.

합성 Netflix 입력과 로컬 Chromium/Node/Python 검사다. 실제 Netflix/DRM·러시아어 원어민 전수 감수·물리 OS/키보드 배치·스크린리더 발화·다른 OS 기기를 검증하지 않았다. 현재 실기 보류와 모바일/Safari 미지원 경계를 바꾸지 않았다.

<a id="resolution-mobile-20261020"></a>
## 2026-10-20 보고서 해상도 추가 검사·모바일 경계 — .57 유지

사용자가 해상도별 기술 문제와 모바일 실행 가능 여부를 물어 [실제 기술 판단](../OttsubAiTalk.md#resolution-mobile-20261020)을 추가했다. 제품/manifest/기존 테스트/ZIP은 변경하지 않았다. 이번 검사 도구는 [verify.cjs](../artifacts/qa/resolution-review-20261020/verify.cjs), 상세 결과는 [result.json](../artifacts/qa/resolution-review-20261020/result.json)이다.

- 로컬 Chromium **151.0.7922.34**, 네트워크 요청 차단, 실제 parser/renderer/CSS 사용. 임시 브라우저 프로필은 해당 artifacts 폴더 안에 제한했다.
- [원본 CSV](../archive/analytics/2026-10-20/기술_개요.csv)의 추출 JSON과 SHA256을 대조하고 **19개 크기 × DPR 1/1.25/2 × 전체/줄인 창 × 상단/하단 = 228/228** 통과했다. 줄인 창은 폭에서 360px, 높이에서 120px을 빼되 최소 320×360px로 제한한 합성 조건이며 실제 Chrome 프레임 크기를 측정한 것이 아니다.
- 언어별 4줄 예시, 기본 글자 크기/배율, 원본 자막 DOM 없는 fallback, 1920×1080 메타데이터의 가상 video를 사용했다. 자막 요소와 텍스트 Range가 player 밖으로 잘리지 않고 두 언어가 겹치지 않으며 문서 가로 넘침이 없는지 검사했다. 화면 폭 800px 이상 **168/168**, 좁은 크기 **60/60**, 페이지 오류 0이다. 좁은 크기에서의 성공은 모바일 확장 실행 검사가 아니다.
- 직접 사용/경계 확인한 입력 7개는 검사 중 SHA256 변경이 없었다. 기존 전체 QA의 **153개 입력도 현재와 모두 일치**했다. 이번에 전체 105개 스위트를 재실행한 것으로 집계하지 않는다.
- 각 크기/DPR는 새 DOM 또는 브라우저 컨텍스트로 검사했다. 실제 OS 배율 변경·브라우저 확대/축소 조작, 모든 글자/드래그 위치·긴 대사 조합, 실제 Netflix/DRM·다른 OS/모바일 물리 기기 검증은 아니다. 기존 패널 320/360/430px·13언어 검사는 아래 정식 QA 이력과 구분한다.

일반 모바일 Chrome의 웹스토어 확장 설치/실행 미지원, 휴대폰의 Add to Desktop이 컴퓨터에 추가하는 기능인 점은 공식 공개 문서로 확인했다. OTTSub는 `chrome.sidePanel`과 Netflix 웹페이지 삽입에 의존한다. 다른 모바일 브라우저·Netflix 앱 호환성을 보장하지 않으며 모바일 구현/실기 보류를 재개하지 않았다. 재현된 해상도 결함이 없어 제품 수정은 하지 않았다.

<a id="full-program-review-20261020"></a>
## 2026-10-20 Gemini 전체 13라운드 검수 후속 — .57 유지

원본은 [archive 보관본](../archive/docs/reviews/2026-10-20-full-program/gemnisaying-original.md), 주장별 동의·반박은 [OttsubAiTalk.md](../OttsubAiTalk.md#full-program-review-20261020)에 기록했다. Codex의 QA 후 문서 축약으로 STORE_GUIDE의 quota/Single Purpose/Least Privilege 설명이 빠졌음을 재현했다. 문서 내용을 복구하고 이 문서를 정식 runner 입력 해시에 추가했다. 제품 실행 파일/manifest/정식 테스트 조건/배포 ZIP은 바꾸지 않았다.

수정 전 단독 실행은 qa_automated 동기 **398/400·실패 2개**와 hook **1/1**, redteaming **31/32**, 두 파일 모두 exit 1이다. 수정 후 **400/400 + hook 1/1**, **32/32**, 둘 다 exit 0이다. [전 stdout](../artifacts/qa/full-program-review-20261020/before-logs/)·[후 stdout](../artifacts/qa/full-program-review-20261020/after-logs/)를 보존했다. 보고서의 34/35는 원본 로그와 불일치한다.

현재 전체 정식 QA **105/105(204.9초)**: syntax 45/runtime 25/legacy 15/browser 20, 생략/실행 중 입력 변경 없음. [전체 결과](../artifacts/qa/2026-10-19T15-23-36-585Z-26588/summary.json)를 따른다. 기존 152개 제품/검사 입력에 실제 테스트가 읽는 STORE_GUIDE를 더해 **153개**이며 이 문서 SHA256도 기록했다. 문서를 바꾸면 예전 152개 해시 일치만으로 현재 QA를 보증할 수 없다. CDN 브라우저 **30/30 직접 통과**, 패키지 **6/6·skip 0**, 사이드 패널 **20/20**도 이번 정식 실행에 포함된다.

Gemini의 13/13은 문서 실패 3개를 허용하고 CDN 실패에서 과거 결과를 인용한 범주별 판정이다. 이를 현재 정식 runner 105/105와 같은 의미로 쓰지 않는다. 원본 script/JSON/stdout은 수정하지 않았고 이번에 그 사용자 정의 13라운드 script를 재실행한 것으로 집계하지 않는다.

[최종 대조 JSON](../artifacts/qa/full-program-review-20261020/verification.json)에서 runner/STORE_GUIDE 외 기존 추적 파일, ZIP 7개, 포르투갈어 이미지 3장과 Gemini 원본 증거 보존을 확인했다. 실제 Netflix/DRM·발화·다른 OS·원어민 전수, 기존 실기 보류와 동기화 과제 제외는 그대로다.

<a id="pt-pt-store-shots-20261019"></a>
## 2026-10-19 포르투갈어 현지화 스토어 스크린샷 — .57 유지

이전 준비에서 빠진 포르투갈어 이미지를 사용자 요청으로 보완했다. 기존 `capture-localized.cjs`에 pt-PT UI/pt-pt 자료 폴더 분리와 실제 소문자 자막 선택값 검증을 연결했다. 제품/API/권한/ZIP은 변경하지 않았다. 업로드 ZIP에서 추출한 실제 popup에 별도의 예시 Chrome API/자막 상태를 공급해 이중 자막·싱크 조절·학습 설정 3장을 만들었다. 예시 상태/대사임을 포르투갈어로 이미지 하단에 표시했다.

[3장과 순서](../store_assets/pt-pt/README.md), [제작 JSON](../store_assets/pt-pt/verification.json), [최종 보존/형식 검사](../artifacts/qa/pt-pt-store-shots-20261019/verification.json)를 따른다. 각 **1280×800 RGB JPEG**, pt-PT/LTR/1.3.6 UI·주 en/보조 pt-pt를 확인했다. 2번은 -100ms/-0.1s, 3번은 secondary blur/hover pause를 확인했다. 페이지 오류·문서/주요 텍스트 가로 넘침 없음, 본문/푸터 겹침 없음이며 3장 모두 직접 시각 확인했다.

현재 152개 제품/검사 입력·ZIP 7개·기존 다른 언어 설명/이미지와 포르투갈어 이름/상세 설명은 SHA256 그대로다. 따라서 동일 입력의 아래 전체 QA 105/105 이력을 유지하며 이번 이미지 작업에서 전체 QA를 다시 실행한 것으로 세지 않는다. 실제 Netflix/DRM·발화·다른 OS·원어민 전수 감수는 이번 결과가 아니다.

<a id="release-136-20261019"></a>
## 2026-10-19 1.3.6 업로드 준비 — .57

사용자 요청으로 .56의 실행 로직을 유지하고 manifest version/version_name만 **1.3.6 / 1.3.6-local-store-20261019.57**로 바꿨다. [ZIP](../dist/ottsub-store-1.3.6.zip)은 **60파일·13언어·172,632 bytes**, SHA256 `a604a9c795a31c693a65fd5dfb462ddc8509ff6626afe3f690edf5e7238c10bb`다. 진단/테스트/개인 키/AI 대화·등록 자료와 개발 version_name은 포함하지 않는다. [최종 검증](../artifacts/releases/1.3.6/verification.json)·[버전별 패키지 보고서](../dist/ottsub-store-1.3.6.package-report.json)를 따른다.

현재 소스 전체 로컬 QA **105/105(222.8초)**, 152개 입력 해시·실행 중 변경/스위트 생략 없음. [전체 결과](../artifacts/qa/2026-10-19T14-27-53-345Z-17440/summary.json)를 따르며 패키지 경계는 **6/6·skip 0**이다. ZIP을 추출한 실제 unpacked 확장 smoke는 **10/10**으로 13언어/시스템 첫 행 정렬, he→zh-TW→pt-PT→en 저장/리로드·RTL/LTR, 320px·후원 링크·안내창 키보드 포커스를 확인했다. [smoke JSON](../artifacts/releases/1.3.6/smoke.json)·[실제 패키지 포르투갈어 패널](../artifacts/releases/1.3.6/portuguese-package-panel.png).

pinned/shared Gate 1/2/OTTSub 프로필 **13×192키**를 다시 확인했다. 포르투갈어 이름 **51/75**, 짧은 설명 **112/132** UTF-16 code units와 ZIP metadata/복사용 문구 일치, 상세 설명 3454 code points·기능 범위를 대조했다. 이번 요청은 ZIP/설명이며 새 포르투갈어 스토어 이미지는 만들지 않았다. 기존 히브리어 설명/이미지와 다른 기존 locale 자료는 보존했다.

이전 ZIP 6개와 버전별 보고서는 SHA256이 같다. 이번 최초 전체 검사는 과거 1.3.5 ZIP 보존 목록 누락으로 legacy 3개가 실패해 102/105였다. 세 검사에 1.3.5만 추가 허용하고 전체를 재실행했다. [첫 실패 결과](../artifacts/qa/2026-10-19T14-22-50-375Z-27188/summary.json)는 보존했다. 제품 실행 코드 변경은 없다. 실제 업로드/계정/콘솔 조작은 하지 않았다. 실제 Netflix/DRM·원어민 전수·스크린리더 발화·다른 OS 검증은 이번 로컬 준비 범위가 아니며 기존 보류/동기화 과제 제외를 유지한다.

<a id="pt-pt-review-20261019"></a>
## 2026-10-19 Gemini 포르투갈어 검수 후속·AI 대화 통합 — .56 유지

사용자가 전달한 보고서는 [archive 원문 전사](../archive/docs/reviews/2026-10-19-pt-pt/gemnisaying-original.md), 주장별 답변은 새 대화 기준 파일 [OttsubAiTalk.md](../OttsubAiTalk.md#pt-pt-review-20261019)에 기록했다. 제품/정식 테스트/manifest 수정은 없다. 원본 검수 산출물을 수정하지 않고 출력 경로·산출물 보존만 바꾼 재실행 사본으로 **9/9 통과**를 확인했다. [최종 JSON](../artifacts/qa/pt-pt-review-20261019/result.json)·[stdout](../artifacts/qa/pt-pt-review-20261019/audit.stdout.log)·[8개 정식 파일 stdout](../artifacts/qa/pt-pt-review-20261019/formal-logs/)·[320px 학습 카드](../artifacts/qa/pt-pt-review-20261019/portuguese-learning-expanded-320.png)를 보존한다.

13언어 실제 초기화/정렬·수동 변경/fixture reload 13/13, DOM 63/title 30/ARIA 16 불일치 0, 3폭·4버튼 Range 폭, RTL→LTR·provider locale·주 키보드 +100ms/보조 wheel -100ms를 확인했다. 직접 실행한 정식 파일은 runtime 3개 **75/75**, dropdown **4/4**, browser 4개 **23/23·38/38·7/7·20/20**다. 실제 unpacked 확장 저장/복원이 마지막 20/20에 포함된다. 전체 **105/105는 아래 기존 .56 실행을 인용**하며 이번 전체 재실행으로 세지 않는다.

첫 실행은 Round 1–7/9 통과 후 Round 8의 실제 확장 Chromium이 실행 직후 종료됐다. [첫 실패 결과](../artifacts/qa/pt-pt-review-20261019/attempt-1/result.json)·[로그](../artifacts/qa/pt-pt-review-20261019/attempt-1/audit.stdout.log)와 프로필을 남기고 제한 환경 밖에서 같은 검수를 재실행해 최종 9/9를 확인했다. 정확한 OS 종료 원인을 확정하거나 제품 결함으로 집계하지 않는다. 모든 작업 파일·로그·임시 경로·명시적 확장 프로필은 OTTSub 안에 두었다.

REVIEW와 archive의 기존 판정/답변 **11개**를 이관했다. 제목 단계·상대 링크만 새 위치에 맞췄고, 이관 전 REVIEW는 byte 동일한 archive 사본으로 남겼다. 기존 archive 문서는 그대로다. 본문 누락/기존 앵커/문서 링크·152개 실행/검사 입력·6 ZIP·Gemini 원본 산출물 보존·diff-check는 [최종 검증 JSON](../artifacts/qa/pt-pt-review-20261019/verification.json)을 따른다.

OS 로케일 설정 변경·원어민 전수·실제 Netflix/DRM·스크린리더 발화·다른 OS 실행은 이번 범위가 아니다. 기존 실기 보류와 동기화 과제 제외를 유지한다.

## 2026-10-19 포르투갈어(포르투갈) 메뉴 — .56

포르투갈용 `pt-PT` 사전/메타데이터와 표시 이름 `Português (PT)`를 추가했다. 전체 로컬 QA **105/105(179.8초)**를 통과했다. syntax 45 / runtime 25 / legacy 15 / browser 20 suites이며 suite 생략·실행 중 소스 변경은 없다. 입력 hash는 기존 151개+새 메타데이터 1개인 **152개**다. [전체 실행 결과](../artifacts/qa/2026-10-19T12-07-35-671Z-29504/summary.json), [최종 보존·링크 대조](../artifacts/qa/portuguese-20261019/verification.json)를 따른다.

언어/정렬/DOM **23/23**, 배치 **117/117**(13언어×3폭×3상태), 실제 확장 저장/복원 **20/20**, Mac/Windows OS 입력을 모의한 단축키·휠 **38/38**, Hindi/CC 회귀 **7/7**을 통과했다. 세 runtime 집중 검사도 75/75였다. 패키지 경계 6개 중 5개 통과·1개는 보존된 이전 .54 ZIP과 현재 소스가 다른 조건의 의도한 skip이다. 새 ZIP을 생성하지 않았다.

최종 320px 캡처: [포르투갈어 패널](../artifacts/qa/2026-10-19T12-07-35-671Z-29504/portuguese-panel-320.png), [전체 배치](../artifacts/qa/2026-10-19T12-07-35-671Z-29504/review-pt-PT-320.png), [실제 확장 저장 복원](../artifacts/qa/2026-10-19T12-07-35-671Z-29504/portuguese-extension-panel.png). 현재 증거 폴더는 [portuguese-20261019](../artifacts/qa/portuguese-20261019/)다.

사전/문자 검사: pinned·shared Gate 1/2/OTTSub 프로필 및 실제 shared Gate 12 통과. **13언어×192키**, 이름 **51/75**, 설명 **112/132** UTF-16 code units. 비허용 문자 8종 주입은 모두 거부했다. 기존 12사전/메타데이터·기존 ZIP 6개 해시는 같다.

초기 브라우저 검사에서 동적으로 준비 상태로 바뀐 노드를 정적 초기 문구와 비교한 검사 오류 1건을 수정했다(제품 오류 아님). 해당 검사 재실행 23/23. 초기 320px 캡처에서 `Secundárias` 버튼의 줄임표 표시도 발견해 `Secund.`로 줄였고, 버튼 내부 padding을 뺀 실제 텍스트 Range 폭을 검사하도록 보강했다. 최초 실패/캡처도 증거 폴더에 보존했다.

검증 범위는 오프라인 Windows Chromium과 가상 Chrome UI 언어 입력, 실제 unpacked 확장 저장/리로드다. OS 로케일 자체 변경·포르투갈 원어민 전수 감수·실제 Netflix/DRM·스크린리더 실발화·다른 OS 성공을 뜻하지 않는다. 사용자가 제외한 기기 간 동기화는 향후 확인 과제로 남기지 않는다. 기존 자동 회귀 검사는 보존했다.

## 2026-10-19 공유용 QA 입력 정리 — .55 유지

GitHub 공유 직전 index 대조에서 직전 QA의 152개 hash 중 **scripts/__pycache__/package-store.cpython-314.pyc 1개가 생성 캐시**임을 확인했다. 이 파일을 Git에 포함하지 않고 run-qa의 수집기에서 __pycache__ 디렉터리와 .pyc를 제외했다. Python import가 캐시를 갱신해도 실제 검사 입력이 바뀐 것으로 집계하지 않게 했다. Git의 기존 캐시 제외 규칙은 유지한다. 아래의 152개 기록은 당시 수집 결과이며, 이번 실제 검사 입력은 **151개**다.

변경 후 **전체 QA 105/105, 176.3초** 통과: syntax 45/45, runtime 25/25, legacy 15/15, browser 20/20, suite 생략/실행 중 소스 변경 0건. [결과](../artifacts/qa/2026-10-19T11-52-36-167Z-28040/summary.md), [원본 JSON](../artifacts/qa/2026-10-19T11-52-36-167Z-28040/summary.json). 제품/manifest/기존 정식 검사는 그대로이며 이번 실행/검사 변경은 run-qa의 캐시 제외뿐이다. 캐시를 뺀 151개 hash는 공유 대상 index와 newline 정규화를 고려해 대조한다.

CDN 시험의 공개 self-signed PEM 2개는 기존 실행에서 사용한 같은 bytes이며 정확한 경로로 Git에 포함했다. 패키지 경계 검사도 6개 중 5개 통과·기존 .54 ZIP 동등성 비교 1skip을 유지한다. 이 skip과 실제 두 기기/Netflix/다른 OS 보류는 전체 suite 통과와 구분한다. Git 사전/완료 검증은 로컬 artifacts/qa/git-push-20261019에 보존하며 캐시/원본 진단/ZIP/프로필을 올리지 않는다.

## 2026-10-19 GitHub 공유본 확인 — .55 유지

현재 개발본 푸시 요청에 따라 2026-10-18T01-56-23-971Z-17660의 **전체 105/105와 152개 실행/검사 파일 해시가 현재와 모두 같음**을 확인했다. 제품 변경이 없어 전체 검사를 중복 실행하지 않는다. 원격 main과 로컬 기준 commit 1a6a101은 fetch 후 차이가 없었다. Git에는 실행 파일·현재 문서·정식 테스트/도구·등록 자료를 포함하고 archive/artifacts/dist와 ZIP/프로필/원본 진단은 제외한다.

공유 시 누락되던 tests/fixtures/cdn-network/server-cert.pem과 server-key.pem을 정확한 두 경로만 .gitignore에서 허용했다. 이 fixture의 README는 원래부터 deliberately public test key라고 명시한다. Node X509/crypto로 CN=OTTSub offline test only인 self-signed 인증서와 키 일치를 확인했다. 기존 105/105가 사용한 동일 bytes이며 서비스 인증 정보나 신뢰 인증서가 아니다. tests 폴더는 store ZIP에서 제외한다. 새 PC의 오프라인 CDN 검사가 파일 누락으로 실패하지 않도록 포함하며 다른 PEM/key 제외 규칙은 유지한다.

이번 공유는 개발판 확장 ID 고정 변경이 아니다. 현재 manifest에는 key가 없고 실제 두 기기 cloud 검사는 사용자 보류다. staged 파일 목록·시험 fixture/제품 불변·외부 제외 경로·Git whitespace·원격 commit 일치 확인은 로컬 artifacts/qa/git-push-20261019/에 기록한다. 이 증거와 이전 raw QA는 GitHub에 올리지 않는다.

## 2026-10-18 동기화 정식 자동검사 편입 — .55 유지

사용자는 **실기 실험은 나중에 하고 계속 진행**하라고 했다. 실제 두 기기 Chrome cloud 단계는 이제 명시적 사용자 보류이며 계정/기존 사용자 브라우저를 조작하지 않는다. 현재 .55의 제품 코드는 그대로 두고, 아래 실행 전 계획에 따라 일회성 동기화 probe를 [정식 browser 검사](../tests/test_settings_sync_browser.cjs)로 편입했다. [run-qa](../scripts/run-qa.cjs)의 browser 목록에 1개를 추가했다.

**전체 QA 105/105 suites, 177.6초 PASS**: syntax 45/45, runtime 25/25, legacy 15/15, browser **20/20**이다. 104→105는 새 동기화 suite 1개 차이이며 기존 19개 browser suite를 유지했다. [전체 결과](../artifacts/qa/2026-10-18T01-56-23-971Z-17660/summary.md), [원본 JSON](../artifacts/qa/2026-10-18T01-56-23-971Z-17660/summary.json). suite 생략/실행 중 소스 변경은 없다. 소스 해시는 **152개**이며 기존 151개 중 runner만 바뀌고 새 tests/test_settings_sync_browser.cjs가 추가됐다. 제품/manifest/.55 build와 ZIP 6개는 그대로다. 기존 Python 패키지 동등성 1skip은 보존한 .54 ZIP과 .55 개발 소스의 차이이며 이번 변경과 별개다.

**새 suite 12/12, UI 비교 15회, test relay 20회 PASS**다. [집중 stdout](../artifacts/qa/settings-sync-formal-20261018/focus-stdout.log)과 전체 QA의 test_settings_sync_browser.cjs.log는 같은 표준 JSON 형식이다. 과거 artifacts/before.json을 읽거나 특정 .55 결과의 151개 목록에 의존하지 않고 매 실행 현재 src/popup/_locales/icons/manifest를 읽는다. 실행별 고유 settings-sync-<time>-<pid> 하위에 runtime/프로필/result/events를 보존한다. 이미 존재하는 증거를 덮어쓰지 않는다. 성공/실패 case 이름·errors·실패 코드·원본 snapshot과 기대/실측 UI를 기록하며 생성한 시험 브라우저만 닫는다.

**검사 자체의 음성 대조군도 정상 검출:** 별도 폐기 가능한 runtime 사본에서만 incoming sync change 처리를 끊었다. 정식 검사 원본은 그대로 실행해 첫 A→B 전달에서 **의도한 FAIL, exit 1**을 받았으며 해당 case 이름·실패한 값·A/B snapshot을 남겼다. [음성 대조군 stdout](../artifacts/qa/settings-sync-formal-20261018/negative-stdout.log), [변형 위치](../artifacts/qa/settings-sync-formal-20261018/negative-mutation.json), [exit 코드](../artifacts/qa/settings-sync-formal-20261018/negative-exit.txt). 이 의도적 실패는 제품 결함이나 전체 QA 실패가 아니며 숨기지 않고 보존한다. 루트 제품 소스는 바꾸지 않았다.

기존의 전달/충돌/분리 도착/닫힌 수신자/호출 실패 복구 조건과 경계는 [직전 보완 결과](#2026-10-18-두-기기-설정-동기화-보완--55-유지)를 따른다. 실제 native local/sync/onChanged를 사용하지만 transport는 relay이고 --disable-sync인 계정 없는 프로필이다. 실제 두 기기/Chrome 서버 전파, OS 네트워크 offline, 실제 quota 고갈 검증으로 확대하지 않는다. 사용자 보류를 해제하거나 실제 계기판/계정 상태를 읽지 않았다.

[최종 검증](../artifacts/qa/settings-sync-formal-20261018/verification.json)은 집중/전체/음성 대조군, 152개 최종 소스 해시, 제품/ZIP 불변, 변경 범위, 보류 문구와 문서 링크를 대조한다. 제품 수정 필요성은 발견하지 않았으며 기존 실기/발화/다른 OS 보류를 유지한다.

## 2026-10-18 동기화 정식 자동검사 편입 계획 — 실행 전

사용자는 실기 실험을 나중으로 미루고 계속 진행하라고 했다. 실제 두 기기 Chrome cloud 단계는 보류한다. 계정/사용자 브라우저/다른 OS의 보류도 유지한다. 현재 .55에서 통과한 일회성 12개 시나리오를 tests/test_settings_sync_browser.cjs로 옮겨 이후 전체 QA에 포함한다.

1. 기존 probe의 실제 확장 local/sync API·수정 없는 popup·relay 조건을 유지한다. 과거 artifacts/before.json에 의존하지 않고 매 실행 현재 제품 파일을 읽는다.
2. OTTSUB_QA_ARTIFACT_DIR 아래에 실행별 고유 하위 폴더/runtime/시험 프로필/원본 결과를 만든다. 기존 결과를 덮어쓰지 않으며 끝날 때 생성한 브라우저만 닫는다. 표준 JSON 결과는 passed/total/cases/errors를 제공한다.
3. 실패 시 해당 case 이름과 원본 snapshot·event를 남기고 프로세스 실패 코드를 반환한다. source 변경 검증과 실제 UI assertion 15회를 유지한다. timeout을 늘려 실패를 숨기지 않는다.
4. 기존 run-qa의 browser 목록에 한 suite를 추가한다. 개별 12/12 후 전체 회귀를 확인한다. 예상 전체는 104→105 suites, browser 19→20이다. 제품/manifest 변경은 계획하지 않는다.
5. 실제 두 기기/Chrome 서버 통과와 합성 relay를 구분한 결과를 현재 6개 문서와 인계 안내에 기록한다. 기존 실행/프로필·6 ZIP을 보존한다.

## 2026-10-18 두 기기 설정 동기화 보완 — .55 유지

사용자의 계획 작성/착수 요청에 따라 **아래 실행 전 계획을 먼저 저장**하고 로컬에서 가능한 보완 검사를 수행했다. 제품/정식 테스트/manifest는 **1.3.5-local-taiwan-ui-20261018.55 그대로**다. 실제 물리 두 기기·Chrome cloud transport는 아직 미검증이다. 사용자가 재개한 것은 이 설정 동기화 범위이며 Netflix 재생/발화/다른 OS 보류는 유지한다.

**최종 로컬 12/12 PASS**, 실제 화면 비교 **15회**, 시험 payload 전달 **20회**, pageerror **0건**. [시험 script](../artifacts/qa/cloud-sync-20261018/probe.cjs), [최종 결과](../artifacts/qa/cloud-sync-20261018/runs/ui-confirmed/result.json), [stdout](../artifacts/qa/cloud-sync-20261018/ui-confirmed-stdout.log), [최종 보존/링크 검증](../artifacts/qa/cloud-sync-20261018/verification.json). 첫 실행 before도 12/12였으며 색상/학습/잠금의 실제 DOM 값 assertion과 원본 UI/event 기록을 보강해 ui-confirmed를 실행했다. 첫 실행을 실패로 숨기거나 timeout을 늘린 재시도가 아니다. 첫 script 사본·결과·로그·프로필은 모두 보존했다.

Windows x64 / Node 24.13.0 / Chromium **151.0.7922.34**, 별도 영속 프로필 A/B를 사용했다. 최종 두 프로필의 동일 unpacked ID는 `loadldknkodellmlplioibdgecjkmknm`이며 스토어 ID와 구분한다. runtime의 **실행 파일 58개**는 원본과 byte 해시가 같고 manifest는 원본에서 tools/local-diagnostics 2개 선언만 제외했다. version_name/권한·실제 제품 로직은 유지했다. 각 profile의 실제 Chrome local/sync/onChanged와 수정 없는 실제 popup을 사용했으며 앱의 queue/flush 경로를 호출했다. 계정 없는 새 시험 프로필과 `--disable-sync`, `--disable-background-networking`, HTTP(S) abort를 사용했다.

| 검사 | 결과·판정 |
|---|---|
| A→B 대표 12설정 | 번체 UI·주/보조 싱크·크기/색상·가림/hover pause·잠금·싱크 대상의 local 값과 실제 DOM/ARIA/checked 표시를 비교했다. |
| B→A 수동 변경 | 실제 메뉴 select에서 tr 선택·색상 변경을 전달하고 열린 수신 popup의 선택/언어/색상 반영을 확인했다. |
| 다른 항목 동시 오프라인 편집 | A의 크기와 B의 색상을 독립 payload로 전달해 다른 항목을 되돌리지 않고 함께 보존했다. |
| 같은 항목·서로 다른 변경 번호 | A에서 두 번, B에서 한 번 편집한 뒤 늦게 도착한 낮은 revision이 값을 되돌리지 못했다. |
| 같은 항목·동일 변경 번호 A 우선 재연결 | 제출된 revision/origin의 계약상 승자와 양쪽 local/sync를 비교해 수렴했다. |
| 같은 항목·동일 변경 번호 B 우선 재연결 | 반대 전달 순서에서도 동일 동점 규칙에 따라 수렴했다. |
| 중복/역순 전달 | 새 값을 먼저, 옛 값을 중복 전달해 새 값 보존과 시험 프로필의 storage event가 멈추는 구간을 확인했다. |
| raw 먼저·revision 나중 | raw 단독 도착은 UI를 바꾸지 않고 matching metadata 수용 뒤 실제 UI가 바뀌었다. |
| revision 먼저·옛 raw 나중 | local/UI는 canonical 새 값을 유지했다. 분리 도착으로 sync raw가 잠시 어긋난 상태도 보존했고 패널 재열기 때 복구됨을 확인했다. |
| 닫힌 수신 패널 | sync에 도착한 값/revision을 다음 패널 시작 때 local/UI로 반영했다. |
| 종료된 수신 브라우저 | 종료 중 보류한 payload를 재시작한 수신자의 sync로 전달해 UI 반영, 다시 재시작 후 값 보존을 확인했다. |
| sync 기록 호출 실패 | 한 page의 sync.set 예외를 주입해 local 새 값 보존·패널 재시작 후 재전달과 다른 프로필 UI 반영을 확인했다. |

**검증 모델의 한계:** offline은 두 기기의 실제 네트워크를 끊은 것이 아니라 relay를 보류한 상태다. 전달은 수신 profile의 실제 sync.set에 원격 payload를 주입한다. per-key payload의 raw/revision 동시·분리·역순은 스트레스 입력 가정이며 Chrome cloud가 이 순서로 전송한다는 측정이 아니다. 기록 실패는 한 page의 API 호출 예외 주입으로 실제 quota를 소모한 검사가 아니다. 이 경우 재시작 재전달은 확인했지만 열린 채 모든 실패를 자동 재시도한다는 보장은 없다. 기록된 전달 시간은 로컬 API/시험 도구 시간이며 실제 cloud 전파 시간으로 쓰지 않는다.

최종 15회 UI 비교는 result의 uiChecks에 기대값/실측값을 함께 남겼다. 실행별 원본 local/sync snapshot·revision/origin, 20개 payload와 시간, 각 시험 브라우저의 onChanged event는 같은 run 폴더에 있다. 실패가 재현되지 않아 제품 수정·정식 테스트 추가·전체 QA 중복 실행은 하지 않았다. 현재 **151개 소스 해시**는 기존 전체 104/104 통과본과 같고 기존 ZIP 6개도 보존했다. 이전 .45 강제 종료 검사는 당시 조건의 결과로 유지하며 이번에 강제 종료를 새로 했다고 설명하지 않는다.

실제 두 기기 단계의 선행 조건·A↔B·충돌·offline·종료/복귀 절차는 아래 계획 5단계다. 현재 도구에 그 두 실행 기기가 연결돼 있지 않으며 Google 계정 접근 금지를 우회하는 환경을 만들지 않았다. **로컬 보완은 완료, 실제 cloud 단계는 환경 미확보로 미실행**이다.

## 2026-10-18 두 기기 설정 동기화 검사 계획 — 실행 전

사용자가 설명한 계획의 작성과 착수를 요청했다. 현재 제품은 1.3.5-local-taiwan-ui-20261018.55다. 기존 .45의 독립 프로필 relay·재시작/강제 종료는 완료 이력이며 같은 조건을 반복하는 대신 현재 12언어 코드에서 전달 경계/오프라인 충돌/닫힌 수신자 조건을 보완한다. 실행 전 해시·문서/관련 소스 사본은 `artifacts/qa/cloud-sync-20261018/before.json`과 before/에 보존한다.

### 단계와 판정 기준

1. **환경/기준 고정:** 현재 연결된 실행 도구는 로컬 Windows 호스트다. 새 시험용 Chromium 프로필 A/B와 동일 runtime 경로/확장 ID를 사용하고 실제 사용자 프로필이나 계정에 접근하지 않는다. src/popup/_locales/icons를 현재 코드에서 복사하고 로컬 진단 선언만 제외한 manifest로 로드한다. 파일별 해시와 두 ID 일치를 기록한다.
2. **현재 코드의 실제 저장/화면 연결:** Chrome local/sync API와 onChanged는 실제 확장 API를 사용한다. UI 언어·주/보조 싱크·모양·학습 설정의 양방향 전달을 확인하며 선택/화면 값도 저장값과 대조한다. 350ms는 앱의 묶음 기록 지연이며 실제 cloud 전달 시간 상한으로 취급하지 않는다.
3. **새 전달 경계 검사:** 다른 항목 동시 편집, 동일 항목 양쪽 오프라인 편집 후 서로 다른 순서로 재연결, 중복/역순 전달, raw 값과 revision 분리 도착, 닫힌 수신자에게 도착한 뒤 재열기, 동기화 기록 실패 후 재시작 재전달을 검사한다. 각 단계의 local/sync 원본 snapshot·revision·실제 UI·전달 순서를 남긴다. 논리 변경 번호/동점 규칙에 맞는 수렴과 다른 항목 보존을 판정한다.
4. **재현 시 수정:** 검사 도구 오류와 제품 오류를 구분하고 실패 원본을 보존한다. 제품 결함이 재현되면 최소 수정과 결정적 회귀부터 수행하고 필요한 전체 QA까지 진행한다. 단순 환경 미확보를 제품 실패로 처리하지 않는다.
5. **실제 두 기기 cloud 단계:** 같은 확장 ID/시험 빌드, 이미 Chrome Sync가 설정된 두 기기에 접근 가능한 환경이 선행 조건이다. A→B/B→A 전파 시간과 실제 화면, 다른 항목/같은 항목 충돌, 기기 네트워크 단절·복귀, 수신 브라우저 종료·재시작을 반복하고 원본 설정을 복원한다. 관찰 시간/횟수를 기록하며 로컬 relay의 통과를 이 단계 통과로 집계하지 않는다. 현재 해당 두 실행 기기는 연결돼 있지 않고 계정 접근 금지는 유지한다. 로그인/계정 연결을 요구하거나 현재 사용자의 계정 상태를 조회하지 않는다.

### 도구·범위

이번 로컬 단계는 `artifacts/qa/cloud-sync-20261018/`의 새 시험 runtime/프로필과 실제 확장 저장 API를 사용한다. 시험 도구가 전달을 중단·재개하고 실제 sync 저장소에 원격 payload를 주입하므로 Chrome 서버, 실제 네트워크 offline 처리, 물리 두 기기 검증이 아니다. 이 모델의 전송 순서 가정을 결과에 명시한다. Chrome은 [공식 storage.sync 설명](https://developer.chrome.com/docs/extensions/reference/api/storage#sync)상 offline 변경을 저장하고 online 시 동기화를 재개한다. 로컬 기록 성공과 실제 원격 도착은 별도 증거다.

넷플릭스 재생/스크린리더/다른 OS의 보류는 유지한다. 파일은 모두 프로젝트 안에 두고 기존 ZIP과 과거 프로필/검사 원본은 보존한다. 이 계획은 새 ZIP·계정 조작·게시 지시가 아니다.

## 2026-10-18 Gemini 대만 번체 검수 후속 — .55 유지

제품/정식 테스트/manifest는 **1.3.5-local-taiwan-ui-20261018.55** 그대로다. 원문은 [archive 전사](../archive/docs/reviews/2026-10-18-zh-tw/gemnisaying-original.md), 주장별 인정/정정은 [REVIEW](../OttsubAiTalk.md#gemini-대만-번체-9라운드-보고서-대조--2026-10-18)에 모았다. 원본 audit 3파일의 크기/해시를 보존하고 원본과 SHA256이 같은 script를 별도 `zh-tw-review-20261018` 폴더에서 재실행했다.

**동일 script 재실행 9/9 PASS**, 원본과 결과 JSON 내용도 동일하다. [재실행 결과](../artifacts/qa/zh-tw-review-20261018/result.json), [stdout](../artifacts/qa/zh-tw-review-20261018/rerun-stdout.log). Windows Chromium **151.0.7922.34**에서 pinned/shared audit와 실제 Gate12+6종 음성 대조군, DOM 63/30/16·3폭·RTL/LTR·키보드/휠·정식 runtime/browser 호출을 재현했다. stderr는 Git CRLF→LF 안내이며 실행 실패가 아니다. 기존 원본의 script/result/screenshot은 덮어쓰지 않았다.

정식 호출 출력은 [formal-logs](../artifacts/qa/zh-tw-review-20261018/formal-logs)에 별도 보존했다. runtime **71/71**, dropdown **4/4**, language names **20/20**, platform shortcuts **36/36**, Hindi/track kind **7/7**, 실제 unpacked extension side-panel **19/19**다. preload `capture.cjs`는 child stdout만 저장하고 원본 script의 재실행용 suite-runs 삭제 경로가 이 새 작업 폴더 안인지 검사한다. 제품/정식 script/원본 probe를 고치지 않았다.

**추가 실제 초기화 12/12 PASS:** [supplement.cjs](../artifacts/qa/zh-tw-review-20261018/supplement.cjs), [결과](../artifacts/qa/zh-tw-review-20261018/supplement.json). 원본 Round4는 12언어 loop에서 comparator를 다시 쓰므로 이 부분을 보완했다. Arabic/Bengali/Traditional Chinese/English/German/Hebrew/Hindi/Japanese/Korean/Malay/Spanish/Turkish 각각 별도 새 page의 Chrome UI 입력으로 넣고, **수정 없는 실제 popup 초기화**의 첫 행/12행 순서·자동 선택을 확인했다. 각 page에서 수동 선택을 다른 언어로 변경하고 저장 fixture snapshot을 reload해 맨 위 시스템 행 고정과 선택 복원을 함께 검사했다. 기대 목록만 독립 작성했으며 정렬 함수 재구현/직접 DOM 재정렬은 없다. browser pageerror 0건이다.

같은 보완 script에서 잘못 확대된 범위도 실증했다. resolver는 나열한 6태그 외 Hant-HK/Hant-MO/TW private-use도 지원한다. 간체 정규식 목록의 `设置`는 검출되지만 미지정 `问题`는 검출되지 않는다. 제공자 예시를 zh-Hans labelLocale로 선언하면 거절하고 zh-TW로 선언하면 그 Han 원문을 채택한다. 이는 현재 명시적 locale 신뢰 계약이며 한자 내용/정서법 필터를 구현했다는 뜻이 아니다. 대만 어휘 전수 인증으로 확대하지 않는다.

[원본 펼친 학습 카드](../artifacts/qa/zh-tw-audit-20261018/taiwan-learning-expanded-320.png)를 직접 확인했다. 기존 native select의 긴 상태 안내 축약을 전체 문구 무잘림으로 설명하지 않는다. [최종 검증](../artifacts/qa/zh-tw-review-20261018/verification.json)은 원본 3파일·동일 script·재실행 결과·이번 child 로그·151개 소스·6 ZIP·문서 링크를 대조한다. 현재 소스는 [기존 전체 104/104 QA](../artifacts/qa/2026-10-17T18-32-35-207Z-32148/summary.json)와 전부 같아 이번에는 전체 실행을 중복하지 않았다. 기존 패키지 동등성 1skip 경계도 유지한다.

실제 OS locale 변경·실서비스 Netflix/DRM·원어민 전수·실제 발화·다른 OS·물리 두 기기 cloud Sync는 이번 자동 검증으로 확인하지 않았다. 보류 지시는 유지하며 제품 변경이나 새 할 일을 만들어 넣지 않는다.

## 2026-10-18 대만 번체 메뉴와 언어 정렬 — .55

현재 개발 build **1.3.5-local-taiwan-ui-20261018.55**는 번체 중국어(대만) `zh-TW`/Chrome metadata `zh_TW`와 언어 목록 정렬을 추가한다. 제품 version 1.3.5는 유지한다. 언어 선택지는 시스템 기준 언어를 첫 행에 두고 나머지를 고정 영어 이름순으로 정렬한다. Chrome `getUILanguage()`가 지원하는 언어면 우선하고, API 부재/오류/미지원 시 navigator 선호 언어, 최종 영어로 대체한다. 이 API는 **브라우저 UI 언어**이며 OS 설정 직접 조회가 아니다. 저장한 수동 선택은 자동 기본값보다 우선하고 수동 선택을 맨 위로 재정렬하지 않는다.

영어 정렬명은 Arabic, Bengali, Chinese (Traditional), English, German, Hebrew, Hindi, Japanese, Korean, Malay, Spanish, Turkish다. 표시 이름은 각 언어 원어를 유지한다. 한국어 시스템이면 ko가 첫 행이고 나머지는 위 영어 이름순이다. `zh-TW`/`zh_TW`/`zh-Hant`/`zh-Hant-TW`를 번체 UI로 정규화하고 generic `zh`/`zh-CN`/`zh-Hans`를 번체로 추측하지 않는다. Netflix 자막 트랙의 코드·순서·CC/SDH·다운로드 선택은 별도 계약 그대로다.

| 실행 | 결과 | 확인 범위 |
|---|---|---|
| 전체 정식 QA | **104/104 suite, 167.0초** | syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19; suite 생략/실행 중 소스 변경 없음 |
| 집중 runtime 3파일 | **71/71** | 언어 정책·메시지/metadata 누락 음성 대조군·12언어 실제 HUD/단축키 |
| 언어 이름/정렬 browser | **20/20** | Chrome UI와 navigator를 다르게 지정한 우선순위, 미지원 대체, 정확한 12행 순서, 수동 선택/리로드, RTL→번체 LTR, provider/CC |
| 레이아웃 browser | **108/108** | 12언어 × 320/360/430px × 3상태, 실제 펼친 학습 카드·兩者 라벨 |
| 실제 unpacked extension side-panel | **19/19** | 실제 local 저장/재열기, 언어 순서·선택 보존, 12언어 dialog 키보드/포커스 |
| OS 단축키/휠 browser | **36/36** | 12언어와 실제 키보드/휠 송신/ARIA |
| Hindi/track kind browser | **7/7** | 12언어 행렬과 기존 track/CC identity |
| 정식 패키지 경계 | **6개 중 5개 통과·1개 의도된 skip** | 기존 .54 ZIP을 보존하므로 최신 소스와 ZIP 동등성 비교만 skip; 전체 suite는 PASS |

[전체 summary](../artifacts/qa/2026-10-17T18-32-35-207Z-32148/summary.md), [원본 JSON](../artifacts/qa/2026-10-17T18-32-35-207Z-32148/summary.json), [집중 실행 결과](../artifacts/qa/taiwan-20261018/focus-results.json), [언어 감사](../artifacts/qa/taiwan-20261018/language-audit.json), [최종 보존/링크 검증](../artifacts/qa/taiwan-20261018/verification.json). 전체 실행의 **151개 소스 해시**를 최종 파일과 대조한다. Windows Chromium **151.0.7922.34**에서 수행했다. 집중 검사도 첫 실행에 통과했으며 실패를 숨기기 위한 재실행/timeout 확대는 없다.

12사전 모두 192키·토큰·채택 profile을 통과하고 번체 이름/설명은 **28/41 UTF-16 code units**다. 실제 shared Gate12를 직접 import하여 사전·metadata 문자 혼입 0건을 확인했다. 정식 audit는 기존 pinned gate1/gate2/OTTSub profile 경계를 유지한다. Gate12의 Han 허용만으로 번체/간체 구별이나 대만 어휘의 원어민 인증을 주장하지 않는다. 기존 11사전/metadata는 작업 전 snapshot과 같으며 1.3.0~1.3.5 ZIP 6개도 동일하다.

[번체 320px 펼친 카드](../artifacts/qa/taiwan-20261018/focus/test_language_names_browser/taiwan-panel-320.png), [320px 상태 화면](../artifacts/qa/taiwan-20261018/focus/test_l10n_layout_browser/review-zh-TW-320.png), [실제 확장 패널](../artifacts/qa/taiwan-20261018/focus/test_side_panel_browser/taiwan-extension-panel.png)을 직접 확인했다. 관찰한 Windows 글꼴에서 문자 결합/표시와 화면 배치는 정상이다. native select의 긴 상태 안내는 기존 브라우저 동작대로 상자 안에서 줄여 표시될 수 있다. 시스템 언어가 다를 때의 우선순위는 주입한 API/언어 입력으로 검증했으며 실제 OS 언어 설정을 변경한 검사가 아니다.

번체 provider 이름은 명시적인 `zh-TW`/`zh-Hant` locale 근거와 Han 문자가 함께 있을 때만 채택한다. Han 문자만으로 간체를 번체로 판정하지 않는다. 기존 `lang_zh`는 기존 `zh-Hans` fallback 자막의 **簡體中文**이며 대만 자막을 새로 만들어 넣지 않았다. 실제 Netflix/DRM 재생·원어민 전수·실제 스크린리더 발화·다른 OS·물리 두 기기 Sync는 이번 결과에 포함하지 않는다. 기존 보류는 유지하고 새 ZIP/등록 이미지 제작은 실행하지 않았다.

## 2026-10-18 1.3.5 배포 준비 — .54

사용자가 최신 ZIP과 터키어·벵골어 스토어 등록 자료를 요청했다. 마지막 제출 1.3.4/.51보다 큰 **1.3.5**로 준비했고 개발 build는 **1.3.5-local-store-20261018.54**다. .53 제품 실행 로직/11사전/metadata는 유지하며 manifest version/version_name만 변경했다. 기존 ZIP 보존을 위해 정식 검사 3개의 명시적 허용 버전에 1.3.4를 추가했다. 권한·Netflix 요청/원본 선택·트랙 identity·시계 guard는 그대로다.

**업로드 ZIP:** [ottsub-store-1.3.5.zip](../dist/ottsub-store-1.3.5.zip), **58파일·164,532 bytes·11언어**, SHA256 `327f11d8b04b0058bf19618c5f2d97e1685f52548c3ca148efe4c858cf82102b`. 허용된 src/popup/_locales/icons와 정리한 루트 manifest만 포함한다. 로컬 진단 2개·version_name·tests/docs/scripts·PEM 개인 키를 제외했고 실제 ZIP과 현재 패키징 입력/추출 runtime의 파일별 일치를 확인한다. [패키지 보고서](../dist/ottsub-store-1.3.5.package-report.json).

**전체 로컬 QA: 104/104 suite, 169.1초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19) 통과. [전체 결과](../artifacts/qa/2026-10-17T18-11-44-383Z-31736/summary.md), [원본 JSON](../artifacts/qa/2026-10-17T18-11-44-383Z-31736/summary.json). 소스 해시는 **150개**이며 suite 생략/실행 중 소스 변경은 없다. 이번에는 새 1.3.5 ZIP과 현재 패키징 입력이 같으므로 Python 패키지 경계 **6/6, skip 0개**다.

**실제 패키지 로드 10/10:** ZIP에서 추출한 확장을 별도 Chromium 151.0.7922.34 프로필에 로드했다. 실제 manifest/version/최소 권한·11언어 목록, ar→tr/he→bn LTR 전환과 실제 extension local storage 저장/재열기, 후원 링크, 상태 안내 dialog의 Enter/Escape·포커스 복귀를 검사했다. [smoke 결과](../artifacts/releases/1.3.5/smoke.json). 외부 HTTPS 요청을 차단한 검사이며 실제 Netflix/DRM·물리 두 기기 cloud Sync가 아니다.

**신규 등록 자료 2언어·이미지 6장:** [Türkçe(tr)](../store_assets/tr/README.md), [বাংলা(bn)](../store_assets/bn/README.md)에 이름/짧은 설명·상세 설명·1280×800 RGB JPEG 각 3장과 제작 원본/이미지 검증 JSON을 준비했다. 이름/설명은 ZIP의 locale 메시지와 같고 tr 51/106, bn 50/94 UTF-16 code units다. ZIP의 실제 HTML/CSS/JS와 별도 예시 데이터를 사용해 촬영했다. 두 언어 LTR/언어 선택·−0.1s 싱크·학습 blur/hover pause·화면 넘침/브라우저 오류를 검사하고 6장을 직접 확인했다. 이미지 하단은 예시 데이터임을 명시한다. 원어민 전수 검수·실제 작품 재생/심사 승인 증거로 확대하지 않는다.

기존 he/ms/hi 상세 설명의 메뉴 목록도 11언어로 갱신했고 기존 이미지/메타데이터/과거 이미지 검증 기록은 보존했다. 공통 캡처 helper는 bn/tr를 허용하도록 확장했다. [언어 감사](../artifacts/releases/1.3.5/l10n-audit.json), [최종 검증](../artifacts/releases/1.3.5/verification.json)은 패키지·이미지·소스·링크·변경 범위와 기존 1.3.0~1.3.4 ZIP 보존을 대조한다.

Google 계정 접근·개발자 콘솔·직접 업로드/심사 신청은 하지 않았다. [등록 지침](../store_assets/STORE_GUIDE.md)의 tr/bn 선택과 자료를 사용한다. 실제 Netflix·스크린리더 발화·Mac/Linux/ChromeOS·두 기기 cloud Sync 보류는 유지한다.

## 2026-10-18 Gemini 터키어 검수 후속 — .53 유지

사용자가 제공한 6라운드 보고서와 스크립트/JSON/캡처를 대조했다. 검수 모델 이력과 항목별 판정은 [REVIEW](../OttsubAiTalk.md#gemini-터키어-6라운드-보고서-대조--2026-10-18)를 따른다. **새 제품 오류는 발견되지 않았으며 제품/정식 테스트/manifest는 그대로다.**

- 원본 조사 파일 **10개**의 크기/SHA256과 변경 전 문서·기존 검증 결과를 [작업 전 기록](../artifacts/qa/turkish-review-20261018/before.json)에 보존했다. 스크립트는 같은 깊이의 별도 QA 폴더에 byte 동일하게 복사했으며 원본 결과/이미지는 덮어쓰지 않았다.
- **동일 스크립트 재실행 6/6, Chromium 151.0.7922.34**를 확인했다. [재실행 JSON](../artifacts/qa/turkish-review-20261018/result.json), [stdout](../artifacts/qa/turkish-review-20261018/stdout.log). pinned/shared·11×192·10사전/metadata 불변·gate12와 5종 음성 대조군·DOM 63/title 30/ARIA 16의 불일치 0건·3개 폭·ar/he→tr·키보드 주 +100ms/휠 보조 -100ms·송신값/ARIA가 원본과 일치했다. 정식 runtime **66/66**, language **16/16**, shortcuts **34/34**도 이 재실행에 포함된다.
- 학습 카드가 실제 열린 [원본 캡처](../artifacts/qa/turkish-audit-20261018/turkish-learning-expanded-320.png)를 직접 확인했다. [재실행 캡처](../artifacts/qa/turkish-review-20261018/turkish-learning-expanded-320.png)는 별도 폴더에 저장됐다. 동일 사본의 JSON screenshot 필드는 스크립트에 적힌 원본 폴더 문자열이므로 실제 새 캡처 위치는 이 링크를 기준으로 한다.
- 보고서의 **219링크/관련 앵커 8개**는 6라운드 스크립트 안에 검사가 없다. 이번 문서 변경 전에 Codex가 [독립 점검](../artifacts/qa/turkish-review-20261018/document-check-before.json)해 같은 수치/오류 0건을 확인했다. 기존 `turkish-20261018/verification.json`은 덮어쓰지 않았다. 문서 해시는 이번 변경 전부터 별도로 기록하며 제품/테스트의 150개 소스 해시가 문서 불변성까지 증명한다고 쓰지 않는다.
- 실제 확장 storage suite는 이번 재실행에 포함되지 않는다. 이전 `.53`의 **17/17** 기록은 유지하되 이번 검사로 다시 실행한 결과로 세지 않는다. 전체 **104/104, 156.5초**도 아래 기존 실행 이력이며 새 전체 QA 실행을 주장하지 않는다.

[최종 대조](../artifacts/qa/turkish-review-20261018/verification.json)는 기존 전체 QA의 150개 소스 일치·조사 원본 10개/기존 검증 결과 불변·동일 스크립트와 6개 결과·현재 문서 링크·제출 ZIP SHA256을 확인한다. 보류한 실제 Netflix/스크린리더 발화·Mac/Linux/ChromeOS·물리 두 기기 Sync는 재개하지 않았다.

## 2026-10-18 터키어 메뉴 — .53

사용자 요청으로 `Türkçe (TR)` 메뉴, **192개 문구**와 `_locales/tr` 확장 이름/설명을 추가했다. 제품 version은 1.3.4를 유지하고 개발 build는 **1.3.4-local-turkish-ui-20261018.53**이다. 현재 UI/확장 메타데이터는 ko/en/es/de/ja/ar/hi/he/ms/bn/tr **11언어**다. 기존 10사전/메타데이터는 작업 전 snapshot과 동일하다. 권한·Netflix 요청/원본 선택·실제 트랙 identity·시계/광고/회차 guard는 바꾸지 않았다.

기존 base-language 경로의 tr-TR/tr/대소문자·선호 순서와 명시적으로 저장한 언어 우선을 검사했다. 메뉴 지역 변형 감지와 실제 자막 tr/tr-TR identity는 구분하며 실제로 없는 지역 트랙을 추측해 합치지 않는다. Latin 제공자 이름은 기존 labelLocale/Intl 경로로 처리하므로 문자 추정 규칙을 추가하지 않았다. 원본 제공자 이름 `Türkçe (Türkiye)`/CC를 유지하고 영어 UI에는 영어 표시를 쓰는지 검사했다. `İ/i`·`I/ı`, ğ/ş/ç/ö/ü와 보간 토큰, 0.0s/px/%·물리 단축키 표기를 보존한다.

**집중 검사: runtime 66/66, 언어 표시/감지/복원 16/16, 배치 99/99, 실제 extension storage/패널 17/17 통과.** [실행별 결과](../artifacts/qa/turkish-20261018/focus-results.json). 배치는 11언어×320/360/430px×연결/복구/연결 없음 99개이며 실제 direction·화면 밖 컨트롤·CC title·터키어 양쪽 가림 라벨 `İkisi`의 잘림을 검사한다. 상태 안내 dialog와 OS modifier/실제 shortcut handler 행렬도 11언어로 확장했다. 모든 언어에서 각각 물리 휠/키보드 실기까지 했다는 의미는 아니다.

[320px 학습 카드가 열린 화면](../artifacts/qa/turkish-20261018/focus/test_language_names_browser/turkish-panel-320.png), [연결 상태 배치](../artifacts/qa/turkish-20261018/focus/test_l10n_layout_browser/review-tr-320.png), [실제 확장 storage 복원 화면](../artifacts/qa/turkish-20261018/focus/test_side_panel_browser/turkish-extension-panel.png)을 직접 확인했다. 아랍어 RTL→터키어 LTR, 선택값·ARIA·주/보조 상태·후원 링크와 실제 확장 local storage 저장/페이지 재열기를 검사했다. 네이티브 select의 긴 대기 설명은 기존처럼 공간에 맞게 표시되므로 문서 전체 폭 통과를 모든 옵션 문자열의 무잘림 인증으로 넓히지 않는다.

[언어 감사](../artifacts/qa/turkish-20261018/language-audit.json)는 pinned key/token/profile의 11×192키와 metadata 길이, 기존 10사전/metadata 불변을 확인한다. 이름/설명은 **51/106 UTF-16 code units**로 75/132 한도 이내다. shared gate12도 조사에서 직접 호출해 11사전의 다른 문자 혼입 0건을 확인했다. 일반 pinned audit에 gate12를 새로 연결한 것은 아니다. 채택한 어휘/출처와 원어민 검수 경계는 [REVIEW](../OttsubAiTalk.md#터키어-메뉴-확인--53)를 따른다.

**최종 전체 QA: 104/104 suite, 156.5초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19) 통과. [전체 결과](../artifacts/qa/2026-10-17T17-50-35-190Z-7176/summary.md), [원본 JSON](../artifacts/qa/2026-10-17T17-50-35-190Z-7176/summary.json). sourceHashes는 새 tr metadata를 포함한 **150개**이며 suite 생략/실행 중 소스 변경은 없다. platform browser는 새 언어의 mac/win 안내를 포함해 **34/34**다. Python 패키지 검사 6개 중 이전 .51 제출 ZIP과 현재 소스 동등성 1개는 새 ZIP 요청이 없어 의도대로 skip했고 현재 입력의 tr 포함/진단·권한 경계 검사는 통과했다.

[최종 대조](../artifacts/qa/turkish-20261018/verification.json)는 전체 QA 이후 150개 소스 일치, 기존 10사전/metadata 불변, manifest의 개발 label 외 동일성, 수정 허용 범위, 제출 ZIP SHA256과 현재 문서 링크를 확인한다.

변경 전 해시/10사전 snapshot과 새 로그/화면은 `artifacts/qa/turkish-20261018`에 둔다. 별도 오프라인 Chromium 검사이며 실제 Netflix/DRM·원어민 전수 검수·스크린리더 발화·물리 두 기기 cloud Sync·Mac/Linux/ChromeOS 실기는 포함하지 않는다. 기존 보류 지시를 유지하며 제출 ZIP/이전 등록 자료는 보존한다.

## 2026-10-18 Gemini 벵골어 검수 후속 — .52 유지

[보고서 대조/정정](../OttsubAiTalk.md#gemini-벵골어-8라운드-보고서-대조--2026-10-18)을 수행했다. 제품/정식 테스트/manifest는 수정하지 않았고 외부 공통 규범 문서 2개와 현재 프로젝트 문서를 정정했다. Gemini의 원본 조사 파일 5개 및 변경 전 문서/공통 파일 사본과 해시는 [작업 전 기록](../artifacts/qa/bengali-review-20261018/before.json)에 보존했다. 원본은 그대로 유지하며 사용자 대화의 보고서는 archive에 옮겨 적었다.

- **독립 확인 9/9, Chromium 151.0.7922.34:** pinned와 현재 shared key/token/profile, 실제 shared gate12의 10사전/10 metadata 검사, Greek/Tamil 음성 대조군, 원본 검사 누락 재현, 실제 상태 3개를 포함한 DOM 63개 문구, 정확한 Bengali 개수 ১২০/১১০, 학습 카드 expanded/표시와 320px 전체 화면, ar RTL→bn LTR/모의 저장 복원, Bengali 키보드 주 +100ms·실제 wheel 보조 -100ms의 송신값/ARIA/대상 분리를 검사했다. [원본 결과](../artifacts/qa/bengali-review-20261018/result.json), [조사 probe](../artifacts/qa/bengali-review-20261018/verify.cjs). 9개는 조사 check이며 전체 suite에 새 9개를 추가했다는 뜻이 아니다.
- **CDN 정식 검사 재실행 30/30:** [stdout](../artifacts/qa/bengali-review-20261018/cdn/stdout.log), [로컬 요청 측정](../artifacts/qa/bengali-review-20261018/cdn/cdn-permissions-measurements.json). 별도 Chromium 프로필과 127.0.0.1 TLS proxy로 실제 extension ISOLATED downloader/CORS를 검사했다. 외부 Netflix/CDN·계정 접속은 없다. 별도 실행이 통과한 사실로 이전 환경 실패의 구체 원인을 단정하지 않는다.
- **현재 소스 149개 불변:** 기존 Codex 전체 **104/104, 166.8초** 실행(`2026-10-17T17-14-49-480Z-8260`)과 이후 Gemini **103/104, 162.6초** 실행(`2026-10-17T17-27-45-288Z-27840`)의 sourceHashes가 모두 현재 파일과 일치한다. 후자는 [실패 원본](../artifacts/qa/2026-10-17T17-27-45-288Z-27840/summary.md)을 그대로 유지한다. 이번에는 새 전체 실행을 한 것으로 표현하지 않으며 기존 전체 결과와 CDN 분리 재검사 결과를 구분한다.
- **실제 열린 학습 화면:** [320px 전체 캡처](../artifacts/qa/bengali-review-20261018/learning-expanded-320.png)를 직접 확인했다. Gemini의 learning 캡처가 닫힌 카드/viewport 일부인 점을 보완했다. 이 환경에서 눈에 띄는 글자 깨짐/버튼 잘림은 관찰하지 못했지만 모든 glyph/글꼴/배율이나 원어민 문장 품질을 인증하지 않는다.
- **공통 문서 교체 2개:** `app_common/l10n_engine/rules/bn/README.md`와 `rules/README.md`만 staged 정정본으로 교체했고 교체 직전 원본 해시·교체 후 동일성을 확인했다. [교체 영수증](../artifacts/qa/bengali-review-20261018/shared-apply-receipt.json). 도메인 표의 편집 후보 안내, STORE_GUIDE의 올바른 10언어 변경과 공유 실행 gate는 유지했다.

조사 probe의 최초 2회는 동적 상태 3개를 초기 waiting 문구로 비교한 잘못된 기대값과 숫자 현지화를 t() 내부로 가정한 기대값 때문에 실패했다. **probe 기대값만** 실제 ready 상태/호출부의 locale 숫자 계약에 맞췄고 제품은 바꾸지 않았다. `initial-*`/`second-*` 원본과 최종 실행을 모두 보존했다. 최종 결과는 9개 완료와 각 passed, 페이지 예외/실패 없음까지 확인한다.

[최종 보존/링크 대조](../artifacts/qa/bengali-review-20261018/verification.json)는 기존 두 실행의 소스 각 149개, Gemini 조사 원본 5개, 공통 문서 교체 2개·공유 gate/도메인 불변, 9/9·30/30 결과, 제출 ZIP SHA256과 현재 문서 링크를 확인한다. 이 후속 검수는 실제 Netflix 재생·스크린리더 발화·물리 두 기기 Sync·Mac/Linux/ChromeOS 보류를 재개하지 않는다. 제출 ZIP도 보존한다.

## 2026-10-18 벵골어 메뉴 — .52

사용자 요청으로 `বাংলা (BN)` 메뉴와 192개 UI 문구, `_locales/bn` 확장 이름/설명을 추가했다. 제품 version은 1.3.4를 유지하고 개발 build만 **1.3.4-local-bengali-ui-20261018.52**로 바꿨다. 현재 UI는 ko/en/es/de/ja/ar/hi/he/ms/bn **10언어**다. 기존 9개 사전/메타데이터·권한·원본 요청/선택·자막 identity·시계/광고/회차 guard는 유지한다.

기존 base-language 경로로 bn-BD/bn-IN/bn/대소문자·브라우저 선호 순서를 처리하며 저장한 명시적 언어가 우선한다. 메뉴의 지역 변형 감지와 자막의 정확한 bn/bn-BD identity를 구분하고 해당 자막 제공을 보장하지 않는다. Bengali 제공자 이름의 문자/locale 근거를 기존 이름 표시 경로에 추가했고 CC/SDH·실제 선택 코드는 그대로 유지한다. he RTL→bn LTR, 번역된 상태·cue 수·ARIA/툴팁·후원 링크·저장/재열기와 실제 확장 storage를 검사한다.

공통 gate의 10사전×192키/보간 변수와 메타데이터 길이 규칙을 통과했다. 벵골어 확장 이름/설명은 각각 **50/94 UTF-16 code units**로 제한 75/132 이내다. [Chrome 공식 locale 목록](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)에 bn이 포함되는 것을 확인했다. 문장 전체의 원어민 검수 완료나 실제 Netflix/DRM 성공을 뜻하지 않는다.

**집중 검사 결과:** runtime **62/62**, 언어 표시/감지/복원 **14/14**, 화면 **90/90**, 실제 확장 storage/패널 **16/16**을 통과했다. [집중 결과](../artifacts/qa/bengali-20261018/focus-corrected-results.json). 화면 행렬은 10언어×320/360/430px×연결/복구/연결 없음 **90개**이며 OS modifier/실제 handler·상태 안내 dialog 키보드 검사도 기존 10언어 행렬로 확장했다. 새 suite를 양산하지 않고 기존 검사를 확장했다. [320px 연결 화면](../artifacts/qa/bengali-20261018/focus-corrected/test_l10n_layout_browser/review-bn-320.png)과 [실제 확장 화면](../artifacts/qa/bengali-20261018/focus-corrected/test_side_panel_browser/bengali-extension-panel.png)을 직접 확인했고 결합 문자·줄바꿈·버튼 배치를 확인했다. 이는 원어민 문장 검수나 실제 발화/물리 키보드 검사가 아니다.

**최종 전체 QA: 104/104 suite, 166.8초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19) 통과. [전체 결과](../artifacts/qa/2026-10-17T17-14-49-480Z-8260/summary.md), [원본 JSON](../artifacts/qa/2026-10-17T17-14-49-480Z-8260/summary.json). platform 브라우저 항목은 10언어 OS 조합을 포함해 **32/32**다. suite 생략/실행 중 소스 변경은 없다. Python 패키지 경계 검사 6개 중 기존 ZIP과 현재 소스의 동등성 1개는 제출본이 이전 .51이라 의도대로 skip됐으며, 현재 패키징 입력의 Bengali 포함/진단·권한 차단 검사는 통과했다. 새 ZIP을 만들었다는 뜻이 아니다.

[최종 대조](../artifacts/qa/bengali-20261018/verification.json)는 QA 이후 sourceHashes 일치, 기존 9사전/메타데이터 불변, manifest의 개발 label 외 구조 동일성, 제출 ZIP SHA256 보존과 현재 문서 링크를 확인한다.

처음 집중 검사에서는 신규 Bengali 검사가 통과했지만 기존 ms-MY 자동 감지 케이스가 저장된 영어 선택과 revision을 이어받아 실패했다. 브라우저 기본 선택을 검사하려면 raw 언어뿐 아니라 해당 revision envelope도 비워야 하므로 **테스트 초기 조건만** 교정했다. 최초/중간 실패 결과는 `artifacts/qa/bengali-20261018/focus-results.json`, `focus-final-results.json`과 해당 폴더 로그에 보존한다. 이 도구 초기 조건 실패를 제품 언어 감지 결함으로 집계하지 않는다. 원래 기능 assertion/대기시간을 완화하지 않았다.

모든 새 로그·스크린샷·변경 전 해시/9사전 snapshot은 `artifacts/qa/bengali-20261018`에 둔다. 사용 중인 Chrome UI는 조작하지 않고 별도 오프라인 Chromium으로 검사한다. 실제 Netflix·스크린리더 발화·물리 두 기기 cloud Sync·Mac/Linux/ChromeOS 실기는 이번 요청으로 재개하지 않는다. 제출 ZIP/기존 등록 자료는 보존하고 새 ZIP·스토어 설명/이미지는 생성하지 않았다.

## 2026-10-16 실제 브라우저 검증 준비 — 보류

사용자가 Windows 실제 Netflix 재생 경계 검사를 요청해 현재 문서·진단 도구와 실행 중 브라우저를 확인했다. 브라우저 연결 도구에는 Netflix 탭이 노출되지 않았고 Windows 창 목록에는 Chrome 창 2개가 있었다. Chrome 탭 검색을 시도하는 단계에서 Computer Use가 **현재 브라우저 URL을 충분히 확신할 수 없어 정책을 적용할 수 없다**고 중단했다. 이후 UI 상태는 확인하지 못했고 브라우저 입력을 재시도하지 않았다. 실제 Netflix 탭/설치 확장 버전·재생/탐색/광고/회차 상태를 확인한 결과는 없다. 이 준비를 통과/실패한 제품 검사로 집계하지 않는다.

그 뒤 사용자가 실제 Netflix 검사와, Chrome 조작이 필요한 경우 스크린리더 검사도 뒤로 미루라고 지시했다. 대상은 Chrome 확장 패널의 실제 부호·초 단위 발화와 안내창/포커스이므로 Chrome에서 해당 UI를 조작해야 한다. **두 검사 모두 사용자 요청으로 보류**하고 실제 스크린리더 실행은 시작하지 않았다. DOM/접근성 트리의 기존 확인은 실제 발화 결과로 대체하지 않는다. 상세 보류 상태는 [TODO](TODO.md)를 따른다.

이번 변경은 문서의 상태 기록뿐이다. 제품/정식 검사/manifest/제출 ZIP은 그대로이고 기존 wheel 후속의 전체 QA 결과는 아래 기록을 유지한다. Linux·ChromeOS·Mac 추가 실기 보류도 유지한다.

## 2026-10-16 wheel 간헐 실패 후속 — .51 제품 유지

사용자 요청으로 Gemini 기초 보고서를 대조하고 Codex가 원본 순서의 실패 순간을 재현했다. **확인한 원인은 검사 fixture의 local/sync 공유와 잘못된 local 변경 이벤트다.** 정식 테스트 2파일만 수정했고 제품 코드·manifest·제출 ZIP은 변경하지 않았다. 과거 비계측 timeout 전체의 세부 순서를 소급 확정하거나 실제 Netflix/다른 OS 검증으로 넓히지 않는다. [Gemini 주장별 답변](../OttsubAiTalk.md#gemini-wheel-기초-조사-대조--2026-10-16).

### 실패 순간과 실제 API 대조

- 변경 전 원본 테스트를 읽어 동일 순서로 실행하는 계측본은 1–4회 통과 후 **5회차 wheel timeout**을 잡았다. 인위적인 callback 지연·sleep 없이 document 이벤트·명령·storage·status 시간순서를 기록했다. [전체 trace](../artifacts/qa/wheel-followup-20261016/trace-5/timeline.json), [핵심 추출](../artifacts/qa/wheel-followup-20261016/confirmed-failure.json), [실패 결과](../artifacts/qa/wheel-followup-20261016/trace-5/stdout.log).
- 같은 document 시계에서 **605.8ms status reply(-400) → 606.6ms 표시 -400 → 673.1ms 잘못된 local 이벤트 → 673.6ms 표시 -300 → 691.6ms wheel(-1) → 692.5ms 표시 -200**을 확인했다. 주 표시도 +0.7s→+0.5s로 되돌아갔다. wheel은 sync-slider에 적중하고 보조 set_secondary_offset(-200)을 정상 발행했다. status 응답이 휠 뒤에 도착한 rollback 경로가 아니다.
- 원래 fixture는 `local`/`sync`가 **같은 area 객체/데이터**를 쓰고 모든 set에서 변경 없는 키까지 **area='local'** 이벤트를 발행했다. revision guard의 정상 350ms sync catch-up이 이전 외부 저장값(500/-300)을 다시 local 변경처럼 반영했다. 앞선 status 검사는 700/-400을 주입했고 wheel 직전에 status 필드를 삭제하므로, 잘못된 저장 이벤트와 wheel의 순서에 따라 고정 기대값에서 벗어났다.
- 실제 unpacked 확장을 별도 Chromium 151.0.7922.34 프로필로 로드한 API 비교 **3/3**을 통과했다. local에 1을 써도 sync에는 없고 sync에 2를 써도 local은 1이었다. 이벤트 area는 local/sync로 구분됐고 같은 local 값 재저장은 추가 이벤트가 없었다. 실제 storage와 모의 status를 연결한 제품 popup에서도 sync 재전송 뒤 700/-400 표시와 보조 +100ms 조절이 유지됐다. [실제 API 결과](../artifacts/qa/wheel-followup-20261016/native-storage/result.json). 모의 status/탭은 실제 Netflix와 구분한다.
- 초기 계측본의 active-card 조회는 잘못된 `.sync-card.active` 선택자를 사용해 해당 필드가 없었다. 보조 명령·ARIA·값과 wheel target은 기록됐으며 원인 판정에 그 누락 필드를 사용하지 않았다. 조사 도구의 선택자만 고쳤고 원본 trace는 보존했다.

### 수정과 검증

1. `test_hindi_track_kind_browser.cjs`의 공용 fixture는 local/sync 데이터 및 이벤트 영역을 분리하고, 값 복사와 동일 JSON 값 no-op 이벤트 처리를 실제 확인한 범위에 맞췄다. 완전한 Chrome API 모방을 주장하지 않는다.
2. `test_platform_shortcuts_browser.cjs`에는 sync catch-up이 현재 content 표시를 덮지 않는 결정적 회귀를 추가했다. **수정 전 28/30**으로 새 회귀와 원래 wheel이 실패했고, fixture 수정 후 **30/30**을 통과했다. [수정 전](../artifacts/qa/wheel-followup-20261016/regression-before/stdout.log), [수정 후](../artifacts/qa/wheel-followup-20261016/regression-after/stdout.log).
3. 계측 없는 정식 검사 **10회 모두 30/30**, wheel/catch-up 모두 통과했다. [실행별 결과](../artifacts/qa/wheel-followup-20261016/repeat-after.json). timeout·wheel 기대값·poll 주기·제품 입력 처리는 완화하지 않았다.
4. 수정 후 일반 실행기 전체 QA **104/104 suite, 141.4초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19)를 통과했다. 생략/실행 중 소스 변경은 없고, platform suite는 새 회귀를 포함해 30/30이다. **계측 preload 없이** 정식 소스/실행기를 검사했다. [최종 전체 결과](../artifacts/qa/2026-10-15T16-14-38-721Z-14040/summary.md), [원본 JSON](../artifacts/qa/2026-10-15T16-14-38-721Z-14040/summary.json).

앞선 기본 sandbox 전체 실행은 **98/104, 78.8초**였다([원본](../artifacts/qa/2026-10-15T16-08-40-873Z-21012/summary.md)). 제품/검사 변경 전이며 계측한 wheel은 통과했지만 full Chromium을 사용하는 6개 suite가 launch/접근 오류로 실패했다. 같은 환경의 native API probe도 launchPersistentContext에서 exitCode 3221225506으로 닫혔다. 범위를 지정한 sandbox 밖 실행에서 native API 비교와 최종 전체 회귀를 통과했다. 이 환경 실패를 wheel 원인이나 제품 결함으로 합치지 않는다. Gemini의 별도 102/104 실행에 있던 CDN proxy 실패도 REVIEW에 분리했다.

Node v24.13.0, Playwright 1.62.1, 실제 browser 151.0.7922.34를 사용한다. NODE_PATH는 공통 runtime의 node_modules, PLAYWRIGHT_BROWSERS_PATH는 `C:\Users\hsdin\AppData\Local\ms-playwright`, OTTSUB_PYTHON은 `C:\Python314\python.exe`, TEMP/TMP/TMPDIR는 프로젝트 `artifacts/qa-temp`다. 원문/변경 전 해시와 소스 사본·새 계측/재현 도구·원본 결과는 `artifacts/qa/wheel-followup-20261016`에 보존한다. [최종 대조](../artifacts/qa/wheel-followup-20261016/verification.json)는 현재 QA sourceHashes 148개 일치, 이전 .51 대비 테스트 2파일만 변경, 원문/제품/manifest/제출 ZIP 보존과 현재 문서 링크를 확인한다. 제출 기준은 계속 1.3.4/.51이며 Linux·ChromeOS·Mac 보류와 실제 두 기기 cloud 미검증은 유지한다.

## 2026-10-16 Linux 가상환경 검증 계획 — 실행 전

**계획 작성 후 사용자 지시로 실행 보류.** Linux·ChromeOS 환경 구축/호환성 검사는 [TODO](TODO.md)에 남겼다. 아래 내용은 보존한 Linux 계획이며 설치/테스트를 시작하라는 지시가 아니다.

사용자가 1.3.4를 스토어에 제출했다고 알렸고 Linux 실기 제공 없이 검증할 계획을 요청했다. **이번에는 환경 조회·소스/공식 문서 대조와 계획 작성만 수행했다. Linux 설치/부팅·테스트·제품 수정은 실행하지 않았다.** 제출은 사용자 알림으로 기록하며 심사 승인/게시 완료로 넓히지 않는다. 보류한 Mac 실기는 별개다.

### 기준과 현재 확인

- 제출 기준은 `dist/ottsub-store-1.3.4.zip`, SHA256 `c02513a9215ef0071a2b087208bab8e18f1edd8e80d58b26a89cb85104e0e116`이다. 원본 ZIP·.51 코드와 기존 Windows 결과를 보존한다.
- Windows에 wsl.exe 실행기는 있지만 --status는 WSL 설치가 필요하다고 반환했다. docker/podman/VBoxManage/qemu-system-x86_64는 현재 PATH에서 찾지 못했다. 이 관찰을 설치된 모든 프로그램의 전수 조사로 확대하지 않는다.
- 현재 Playwright는 **1.62.1**이다. `src/core/platform.js`는 Linux를 other로 분류하고 Alt를 표시한다. 이는 현재 계약이며 분류 이름만으로 결함으로 판단하지 않는다. 플랫폼 browser suite는 mac/win mock을 주로 검사하므로 Linux 실행 증거가 필요하다.

### 실행 환경 기본안

**현재 Windows PC 안의 전용 QEMU Ubuntu 24.04 x86-64 VM**을 기본안으로 한다. 도구·원본 이미지·가상 디스크·프로필·로그는 `artifacts/qa/linux-20261016` 아래에 둔다. guest의 작업 폴더는 그 가상 디스크 내부 ext4에 둬서 대소문자 구분을 실제로 검사한다. Windows 공유 폴더에서 직접 돌린 결과로 대체하지 않는다. 초기 자원안은 vCPU 2–4개, RAM 4GiB, 동적 디스크 16GiB이며 실제 여유 자원에 맞춰 조정한다.

실행 1단계에서 공식 Windows 배포 도구의 프로젝트 전용 배치와 VM 부팅 가능성을 먼저 확인한다. 이미 사용 가능한 WHPX 가속이 있으면 활용하고, 없으면 TCG 소프트웨어 에뮬레이션으로 기능 검증을 진행한다. 부팅/설치 실패는 환경 문제로 기록하며 Windows 기능 활성화·재부팅을 자동 실행하는 경로로 바꾸지 않는다. QEMU/배포 이미지 버전·출처·해시와 CPU/가속 방식을 기록한다. [QEMU 공식 배포](https://www.qemu.org/download/), [가속/TCG 설명](https://www.qemu.org/docs/master/system/introduction.html).

Node 24.x, Python 3, 현재와 같은 Playwright 1.62.1 및 해당 Linux Chromium을 고정한다. NODE_PATH/PLAYWRIGHT_BROWSERS_PATH/OTTSUB_PYTHON/TMPDIR/TEMP/TMP를 guest 작업 트리로 연결하고 9언어에 필요한 Noto 폰트를 갖춘다. VM의 Linux kernel·os-release·Node process.platform·브라우저 실행 파일/버전·실제 getPlatformInfo 결과를 기록한다. Windows UA/navigator 변경을 Linux 실행으로 집계하지 않는다. 호환성 판단 대상은 우선 **Ubuntu x86-64 / Playwright Chromium**이다.

### 검증 순서와 통과 기준

| 단계 | 실행 내용 | 남길 증거/판정 |
|---|---|---|
| 1. 부팅·고정본 | VM 환경 확인, 제출 ZIP 해시 대조·추출, .51 검사 소스와 필요한 고정 fixture만 guest로 복사 | Linux 환경 정보, 입력 파일 목록/SHA256, 대소문자 구분 파일 생성/조회 검증. 부팅 불가를 제품 실패로 집계하지 않음 |
| 2. 기존 전체 QA | Linux Node/Python으로 scripts/run-qa.cjs 실행. .51 개발 검사 트리와 제출 ZIP의 패키지 변환 결과가 같은지 대조 | 현재 104개 suite의 개별 통과/실패/미실행·sourceHashes. Windows 실행 경로나 빠진 fixture/라이브러리는 검사 기반 문제로 구분 |
| 3. 제출 ZIP 실제 로드 | ZIP에서 추출한 파일을 Linux Chromium의 별도 persistent profile로 로드. 실제 SW·MAIN/ISOLATED script·storage·사이드패널 동작 검사 | 실제 manifest version 1.3.4, 진단 제외, 9언어·he RTL/ms LTR·설정 저장/재열기. popup을 일반 탭으로 연 것과 아이콘으로 여는 native sidebar를 별도 집계 |
| 4. Linux 화면·입력 | headless와 Xvfb+경량 X11 window manager의 headed 화면을 구분. 9언어×320/360/430px, 글꼴/문자/RTL 음수·단위·가림, drag/잠금/hover/전체화면 검사 | PNG와 DOM 좌표, 버튼 잘림/가로 넘침, +/−0.1초·보조 대상·휠 입력/접근성 포커스. CDP 입력과 X11 자동 입력을 구분 |
| 5. 재생·네트워크·보존 | 자체 WebM과 모의 manifest/CDN으로 seek·배속·광고/회차 수명·실제 Linux CORS/TLS 검사. 정상 종료/재실행·해당 전용 프로세스 강제 종료 뒤 설정 확인 | 실제 HTTP 요청/이벤트 순서·큐/회차 소유권·local/sync 상태. Chrome API가 실제인 검사와 응답을 mock한 검사를 구분 |
| 6. 안정성·수정·회귀 | 재생 15분+일시정지 15분, 설정/drag/hover 반복 후 heap/DOM/listener 변화 관찰. 실패를 환경/검사/제품으로 분류하고 최소 재현 후 일반 결함 수정 | TCG/VM 수치를 Windows/실기 CPU와 직접 비교하거나 CPU 최적화 근거로 쓰지 않음. 재현된 제품 수정은 별도 작업본에서 집중 회귀 후 Linux+Windows 전체 검사, 제출 원본 ZIP 유지 |

단축키는 `[`, `]`, backslash, Alt+[ / Alt+] / Alt+backslash, Alt+D/B/L/R와 Ctrl+L/F를 검사한다. X11 자동 입력 단계에서는 window manager의 Alt+드래그/단축키 선점도 확인하되 물리 키보드·IME 검증으로 부르지 않는다. 패널의 언어 감지 검사와 실제 자막 언어/지역/CC identity 검사는 분리하고 기존 identity/clock/ad/episode guard를 유지한다.

자동 확장 로드는 **channel=chromium + persistent context**를 사용한다. 일반 Chrome의 제거된 command-line side-load 옵션에 의존하지 않는다. [Playwright 확장 검사 문서](https://playwright.dev/docs/chrome-extensions). Headed 실행은 가상 X11 화면을 사용한다([공식 Xvfb 안내](https://playwright.dev/docs/ci#running-headed)). 소프트웨어 에뮬레이션에서 기존 timeout이 부족하면 wall-clock 지연과 실제 응답을 먼저 기록하고 Linux 실행기에서만 근거 있는 시간 예산을 적용한다. 기능 assertion/시계 guard를 완화하거나 실패를 자동 retry 통과로 감추지 않는다.

### 완료 조건과 남는 범위

제출 ZIP과 검사 대상의 동일성, 환경 정보, 기존 전체 QA, 실제 확장 로드·native sidebar, Linux 화면/입력·재시작/강제 종료 보존의 항목별 결과와 실패 원본을 QA.md에 정리한다. raw 로그/PNG/환경 및 해시는 위 artifacts 경로에 보존한다. 환경 구축 실패/미실행/재현된 제품 실패를 구분하고, 이 계획을 실행 결과로 보고하지 않는다.

실제 Netflix 로그인·DRM/Widevine 재생·사람이 듣는 싱크·물리 키보드/IME·실제 GPU/4K/배터리·GNOME/Wayland·다른 배포판/ARM·실제 두 기기 cloud Sync는 이 VM 계획의 확인 범위가 아니다. 사용자에게 Linux 장비 제공/수동 테스트를 맡기는 대체 절차를 만들지 않는다. 결과는 확인한 Ubuntu 가상환경 범위로 보고한다.

## 2026-10-15 1.3.4 배포 준비 — .51

사용자가 최신 ZIP과 추가 언어의 스토어 등록 자료 준비를 요청했다. 이미 올린 1.3.3보다 큰 **1.3.4**로 올렸고 개발 label은 1.3.4-local-store-20261015.51이다. 제품 로직은 .50 그대로이며, 이전 ZIP 보존 목록의 1.3.3 누락만 테스트 3개에서 고쳤다. 최초 전체 실행은 이 3개 때문에 **101/104, 137.0초**였다([실패 원본](../artifacts/qa/2026-10-15T14-52-57-512Z-23088/summary.md)). dist의 정확한 1.3.3 경로만 허용했고 임의 ZIP 차단·패키지 무결성 검사는 유지했다. 수정 전 검사 3개와 manifest/이전 ZIP 해시는 artifacts/releases/1.3.4에 보존한다.

두 번째 전체 실행은 **103/104, 142.0초**였다([원본](../artifacts/qa/2026-10-15T14-56-48-055Z-13660/summary.md)). 기존 플랫폼 검사에서 native mouse wheel 후 화면 값 대기만 5초 타임아웃이 났다. 제품/원래 검사 코드를 바꾸지 않은 별도 진단 9회(각 29항목)는 통과했고 실제 wheel 대상이 sync-slider임을 기록했다. 원인을 CPU·제품 결함·계측 효과 중 하나로 확정하지 않는다. 진단의 첫 기록 도구는 finally에서 page scope를 잘못 참조해 실패했고 해당 도구만 고친 뒤 기록했다. 이 도구 오류를 제품 실패/통과로 집계하지 않는다.

업로드 ZIP의 실제 확장 로드 smoke는 **5/5** 통과했다. 초기 smoke 도구는 extension을 지원하는 Chromium channel 선택이 빠져 service worker 대기가 실패했고 channel을 명시한 뒤 통과했다. 제품/ZIP 변경은 없다. 스크린샷 렌더링은 별도 mock API이며 이 실제 확장 smoke와 구분한다. 기록은 artifacts/releases/1.3.4의 smoke-first.json/smoke.json에 있다.

새 [ZIP](../dist/ottsub-store-1.3.4.zip)은 **56개 파일, 157,197 bytes**, UI/메타데이터 9언어다. version_name·로컬 진단 2개·테스트/문서/등록 자료를 제외한다. SHA256은 `c02513a9215ef0071a2b087208bab8e18f1edd8e80d58b26a89cb85104e0e116`이다. 원본/현재 실행 파일 일치와 기존 ZIP 4개·버전별 보고서 불변을 대조한다.

[히브리어](../store_assets/he/README.md)·[말레이어](../store_assets/ms/README.md)에 이름/짧은 설명·상세 설명·1280×800 RGB JPEG 각 3장을 준비했다. 업로드 ZIP에서 추출한 실제 제품 UI를 별도 mock Chrome API/트랙 데이터와 함께 렌더링한다. 6장을 직접 확인했고 he RTL/ms LTR, -0.1s 부호·슬라이더, 선택/학습 설정·브라우저 오류/가로 넘침·본문 잘림·footer 겹침을 검사했다. 실제 작품/원어민 검수/DRM 검증으로 확대하지 않는다. 기존 힌디어 설명의 메뉴 목록도 9언어로 갱신했고 옛 이미지는 보존한다.

세 번째 전체 실행은 **102/104, 132.7초**였다([원본](../artifacts/qa/2026-10-15T15-07-36-976Z-20900/summary.md)). 새 등록 지침에서 쿼터 상수 이름·단일 목적/최소 권한 명시를 빠뜨려 기존 문서 검사 2개가 실패했다. STORE_GUIDE.md의 해당 설명을 보완하고 기존 검사 2개의 분리 통과와 전체 재실행을 확인했다. 테스트의 문서 검사 조건을 완화하지 않았다. 이 실행에서는 원래 native wheel 검사도 통과했다.

**최종 확인(2026-10-16 KST): 전체 로컬 QA 104/104 suite, 132.7초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19)를 통과했다([최종 전체 결과](../artifacts/qa/2026-10-15T15-10-41-449Z-15968/summary.md)). ZIP 경계 검사 **6/6**, 실제 패키지 로드 smoke **5/5**, 9사전×192키 gate와 신규 이미지 6장의 JPEG 3채널/1280×800·해시 검사를 통과했다. QA 이후 148개 sourceHashes 변경이 없고, .50 대비 제품 로직 변경 없이 manifest와 위 검사 3개만 바뀌었음을 확인했다. 기존 ZIP 4개·버전별 보고서도 같으며 현재 문서/등록 자료의 로컬 링크 **211개**가 유효하다. [배포 검증](../artifacts/releases/1.3.4/verification.json)에 세부 결과를 기록했다. Google 계정·스토어 업로드/심사 신청은 조작하지 않았다. 보류한 Mac 실기·실제 두 기기 cloud Sync·실제 Netflix 재생 검증은 재개하지 않았다.

## 2026-10-15 파일·폴더 정리 — .50 유지

사용자 요청으로 현재 문서/원문/생성물을 정리했다. `docs/reviews`의 히브리어·모듈화·말레이어·전방위 원문은 각각 SHA256/크기가 같은 `archive/docs/reviews/<날짜·주제>/gemnisaying-original.md` 한 벌로 통일했다. `docs`에는 현재 문서 6개만 남기고 REVIEW의 오판 정정·반박 답변과 원문 링크를 유지했다. 루트 debug.log는 `archive/generated/2026-10-15-cleanup/debug.log`로 복사·해시 대조 후 원래 위치를 정리했다.

프로젝트 내부 QA 프로필의 HTTP/compiled-code/GPU shader 등 재생성 가능한 캐시 1,731파일과 비어 있는 하위 폴더 523개를 정리했다. 중복 원문을 포함한 회수량은 약 **328.8MiB**다. Preferences·확장 storage·진단/HAR·스크린샷·성공/실패 로그·측정 결과·이전 소스 사본은 그대로다. `artifacts/store-metrics/2026-10-15/node_modules`는 프로젝트 외부의 공통 런타임으로 연결된 junction이므로 순회/삭제하지 않았다. 프로필 전체 삭제나 개인 브라우저 조작은 없다.

정리 전 전체 파일의 크기/SHA256, 이동표·삭제한 캐시 목록, 문서 수정 전 사본은 `archive/maintenance/2026-10-15-cleanup`에 보존한다. [최종 검증](../archive/maintenance/2026-10-15-cleanup/verification.json)은 비캐시 원본·외부 연결·원문 보관본·현재 문서 링크와 .50 최종 전체 QA의 sourceHashes를 대조한다. 제품/검사/일반 QA 스크립트가 바뀌지 않아 전체 브라우저 QA를 반복하지 않는다. 기준 전체 QA는 아래 .50의 104/104 결과다. 과거 receipt의 `source`는 수집 당시 경로이며, 새 [이동표](../archive/maintenance/2026-10-15-cleanup/receipt.json)의 canonicalReviews로 현재 원문 경로를 확인한다. 말레이어 검수의 보존 확인 도구도 이 이동표로 해석한다.

## 2026-10-15 Gemini 말레이어/전방위 검수 후속 — .50

대상 원문은 [말레이어](../archive/docs/reviews/2026-10-15-malay/gemnisaying-original.md)와 [전방위](../archive/docs/reviews/2026-10-15-omnidirectional/gemnisaying-original.md)다. 말레이어 13·전방위 18항목의 소스/기존 증거 대조와 정정은 REVIEW.md에 있다. 원문 사본의 SHA256 일치는 [receipt](../artifacts/qa/gemini-malay-review-20261015/review-receipt.json)에 보존했다. 외부 공통 ms 규칙 파일과 index는 존재를 확인했으며 수정하지 않았다.

**수정 전 재현:** 실제 Edge의 실제 확장 화면에서 trigger는 `aria-haspopup=dialog`인데 안내창의 role은 tooltip, 이름/설명 연결 없음, 키보드로 열어도 focus는 trigger에 남았다. [실패 원본](../artifacts/qa/gemini-malay-review-20261015/popover-before.json). 닫기 버튼이 있는 안내를 비모달 dialog로 맞추고 `aria-labelledby/aria-describedby/aria-controls`, 열기 포커스, Escape/닫기의 복귀, 다른 trigger로 전환 시 expanded 정리와 바깥 클릭 후 내부 포커스 해제를 수정했다. 같은 popup 모듈의 기존 state만 사용하며 새 기능/모듈이나 모달 focus trap을 만들지 않았다.

**최종 전체 결과:** 전체 로컬 QA **104/104 suite, 154.9초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19)를 통과했다([전체 결과](../artifacts/qa/2026-10-15T14-14-27-904Z-7072/summary.md)). 완료 후 실행/검사 소스 해시가 현재와 같고, 번역 사전·검수 원문·다운로더 실행 코드가 검수 전과 같음을 [최종 검증](../artifacts/qa/gemini-malay-review-20261015/verification.json)에 기록했다. 실제 Edge의 기존 extension panel suite는 **15/15**로, 새 case가 9언어의 Enter/Escape·닫기·대상 전환·바깥 클릭을 검사한다([출력](../artifacts/qa/gemini-malay-review-20261015/side-panel.log), [실제 Edge launch](../artifacts/qa/gemini-malay-review-20261015/launches.jsonl)). 별도 실제 화면 probe의 en/he/ms **3/3**도 수정 후 통과했다([after](../artifacts/qa/gemini-malay-review-20261015/popover-after.json)). 실제 스크린 리더의 발화 전체를 검사했다고 주장하지 않는다.

추가된 제한적 실제 Edge 검사 **8/8**은 [probe](../artifacts/qa/gemini-malay-review-20261015/probe.json)에 있다. localhost로만 연결되는 TLS proxy에서 안전한 CDN redirect 성공, 위험한 초기 URL의 무요청, allowlist 밖 redirect 요청 후 자막 채택 거절, manual의 opaqueredirect/status 0/Location null을 확인했다. 최종 URL 검사는 중간 요청의 네트워크 차단이 아니라는 점을 downloader 주석에도 명시했다. redirect:error로 정상 CDN 이동까지 막거나 권한/다운로드 context를 바꾸지 않았다.

같은 Edge 프로필의 실제 extension 문서 두 개 사이에서 ms 전환과 slider 변경 전달을 확인했고, 실제 교차 출처 iframe에 `[`를 입력했을 때 문자열은 입력되고 부모 keydown은 0회였다. 독립 프로필/두 기기 cloud 성공으로 넓히지 않는다. Native slider의 접근성 트리에서 번역된 label/현재 값/min/max는 확인했다. 초기 probe는 DOM aria-valuetext `+0.5s`와 Edge CDP의 raw valuetext `500`이 같아야 한다고 가정해 실패했다. 반복 관찰과 bare HTML native/custom control 비교에서도 같은 차이가 나므로, 단위 문구의 실제 발화는 **미검증**으로 남겼다. 이 실패는 `probe-attempt-*.json`으로 보존하며 최종 8개 검사의 역할/값/속성·전파 확인과 구분한다.

번역 문구는 9사전×192개 그대로다. 원어민 검수·Whale/Brave/Firefox/Safari·실제 Netflix/DRM/광고·Mac 실기·물리 두 기기 cloud는 이번 검사에 포함하지 않았다. 기존 보류를 자동 재개하지 않는다. 제품 version 1.3.3, build만 .50이다.

수정 후 첫 전체 실행은 **103/104, 171.0초**였다([실패 원본](../artifacts/qa/2026-10-15T14-07-34-751Z-24800/summary.md)). 기존 `test_platform_shortcuts_browser`의 wheel 입력 대기 한 곳이 5초 타임아웃이었다. 같은 제품/검사 소스로 분리 실행한 **29/29**는 통과했다([분리 결과](../artifacts/qa/gemini-malay-review-20261015/platform-recheck.log)). 단일 통과만으로 시간초과의 원인을 확정하지 않으며 assertion/대기시간/제품 입력 코드를 완화하지 않았다. 동일 소스 전체 재실행의 통과 결과를 위에 기록했다.

## 2026-10-15 말레이어 메뉴 — .49

사용자 요청으로 `Bahasa Melayu (MS)` 메뉴, 전체 UI 192개 문구와 `_locales/ms` 이름/설명을 추가했다. 기존 8언어와 동일한 key/보간 변수·메타데이터 길이 규칙을 통과했다. 이전 8언어 사전 값은 baseline과 동일하다. `ms-MY`/`ms`/대소문자 변형과 브라우저 선호 순서, 저장된 명시적 언어 우선, he RTL→ms LTR 전환, 실제 확장 storage를 거친 저장/재열기, 동적 상태·일반/CC 툴팁·언어/트랙 identity 유지·단축키·후원 링크를 검사한다. UI는 9언어×3폭×3상태 **81개** 조합으로 확장했다.

**최종 실행 결과:** 전체 로컬 QA **104/104 suite, 143.3초**(syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19)를 통과했다. 생략/실행 중 소스 변경이 없고 완료 후 현재 소스 해시도 동일하다. [최종 전체 결과](../artifacts/qa/2026-10-15T12-33-20-770Z-22448/summary.md). 실제 **Edge 155.0.4283.45** 집중 **4/4 suite·136항목**(언어/복원 12, 화면 81, 키보드 29, 실제 확장 storage/패널 14)도 통과했다. [Edge 실행 증명과 결과](../artifacts/qa/malay-20261015/edge-focus.json), [최종 소스·사전 불변 확인](../artifacts/qa/malay-20261015/verification.json), [실제 Edge의 320px 말레이어 화면](../artifacts/qa/malay-20261015/edge/test_l10n_layout_browser/review-ms-320.png).

처음 전체 검사는 102/104였다([원본](../artifacts/qa/2026-10-15T12-27-06-358Z-25268/summary.md)). 새 검사 두 곳에서 기존의 짧은 `CC` 표시를 말레이어 전체 설명과 비교한 것이 원인이었고, 실제 번역이 표시되는 option의 title을 검사하도록 수정했다. 그 뒤 전체 104/104, 146.7초와 Edge 집중 4/4를 통과했다([중간 전체](../artifacts/qa/2026-10-15T12-29-56-815Z-25708/summary.md)). 화면을 직접 확인해 320px에서 잘리던 양쪽 가림 버튼 문구를 `Semua`로 줄이고, 실제 글자 잘림 검사를 추가한 최종 코드로 위의 전체/Edge 검사를 통과했다. 실패 원본과 중간 결과는 보존했다.

소스 baseline/번역 불변 확인·Edge 실행 파일 증명·집중 검사 출력/스크린샷은 `artifacts/qa/malay-20261015`에 보존한다. 기존 패키지와 개인 브라우저 프로필은 보존한다. 본 검사는 모의 Netflix 입력이며 실제 말레이어 자막 다운로드·DRM 재생·원어민 문장 검수 완료를 뜻하지 않는다. Mac 실기/실제 cloud Sync의 기존 보류·미검증 경계도 유지한다.

## 2026-10-15 Microsoft Edge 호환성 — .47

사용자 요청으로 Windows에 설치된 **Microsoft Edge 155.0.4283.45**에서 현재 .47을 검사했다. 제품 소스/manifest/검사는 수정하지 않았다. 아래 브라우저 결과는 기본 Chromium을 실행한 결과가 아니라 `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`를 지정하고 매 실행마다 CDP `Browser.getVersion().product`가 **Edg/155.0.4283.45**인지 확인한 결과다.

| 검사 | 결과와 범위 |
|---|---|
| 전체 로컬 QA | **104/104 suite, 177.1초**. syntax 45/45, runtime 25/25, legacy 15/15, browser 19/19. 생략 없음, 실행 중 추적 소스 변경 없음 |
| 실제 Edge 브라우저 선택 | 기존 browser 19개 suite의 launch 옵션만 테스트용 preload에서 Edge로 선택했다. 21회 launch의 product/UA/실행 경로를 보존했다. 페이지·확장 API는 이 preload에서 대체하지 않았다 |
| 설정/화면 | 초기 snapshot 경쟁·해제 13항목, side-panel UI 13항목, 8언어×3폭×3상태 72항목, 일반/CC·언어 이름·키보드/RTL 회귀 통과 |
| 자막/재생 | 실제 MAIN/ISOLATED 확장 로드, 모의 광고 복구·회차 변경·배치 검사, 실제 자체 생성 WebM의 재생/hover pause·resume 9항목 통과. Netflix API·대사·광고 입력은 fixture다 |
| 다운로드 | 실제 Edge의 native CORS와 제품 ISOLATED downloader를 loopback TLS에서 검사해 30항목 통과. 실제 Netflix CDN 재다운로드 성공의 증거로 확대하지 않는다 |
| 실제 native sidebar | 별도 **headed Edge**에서 CDP `Extensions.triggerAction`으로 실제 tab의 확장 아이콘 동작을 실행해 sidebar 문서가 생성됨을 확인했다. 패널 파일을 일반 탭으로 열어 확인한 것과 구분한다 |
| 브라우저 재시작 | 같은 별도 프로필의 Edge를 정상 종료 후 재실행하고 아이콘 동작으로 native sidebar를 다시 열었다. 처음/재시작 **2/2**에서 he/rtl, 보조 싱크 대상, 주 +800ms·보조 -400ms 저장값과 화면 -400ms, 폭 382 CSS px·가로 넘침 없음 확인. screenshot도 직접 확인했다 |

전체 실행 원본은 [summary](../artifacts/qa/2026-10-15T11-45-57-964Z-18956/summary.md), [소스 해시와 개별 결과](../artifacts/qa/2026-10-15T11-45-57-964Z-18956/summary.json)다. [Edge 실행 증명](../artifacts/qa/edge-20261015/summary.json), [native sidebar/restart](../artifacts/qa/edge-20261015/native-panel.json), [재시작 후 실제 패널 PNG](../artifacts/qa/edge-20261015/native-sidebar-restarted.png)를 함께 보존한다. 재현 도구는 같은 `edge-20261015` 폴더의 `run.cjs`, `edge-preload.cjs`, `native-panel.cjs`에 있다. 테스트 프로필·TEMP/TMP는 모두 OTTSub 내부다.

최초 제한된 실행 환경에서는 Edge가 시작 중 종료됐고, 일반 사용자 실행 환경의 별도 프로필에서는 정상 로드됐다(`probe.json`/`probe-native.json`). Native sidebar 검사 도구도 최초에는 page target을 tab target으로 잘못 전달했고, 일반 Playwright 탭 목록에 sidebar가 없거나 DOM 초기화 전 평가한 경우가 있었다. 실패 원본 `native-panel-first-action.json`/`native-panel-attempt-*.json`을 남겼고, 실제 tab target과 별도 CDP 세션·초기화 대기를 사용한 최종 검사는 통과했다. 이 검사 도구 오류를 제품 결함이나 통과 항목으로 집계하지 않는다.

**판정:** 이번 실제 Edge 로컬/모의 입력 범위에서 호환 오류 없음. 실제 Netflix 계정·DRM 재생·실제 광고/회차·Edge cloud Sync·Chrome Web Store 설치 흐름은 미검증이다. 사용자의 개인 프로필·로그인·설치 상태는 변경하지 않았다. Edge에서 Chrome Web Store 확장을 설치할 수 있다는 점과 sidePanel 지원은 [Microsoft 설치 안내](https://support.microsoft.com/en-gb/edge/add-turn-off-or-remove-extensions-in-microsoft-edge), [Microsoft sidebar 문서](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar)로 별도 대조했다. 다른 OS/Edge 버전과 실제 서비스 전체의 호환 완료로 넓히지 않는다.

## 2026-10-15 일시정지 CPU 검토 — .47 유지

사용자가 실제 비용을 측정한 뒤 최적화를 검토하라고 요청했다. .47을 진단하고 안정적인 paused 상태만 기본 관찰을 200→300ms로 완화하는 실험 사본(.48 label)을 비교했으나 **제품에는 채택하지 않았다. 현재 build는 .47, 기본 관찰 200ms다.** 아래 결과는 실제 WebM/Chromium과 모의 Netflix API/CDN을 사용한 로컬 측정이며 실제 Netflix/DRM·Mac·배터리/전력 측정이 아니다.

### 원인별 진단

`artifacts/qa/paused-cpu-20261015/profile.cjs`로 .47 release-like 복사본을 60초 진단했다. local diagnostics는 제외했으며 자체 생성한 640×360 VP8 WebM을 실제 HTMLVideoElement에서 일시정지했다. CPU sampling profiler와 함수 wrapper가 포함된 진단이므로 개선율 측정과 구분한다. sampleNow 320회/144.7ms, 그 안의 requestClock 45.5ms, renderer.renderDual 320회/6.9ms, page 전체 ScriptDuration 162.0ms였다. getComputedStyle 2,560회/4.7ms, 실제 cue DOM 재생성은 0회였다. 포함 관계가 있는 시간들을 더해 합계로 쓰지 않는다. 원본은 `profile-before.json`/`before.cpuprofile`이다.

비용 대부분은 상태 관찰 쪽이었으며, renderer 캐시를 추가해 얻을 수 있는 여지는 작았다. 실험은 content가 현재 owner/gate/표시 허용을 확인한 정상 paused 상태에서만 'stable-paused'를 반환하고 adapter가 실제 paused/not seeking/readyState≥2/ad absent/not pauseAd를 다시 확인해 300ms를 선택했다. playing/복구/광고/불명확 상태는 200ms, DOM 우선 예약·media event 관찰과 500ms 연속성/1초 freshness/250ms onset 검증 값은 유지했다. 구현 전 계획은 ARCHITECTURE.md에 보존한다.

### 같은 조건의 수정 전후 비교

sampling profiler와 메서드 시간 wrapper를 제거하고, .47 원본 runtime과 실험 runtime을 별도 브라우저/프로필에서 **동시에 60초씩 3회** 실행했다. launch 순서는 전/후→후/전→전/후이며, 각각 시작 후 2.5초 대기·진단 GC 뒤에 측정했다. 15초 간격으로 process CPU 누적 시간·page ScriptDuration·sample/render 정수 카운터·실제 paused/frame 상태를 기록했다. 각 구간의 PID 집합과 paused 프레임 수는 유지됐다. CPU는 **한 논리 CPU=100%**, 시험 browser의 전체 프로세스 합계다.

| 회차 | 원본 CPU | 실험 CPU | 원본 script 실행 | 실험 script 실행 | 원본/실험 sample 횟수 |
|---|---:|---:|---:|---:|---:|
| 1 | 1.210% | 1.366% | 177.9ms | 117.6ms | 320 / 200 |
| 2 | 1.763% | 1.219% | 191.6ms | 123.0ms | 320 / 200 |
| 3 | 1.339% | 1.378% | 186.6ms | 130.2ms | 320 / 201 |
| 평균 | 1.437% | 1.321% | 185.4ms | 123.6ms | 320 / 200.3 |

관찰 횟수는 약 37.4%, script 실행시간은 약 33.3%(분당 약 61.7ms) 줄었다. 그러나 전체 CPU가 낮아진 것은 **3회 중 1회**뿐이고 나머지 2회는 높았다. 평균 숫자만으로 전체 CPU/배터리 개선을 주장할 수 없다. 기존 .45의 15분 paused 0.67%/미사용 0.26%와 이번 짧은 새 프로필·동시 2 browser 조건은 달라 절대값을 직접 비교하지 않는다. .45 수치를 .47/실험 결과로 재사용하지 않는다.

### 기능 확인과 실패 기록

실험 adapter의 예약 조건 9조합을 추가한 runtime 검사 **21/21**은 실험 사본에서 통과했다(`cadence-before.log`, `cadence-after.log`). 실제 확장/영상에서는 paused 상태의 popup offset 변경/초기화, DOM pause-ad 차단·해제, 재생 재개의 frame 증가와 200ms 복귀를 관찰했다. 별도의 before/after 기능 대조(`functional.json`)에서도 정상 paused 주기·DOM wake/광고 차단·해제·재생 재개·시계 재검증을 확인했다. 이것을 실서비스 광고/탐색 전체 검증으로 확대하지 않는다.

첫 결합 실행의 `comparison.json`은 **passed:false**로 보존한다. 3개 비용 구간을 마친 뒤 4.5초 탐색→cue 2를 기대한 추가 검사가 timeout됐기 때문이다. 별도 대조에서 원본/실험 모두 해당 MediaRecorder WebM의 실제 시간이 요청한 4.5초 대신 0초로 돌아갔고 native/OTTSub 모두 cue 0이었다. 이 입력으로 탐색 성공/시계 보호 성공을 집계하지 않는다. 첫 재검사 실패도 `functional-first-seek-check.json`에 보존했다. `analysis.json`의 pairedMeasurementComplete는 비용 3구간 완료만 뜻하며 결합 실행 전체 성공을 뜻하지 않는다. .47의 기존 seek/광고/회차 회귀와 이 영상의 탐색 한계를 구분한다.

### 채택 판단과 현재 상태

전체 CPU 감소가 일관되지 않고 절감된 script 비용이 분당 약 62ms인 상태에서 관찰 cadence/API 계약을 바꿀 실효성 근거가 부족하다고 판단해 실험을 채택하지 않았다. 후보 소스/추가 회귀는 같은 폴더의 `candidate-source`에 보존하고 실행 소스/검사는 원래 .47 바이트로 복원했다. before-source/before-hashes.json, immutable runtime-before/runtime, 비교 원본/집계로 어떤 코드를 비교했는지 추적할 수 있다.

복원 후 **실행 코드·검사·manifest 등 전체 source hash가 기존 통과본 `2026-10-15T08-28-34-371Z-23708`과 동일**함을 확인했다(`restored-current.json`). 따라서 기존 전체 QA **104/104, 128.2초**는 그 동일 코드에 대한 결과이며 이번에 전체 QA를 새로 실행했다고 쓰지 않는다. 이번 최종 변경은 문서/실험 증거뿐이다. 현재 기본 200ms/기존 guard·설정·ZIP을 유지하고 새 ZIP·커밋/푸시·계정/스토어 작업은 하지 않았다. 재검토는 실제 사용 환경에서 유의미한 CPU hotspot/배터리 증거가 생겼을 때로 하며, 같은 짧은 실험을 이유 없이 반복하지 않는다.

## 2026-10-15 모듈화 검수 후속 — .47

Gemini .46 검수 31항목의 입력은 [모듈화 원문](../archive/docs/reviews/2026-10-15-modularization/gemnisaying-original.md)이며 수집 당시 원본과 SHA256 일치를 확인했다. 판정은 REVIEW.md의 31개 행에 있고, 구현 전 범위/소유권/load·수명/QA/rollback은 ARCHITECTURE.md의 .47 계획이다. 원본/수정 전 제품 사본과 해시는 `artifacts/qa/modularization-review-20261015/before-source-hashes.json` 및 `before/`에 있다.

수정 전 기존 popup suite에 검수 입력을 추가하니 **7/11**이었다(`before-check/popup-settings-after.json`). 재현된 오류는 removeListener가 없는 API에서 destroy TypeError, UI 언어 선택/echo에서 updateDOM 중복이다. 나머지 두 실패는 .47의 새 계약인 전역 alias 제거와 key 한정 읽기의 수정 전 상태를 확인한 것이며 서로 다른 사용자 버그 4개로 과장하지 않는다. 이미 .46에서 스타일 버튼 편집 105% 뒤 늦은 120% 초기 snapshot이 UI를 되돌리지 않았고, 기존 pagehide/삭제/오래된 snapshot 차단도 통과했다.

.47 집중 popup **13/13** 통과(`after-check/popup-settings-after.json`). 기존 6개에 불완전한 API의 함수 검사, 언어 중복 방지, ESM export/전역 alias 부재, 요청 key/legacy lock 포함, offset-only의 무관한 DOM 조회 0개, 순환/invalid 객체의 얕은 schema 방어, 실제 style 편집 보존을 더했다. 한 언어 선택+동일 값 echo의 전체 번역은 수정 전 3회에서 1회가 됐다. DOM 번역 호출 수 외 실제 프레임/배터리 개선율은 측정하지 않았다.

실제 unpacked 확장 side-panel **13/13**도 통과했다. 새 검사에서는 패키지 local dynamic import로 실제 binding을 읽고 존재하지 않는 tab ID의 Chrome API 오류를 callback 안의 주입 hasReadError 함수로 읽었다. 오류 감지 true/apply 0회로, 이 래퍼가 callback scope 밖으로 실행을 미룬다는 주장이 맞지 않음을 확인했다. storage.local API 오류 자체를 강제로 만든 시험은 아니며 popup API adapter에 실제 Chrome 오류 callback을 연결한 조건이다.

최종 Windows 전체 오프라인 QA **104/104 suite, 128.2초** 통과: syntax 45/runtime 25/legacy 15/browser 19, 생략 그룹 없음·실행 중 소스 변경 없음. 결과는 `artifacts/qa/2026-10-15T08-28-34-371Z-23708/summary.{md,json}`(UTC run ID)다. .46의 107개에서 제거한 unused 3파일 syntax만 빠졌고 실제 MAIN/ISOLATED drag/hover/video 교체·광고/회차/취소·원격/저장·8언어 72개 배치/입력 회귀는 유지했다. 패키지 entries에 제거 파일 3개가 없고 settings-binding 실제 바이트가 포함되는 것을 확인했다. 기존 .41 ZIP 대조 하위 시험 1개는 이전 소스로 skip됐으며 새 ZIP을 만들지 않았다.

작업 시작 전 보관돼 있던 `2026-10-15T08-15-46-064Z-4012` 실행에는 CDN 비교의 `ERR_PROXY_CONNECTION_FAILED`가 있었다. 그 실패 로그도 보존하며 최종 전체 실행의 CDN suite는 통과했다. 이를 제품 CORS/권한 결함의 근거로 삼거나 실패한 실행을 통과로 고치지 않았다.

미사용 3파일은 평가 때 선언만 하고 controller/timer/listener를 생성하지 않았다. 제거한 원본은 4,183바이트이며 메모리 누수나 심각한 파편화의 실측량이 아니다. .45의 30분 성능을 .47 결과로 재사용하지 않는다. 실제 Netflix/DRM·Mac·물리 키/음성/두 기기 cloud의 기존 미검증/보류 범위는 유지한다. 원문 검수·기존 ZIP을 보존했고 새 ZIP·커밋/푸시·계정/스토어 조작은 하지 않았다.

## 2026-10-15 popup 설정 모듈화 — .46

사용자의 필요성 기반 모듈화 요청에 따라 ARCHITECTURE.md의 해당 구체 계획을 **구현 전에** 작성했다. .45의 실제 popup에서 최초 local.get의 callback만 지연시킨 뒤 local 변경으로 he/secondary/offset 800·-400을 수용했다. 오래된 en/primary/100·-200 snapshot을 반환하자 영어·주언어 slider 100ms로 되돌아갔다. `artifacts/qa/settings-modularization-20261015/popup-settings-before.json`의 0/1 실패는 이 제품 결함의 재현 증거다. Netflix 탭이 없는 모의 환경에서도 발생해 실제 계정/영상 없이 확인했다.

`popup/modules/settings-binding.js`는 listener를 먼저 연결하고 읽기 중 수용한 local 변경/삭제 key를 초기 snapshot에서 제외한다. 검증과 revision 수용은 기존 storage-guard에 위임하며 sync 이벤트를 직접 화면에 적용하지 않는다. popup.js의 단일 applyStoredSettings가 초기/변경 UI 반영을 담당한다. 초기 edited 방어·접힘 초기 전용 복원은 유지한다. pagehide destroy는 해당 listener를 제거하고 지연된 callback/event를 무시한다. 새 timer/저장 schema/권한/manifest script 순서 변경은 없다.

집중 browser **6/6** 통과: 실제 popup 경쟁 방어, 변경하지 않은 초기 120%/접힘 복원과 추가 set/command 부재, destroy 반복·지연 callback 무시·새 instance 1개 구독, sync/잘못된 schema/삭제 snapshot 부활 차단, read 오류/예외 뒤 live 갱신·storage 부재, 실제 popup pagehide의 UI 구독 1개 제거다. 결과는 같은 폴더의 `popup-settings-after.json`이다. 첫 구현 후 검사는 4/5였는데 새 검사에서 실제 HTML에 없는 `#primary-scale-slider`를 조회한 테스트 오류였다. 이 로그는 `popup-settings-after-selector-error.json`에 보존했고, 실제 `#primary-scale-val`의 120%를 검사하도록 고쳤다. 경쟁 방어 제품 코드를 바꿔 이 실패를 숨기지 않았다.

최종 Windows 전체 오프라인 QA **107/107 suite, 126.0초** 통과: syntax 48/runtime 25/legacy 15/browser 19, 생략 그룹 없음·실행 중 소스 변경 없음이다. 결과는 `artifacts/qa/2026-10-15T07-52-02-376Z-22540/summary.{md,json}`(UTC run ID)다. 새 browser 6/6과 기존 실제 확장 MAIN/ISOLATED·패널 연결/저장/revision·Hebrew/CC·배치/입력 회귀를 포함한다. 패키지 시험은 새 module의 실제 바이트가 entries_for 결과에 포함됨을 확인했으며 기존 .41 ZIP 대조 하위 시험 1개는 이전 리비전으로 skip됐다. 새 ZIP을 생성하거나 검증한 것으로 집계하지 않는다. 제품/검사 소스는 이 최종 실행 전에 완성했고 이후 문서 정리만 수행했다.

이 변경의 성능 향상은 측정/주장하지 않는다. .45 30분 결과는 당시 소스 기준으로 보존한다. 실제 Netflix/DRM·Mac·물리 키/음성/두 기기 cloud는 이번 범위가 아니며 기존 보류를 유지한다. 기존 배포 ZIP은 SHA256 `4d4843e87bde4798313fdab029dbae2807d4143bf7e13b21011cea5d69f8a444`로 보존한다. 새 ZIP·커밋/푸시·스토어 조작은 수행하지 않았다.

## 2026-10-15 성능/설정 보존 — .45

사용자가 CPU·메모리·재시작·강제 종료·두 기기 동기화 검사를 재개했다. 현재 기기의 Windows와 독립 Chromium 프로필을 사용한다. Google 계정 로그인/접근은 하지 않으며, 실제 Mac/Netflix/DRM/두 기기 cloud Sync를 이번 로컬 범위와 구분한다. Mac 화면/물리 키/음성/광고·회차 추가 실기는 여전히 보류다.

### 재현 결함과 수정

- 실제 popup이 저장하는 `ottsub_active_sync_target`을 storage-guard 스키마가 버려 23개 요청 설정 중 22개만 남았다. primary/secondary enum 검증을 추가했다.
- 스키마 수정 뒤에도 정상 브라우저 재시작에서 저장된 secondary 선택 대신 primary slider 300ms가 복원됐다(기대 -200ms). popup 최초 local 복원과 허용된 local 변경에 sync target 반영을 추가했다.
- 실제 두 독립 프로필에 값/revision을 전달하니 UI 언어는 local에 저장됐지만 열린 popup은 기존 언어를 유지했다. 허용된 local UI 언어 변경에 applyLanguage를 추가했다. 저장 local/sync 리비전 계약·Netflix clock/ad/episode guard·권한은 유지했다.

수정 전 증거는 `artifacts/qa/performance-persistence-20261015/{persistence-before.json,saved-before-schema-fix.json,persistence-after-schema-before-restore.json,persistence-before-remote-ui-fix.json}`이다. .45의 최종 `persistence-summary.json`은 **15/15** 통과했다. 실제 Chrome API로 23개 설정, panel close local/sync 보존, 정상 browser restart의 실제 Hebrew/secondary slider UI, extension reload, local write 확인 후 process tree 강제 종료, 의도적 대기 0/50/350/1000ms에서 확인하지 않은 write의 종료 경계, 독립 프로필 전달/동시 편집/오래된 echo/원격 새 revision의 pending 취소/두 번째 프로필 재시작을 확인했다. 강제 종료는 CDP가 알려준 시험 browser PID의 자식 트리만 대상으로 했다.

강제 종료 4개는 대기 요청 0/50/350/1000ms, dispatch→kill 요청 실제 4/61/353/1015ms였고 각 1회 모두 새 값이 남았다. 이것은 모든 장치/부하/순간 종료/전원 차단의 데이터 영속성 보장이 아니다. 정상 종료와 storage API write 확인 후 강제 종료는 별도 조건이다. 보관 프로필은 OTTSub/artifacts 안의 새 시험 자료이고 사용자 profile은 쓰지 않았다.

독립 프로필 A/B는 같은 extension ID(`mfimjchmcgmpgbedelikgdijfboblkfn`)의 실제 local/sync API와 onChanged를 실행했지만 relay가 cloud transport를 대체했다. 실제 Google 계정·네트워크 cloud 전파·Mac 기기를 검증한 것이 아니다. 실제 배포 ID(`hlcahpgeildbabcchpkhemjjgjapbdkd`)와 이번 unpacked ID도 다르다. 두 기기의 실제 Sync는 같은 Chrome 계정/Sync 및 **같은 확장 ID**가 필요하다. 같은 제품명·ChatGPT 계정만으로 성립하지 않는다.

### 자동 회귀와 성능 계측 방식

최종 Windows 전체 오프라인 QA **105/105 suite, 130.0초** 통과: syntax 47/runtime 25/legacy 15/browser 18, 생략 그룹 없음·소스 변경 없음. 결과는 `artifacts/qa/2026-10-14T23-25-36-182Z-5332/summary.{md,json}`(UTC run ID)이며 새 실제 popup schema/선택 복원/remote UI 회귀를 포함한다. 기존 .41 ZIP 대조 하위 시험 1개는 이전 소스로 skip됐고 새 ZIP을 만들지 않았다.

성능은 `artifacts/qa/performance-persistence-20261015/performance.cjs`로 자체 생성한 **640×360 VP8 WebM, 약 30fps, 약 8초 반복 영상**을 재생한다. 실제 HTMLVideoElement/decoder/frame callback을 사용하며 Netflix API/CDN/원본 텍스트 입력은 모의다. local diagnostics를 제거한 release-like 실행 파일 복사본과 확장 없는 같은 영상 browser를 동시에 비교한다. 재생 15분/일시정지 15분, 30초 간격으로 Chromium process CPU 시간·Windows RSS/private memory·page heap/TaskDuration/DOM nodes/listeners·video quality를 기록한다. 각 상태의 시작/끝에 진단용 GC 후 retained heap/DOM도 기록하며 제품이 GC를 강제하도록 수정하지 않는다. 실제 cue를 바꾸는 +2초/0초 slider input 100회도 각 상태에서 실행한다. 측정용 sample/render 정수 카운터만 삽입하며 제품 소스를 바꾸지 않는다.

2분 preflight는 재생/paused/실제 이중 자막·계측 작동을 확인한 결과이고 `performance-preflight.json`에 보존했다. preflight는 전체 QA와 동시에 일부 실행됐으므로 최종 성능 수치로 쓰지 않는다. 최종 raw는 같은 폴더의 `performance-summary.json`, 집계는 `performance-analysis.json`, 시계열은 `performance-samples.csv`다. 실행 당시 드라이버는 `performance-long-run-source.cjs`로 보존했다. CPU percent는 1개 논리 CPU의 100% 기준이며 Task Manager의 시스템 전체 %와 그대로 비교하지 않는다. 프로세스 합계 RSS에는 공유 페이지 중복 계산이 있을 수 있어 private memory/heap도 함께 본다.

### 30분 완료 결과와 범위

2026-10-15 **08:28:27–08:58:38 KST**, 재생/일시정지 각 900초 측정을 완료했다. `passed: true`, 오류 없음·실행 중 제품 소스 변경 없음이다. 사용자 후속 메시지 때 이미 측정은 끝났고 최종 결과 정리가 남아 있었다. 환경은 Windows 10.0.26300 x64, Intel Core Ultra 5 125H/논리 CPU 18개/RAM 약 15.5GiB, Node 24.19.0, Chromium 151.0.7922.34다. 각 상태·browser당 초기 1개+30초 간격 30개로 총 124개 표본이며 CPU 평균은 초기 기준점의 null을 제외한다.

| 15분 상태 | 확장 사용 CPU 평균 | 미사용 CPU 평균 | 종료 private memory 사용/미사용 | GC 뒤 사용 page heap 시작→끝 |
|---|---:|---:|---:|---:|
| 재생 | 16.12% | 15.25% | 364.68 / 301.84 MiB | 2.382→2.642 MiB |
| 일시정지 | 0.67% | 0.26% | 355.56 / 282.95 MiB | 2.626→2.662 MiB |

이 조건에서 CPU 차이는 재생 약 0.86%p, 일시정지 약 0.41%p(모두 한 논리 CPU 기준)다. 값은 시험 browser 전체 프로세스 합계이며 차이를 모든 기기의 확장 단독 비용이나 배터리 개선율로 일반화하지 않는다. 확장 사용 private memory는 재생 402.65→364.68MiB, 일시정지 378.60→355.56MiB였고, GC 뒤 DOM은 두 구간 모두 documents 2/nodes 169/listeners 68로 유지됐다. retained heap의 전체 증가는 약 0.28MiB이며 이 30분에서는 지속적인 메모리 누수 근거가 관찰되지 않았다. 2시간·다수 작품/트랙·실제 Netflix/DRM의 누수 부재를 보장하지 않는다.

재생 계측 구간에서 사용 영상은 112회 반복·원본 cue 전환 450회, video quality frame 증가 24,614개/누락 0개였고 실제 주/보조 자막을 유지했다. 일시정지에서는 frame/cue 증가가 0이었다. 합성 영상의 프레임 결과를 실제 Netflix 4K 재생 품질로 확대하지 않는다.

30분 실행 종료 뒤 `burst-cost.cjs`로 별도 오프라인 browser에서 **각 상태 100회 input**, 의도적인 간격 10ms, 실제 popup→content→서로 다른 자막 텍스트 2개 변경과 최종 offset 0을 추가 확인했다. `burst-cost-summary.json`은 2/2 통과다. 재생/일시정지의 동기 input handler 합계는 34.7/25.6ms, 전체 dispatch 시간은 1,118.5/1,114.5ms(의도적인 대기 포함), popup script 시간은 59.8/45.5ms였다. video page script는 52.3/38.6ms(미사용 비교 2.2/0.46ms), 동일 관측 창의 browser CPU 시간은 사용 1,054/711ms·미사용 312/27ms였다. CPU 시간에는 비동기 렌더/메시징/저장·영상 부하가 포함돼 동기 handler 시간과 구분한다. 짧은 한 번의 부하 비교이며 모든 환경의 입력 지연 상한은 아니다.

이번 완료 범위는 로컬 성능·정상 재시작/확장 reload·명시한 강제 종료 조건·독립 프로필 relay다. **물리적 두 기기 사이의 Chrome cloud Sync는 미검증**이다. 해당 상태를 보류 해제나 로컬 통과로 덮지 않으며 계정 접근/로그인 요청도 하지 않는다. 기존 .41 ZIP은 보존했고 새 ZIP·스토어 조작·커밋/푸시는 하지 않았다.

## 2026-10-15 CDN 최소 권한 감사 — .44

현재 제품은 ISOLATED `src/network/track-fetcher.js`에서 HTTPS 허용 URL에 `fetch(..., {mode:'cors', redirect:'follow'})`를 호출한다. MAIN inject는 원본 페이지 응답을 관찰하며 popup/SW에는 자막 다운로드 proxy가 없다. Chrome/Chromium 공식 규칙에서 content-script CORS는 host_permissions로 우회하지 않는다. 현재 접근 권한은 Netflix의 content 주입/탭 URL/메시징을 위한 `https://*.netflix.com/*` 하나이며, `nflxvideo.net/nflximg.net/nflxext.com/nflxso.net`의 선언 권한 4개를 제거했다. downloader의 별도 5개 HTTPS URL allowlist는 유지한다.

보관된 실제 HAR `archive/docs/live-qa/2026-10-13-spanish-network/www.netflix.com.har`(SHA256 `f16b2a329f8619321fd595e0c5a50f0abafc2d76407d6e9fcfedea8cadef31f2`)의 507개 요청을 집계했다. Netflix 95/nflxvideo 185/nflxso 208/nflxext 4/nflximg 15개이며, subtitle MIME/WEBVTT/TTML 본문 식별 응답은 nflxvideo의 200 응답 11개이고 모두 Access-Control-Allow-Origin `*`가 있다. 단일 당시 재생 기록의 부재를 다른 CDN의 영구 미사용으로 단정하지 않는다. URL query·대사·쿠키/토큰은 결과에 내보내지 않았고 원본도 수정하지 않았다. 집계는 `artifacts/qa/cdn-audit-20261015/har-host-summary.json`이다.

`test_cdn_permissions_browser.cjs`는 실제 제품 복사본의 권한만 5개/Netflix 하나로 바꿔 별도 Chromium 프로필 2개에서 비교한다. 모든 Netflix/CDN 통신은 loopback TLS 서버로 연결하는 제한 프록시를 사용하며 인터넷으로 전달하지 않는다. 실제 ISOLATED downloader와 native browser CORS를 실행한다. 두 설정에서 4 CDN의 CORS 허용/거부, 같은 Netflix origin의 VTT, CDN 간 리디렉션, 403 거절 주소 보존, 미허용 호스트/HTTP 무요청 차단, MAIN에서 downloader 부재, 선언 권한과 Netflix 탭 URL 확인을 통과했다. 페이지 MAIN의 CORS 거부 대조도 실행해 시험이 실제 CORS를 검사함을 확인했다. 수정 전 비교 **30/30** 로그는 `artifacts/qa/cdn-audit-20261015/native-network-before.log`와 같은 폴더의 `native-network-before/cdn-permissions-measurements.json`이다.

첫 `comparison-before.log`는 Playwright route.fulfill 응답 주입에서 CORS 거부 조건이 통과해 비교 시험이 실패한 기록이다. 이를 권한 필요성/정상 동작 증거로 사용하지 않았고 native TLS 네트워크로 대체했다. 회귀에 쓰는 PEM은 tests/fixtures/cdn-network의 공개된 로컬 테스트용 자기서명 인증서/키이며 제품/패키지에 포함되지 않는다. 테스트 프로필·소켓·복사본은 종료 후 해제한다. 패키저는 Netflix 외의 선언 host permission이 다시 추가되면 차단하며 그 mutation 회귀를 추가했다.

최종 Windows 전체 오프라인 QA **105/105 suite, 129.3초** 통과: syntax 47/runtime 25/legacy 15/browser 18, 생략 그룹 없음·실행 중 소스 변경 없음. 결과는 `artifacts/qa/2026-10-14T17-37-10-779Z-27900/summary.{md,json}`(UTC run ID)다. 신규 CDN 비교 **30/30**, 기존 full extension MAIN/ISOLATED 재생/회차/팝업 회귀도 통과했다. 패키지 경계 6개 하위 검사 중 기존 .41 ZIP과 .44 소스 대조 하나는 구버전으로 skip됐으며 새 ZIP을 만들거나 검증한 것으로 집계하지 않는다. 문서 정리는 실행 후에 했고 제품/검사 소스를 추가 변경하지 않아 전체 QA를 반복하지 않는다.

실제 계정/Netflix/광고/DRM/Mac 실기를 재개하지 않았다. 이번 권한 축소는 현재 요청 경로에 대한 소스/공식 규칙/오프라인 확장 검증이며, 새로운 실서비스 대사/회차/성능 전체 합격은 아니다. 기존 .41 ZIP은 이전 권한 그대로 보존하며 새 배포 준비 요청 때 .44 이후 최신 소스로 패키징한다.

## 2026-10-15 히브리어 검수 후속 — .43

`1.3.3-local-hebrew-review-20261015.43`은 RTL HUD의 음수 부호 역전을 수정했다. `artifacts/qa/hebrew-review-20261015/bidi-before.json`에서 실제 Chromium Range 좌표로 히브리어/아랍어의 '-'가 0.5s 오른쪽에 그려지는 것을 확인했다. `_setMessage`의 LTR bdi 적용 후 `bidi-after.json`은 he/ar/en 모두 '-'→'0'→'.'→'5'→'s'가 왼쪽부터 증가하는 좌표로 바뀌었다. before/after PNG도 직접 확인했다. 동일 문자열을 유지하며 HTML을 파싱하지 않는다.

기존 `test_language_names_browser.cjs`에 he/ar/en × 음수/양수/0 값의 실제 글자 순서, 반복 알림 rAF, 늦은 알림 차단·언어 전환, HTML payload의 비실행 회귀를 추가했다. targeted 9/9 통과 로그는 `artifacts/qa/hebrew-review-20261015/targeted-language-names.log`다. 보고서의 키 수·복구 시간·동기 저장·실서비스 보장 등 25항목 판정은 [REVIEW](../OttsubAiTalk.md#gemini-히브리어-25항목-답변--43)에 있다. 최종 8언어 사전은 각 192개이며 he 규칙 README가 존재하는 것과 3개 공통 gate의 실제 적용·원어민 검수 완료는 구분한다.

최종 Windows 전체 오프라인 QA **104/104 suite, 125.6초** 통과: syntax 47/runtime 25/legacy 15/browser 17, 생략 그룹 없음·실행 중 소스 변경 없음. 결과는 `artifacts/qa/2026-10-14T17-13-58-743Z-30180/summary.{md,json}`(UTC run ID)다. 8언어 공통 번역 gate와 72개 패널 배치 상태도 통과했다. 보존된 .41 ZIP과 현재 소스를 대조하는 하위 시험 하나는 구버전 리비전으로 skip됐으며 현재 패키지 경계 시험은 실행했다. 별도 Chromium/임시 profile로 실행했고 사용자 Chrome/Google 계정에는 접근하지 않았다. 제품/검사 소스 수정은 이 최종 실행 전에 끝냈으며 이후 문서 정리 때문에 같은 QA를 반복하지 않는다.

이번에도 기존 .41 7언어 ZIP을 보존하며 새 ZIP을 생성하지 않았다. 다음 배포 준비에 he 스토어 설명·이미지를 포함하라는 요구를 기록했고 현재 게시 완료로 집계하지 않는다. Mac 추가 실기·실제 Netflix·장시간 성능/GC는 계속 보류다.

## 2026-10-15 히브리어 메뉴 — .42

사용자 요청으로 `1.3.3-local-hebrew-ui-20261015.42`에 he 메뉴를 추가했다. 공유 언어 gate는 8언어 × 192개 UI 항목의 누락·동적 변수·메타데이터 제한을 통과했다. 브라우저 검사는 320/360/430px × 8언어 × 연결/지연/미연결 상태 72개를 확인한다. 히브리어 선택 저장/재열기, RTL↔LTR 전환, 접근성 이름, 기존 후원 주소, 지역/CC 제공자 표시와 HUD/복구 안내 생성·갱신의 방향도 검사한다. 320px 히브리어 패널 스크린샷을 직접 확인했다.

최종 Windows 전체 오프라인 QA **104/104 suite, 130.5초** 통과: syntax 47/runtime 25/legacy 15/browser 17, 생략 그룹 없음·실행 중 소스 변경 없음. 결과는 `artifacts/qa/2026-10-14T16-55-45-109Z-22724/summary.{md,json}`(UTC run ID)이며 히브리어 화면은 같은 폴더의 `review-he-320.png`다. 앞선 `2026-10-14T16-53-39-553Z-15764`는 sandbox 기본 Playwright 경로에 실행 파일이 없어 87/104, `2026-10-14T16-54-19-371Z-18668`은 경로 지정 후 확장용 Chromium 5개가 시작 단계에서 종료돼 99/104였다. 별도 오프라인 임시 profile/TEMP를 OTTSub 안에 두고 sandbox 밖에서 최종 전체 검사를 통과했다. 제품 결함으로 분류하거나 브라우저 실패를 숨기지 않으며 앞선 로그도 보존한다. 기존 ZIP을 현재 소스와 대조하는 하위 시험 하나는 과거 리비전으로 skip됐고, 현재 패키지 구성/권한 경계 시험은 실행됐다. QA suite 통과를 새 ZIP 검증으로 쓰지 않는다.

오프라인 검사는 사용자 Chrome profile이나 실제 Netflix/Google 계정을 사용하지 않는다. .41 Mac 자동/실기 기록은 아래에 보존하며, .42 히브리어의 실제 Netflix·Mac·원어민 검수 완료로 확대하지 않는다. 기존 .41 7언어 ZIP은 그대로 보존했고 이번 소스 변경 후 기존 ZIP 대조 시험은 오래된 리비전으로 표시한다. 새 ZIP은 요청하지 않아 생성하지 않았다.

**2026-10-14 현재 Mac 검증은 일부 완료·전체 미완료다. 사용자가 추가 테스트를 나중으로 미뤘다.** 이 문서는 재개를 위한 기록이며, 지금 자동 QA/Netflix 조작을 시작하라는 지시가 아니다. 다음 작업자는 [AGENTS](../AGENTS.md) → [HANDOFF](HANDOFF.md) → 이 보고서 → [TODO](TODO.md) 순서로 읽는다.

## 2026-10-15 Windows 배포 파일 준비 검사

사용자가 요청한 1.3.3 ZIP·힌디어 등록 자료 준비에 필요한 로컬 검사만 실행했다. .41 제품 파일은 Mac 공유본과 같은 상태를 유지했다. 전체 Windows 오프라인 QA **104/104, 122.9초**, syntax 47/runtime 25/legacy 15/browser 17, 생략 없음·실행 중 소스 변경 없음. 결과는 `artifacts/qa/2026-10-14T15-53-40-018Z-22740/summary.{md,json}`이며 run ID는 UTC다. ZIP 검사 **5/5**와 공통 언어 gate의 7언어 검수도 통과했다.

`dist/ottsub-store-1.3.3.zip`의 실행 파일 56개가 패키저의 현재 허용 목록과 바이트 단위로 일치한다. `_locales/hi/messages.json`을 포함한 7언어, 진단/개발 자료 제외, 로컬 version_name 제거 및 기존 ZIP의 SHA256 보존을 확인했다. 힌디어 스크린샷 3장은 실제 제품 UI/제작용 모의 상태로 렌더링했고 1280×800 RGB JPEG·가로 넘침 없음·브라우저 오류 없음과 주요 문구/컨트롤의 잘림을 확인했다. 제작 원본과 검증은 `store_assets/hi`에 있다.

보류한 Mac 추가 실기·Netflix 조작·장시간 검증은 재개하지 않았다. Google 계정 로그인/접속·스토어 업로드·심사 신청도 하지 않는다. 로컬 검사 통과를 게시 완료로 집계하지 않는다.

## 로컬 자동 QA

프로젝트 OTTSub 루트에서 `node scripts/run-qa.cjs`를 실행한다. Node/Python/Playwright·Chromium이 필요하며 bundled runtime 경로는 현재 기기에서 확인한다. Windows exe 경로를 Mac에 재사용하지 않는다.

```text
node scripts/run-qa.cjs             전체 syntax/runtime/legacy/offline browser
node scripts/run-qa.cjs --quick     syntax/runtime만; 전체 합격으로 집계하지 않음
node scripts/run-qa.cjs --no-browser  browser 제외
```

검사는 네 컴퓨터의 CPU·RAM을 사용한다. 테스트 프로그램이 AI/API를 호출하지 않는다. 별도 오프라인 Chromium과 모의 Netflix 입력을 사용하며 실제 계정/사용자 Chrome 프로필을 사용하지 않는다.
결과는 [artifacts/qa/latest.md](../artifacts/qa/latest.md)→summary.md의 실패/범위→필요한 개별 log 순서로 읽는다. JSON에는 소스 hash·생략 그룹·시간·실행 중 변경 여부를 기록한다. 실패 기록도 보존한다. exit 0은 실행 범위 합격, 1은 실패/timeout/소스 변경, 2는 실행기 오류다.
새 스크린샷/로그/profile은 artifacts 아래에 둔다. 일반 QA가 docs/repair-* 폴더를 다시 만들지 않게 경로를 정리했다.

언어 검수는 `tests/fixtures/l10n`의 공통 gate 3개를 기본으로 읽는다. 원본 기준은 `app_common/l10n_engine`이고 복사일/SHA256은 `tests/fixtures/l10n/source.json`에 있다. 최신 공통 기준을 별도 검사할 때는 `OTTSUB_L10N_ENGINE` 또는 audit-l10n의 `--engine`으로 지정한다. 모든 공통 gate/원어민 검수의 합격을 의미하지 않는다.
숫자 replay는 `tests/fixtures/ad-clock-memory/{first,second}.json`과 `tests/fixtures/recovery-witness/timeline.json`을 읽는다. 원본에서 필요한 gate/bridge/clock 수치만 남기고 작품 ID·날짜·대사·요청 정보는 제거했다. 기존 baseline과 동일한 검증을 통과해야 한다. 원본 HAR/JSON은 archive에 그대로 보존하며 Git 대상에서 제외한다. baseline/player 기준본도 tests/fixtures를 사용한다.
Git으로 옮긴 폴더에는 archive/artifacts/dist가 없다. 자동 QA의 입력은 포함되지만 과거 Windows QA/역사 문서의 archive 링크는 원래 Windows 폴더에 있고, 이번 Mac 실행의 raw 자료는 검사한 Mac에만 있다. 새 QA를 실행하면 artifacts/qa가 다시 생성된다.

## 실제 Chrome·Netflix

설치/업데이트 후 OTTSub 확장과 Netflix 탭을 모두 새로고침하고 패널 끝이 `.41`인지 확인한다. 설치본은 하나만 켠다. 제공되는 주/보조언어의 준비됨·실제 표시·음성 타이밍을 확인한다.
seek/intro skip, 원본 언어/OFF 변경, 실제 광고 진입/종료, 다음 화, 탭 복귀, 잠금/hover·재생바 조작을 구분한다. 미검증 clock을 즉시 표시하지 않는 보호와 잘못된 이전 회차 대사 잔류를 구별한다. 광고가 안 나온 경우 광고 시험 합격으로 쓰지 않는다.
새 실패가 있을 때 작품/회차·선택 언어·설정·행동 순서를 먼저 기록하고 필요한 화면/진단을 수집한다. 정상일 때 같은 HAR/JSON을 반복 요구하지 않는다. 바탕화면 원본은 보관본 크기/SHA256 확인 뒤 해당 파일만 삭제한다.

## 실제 Mac — .41 일부 확인

GitHub 대상은 비공개 [K2Bact/OTTSub](https://github.com/K2Bact/OTTSub)의 main이다. Mac에서 K2Bact 계정으로 인증해 저장소를 clone하고 OTTSub를 연다. Chrome의 chrome://extensions에서 개발자 모드→Load unpacked로 manifest.json이 있는 폴더를 선택하고 Netflix 탭을 새로고침한다.
Mac의 Node/Python/Playwright·Chromium 위치를 먼저 확인한다. `OTTSUB_PYTHON`은 실제 Python 실행 파일, `NODE_PATH`는 Playwright가 설치된 node_modules, `PLAYWRIGHT_BROWSERS_PATH`는 실제 브라우저 캐시 경로로 지정할 수 있다. TEMP/TMP와 macOS의 TMPDIR는 OTTSub/artifacts/qa-temp로 지정해 임시 QA 자료도 프로젝트 안에 둔다. Windows USERPROFILE이 없으면 HOME을 사용하는 fallback을 사용한다. .41에서 실제 Mac runtime 및 별도 오프라인 Chromium 실행을 확인했으며 물리 키보드/IME 성공과는 구분한다.

| 실제 물리 입력/화면 | 기대 결과 |
|---|---|
| 패널 키 안내 | Mac에서 Option 표시 |
| `[` / `]`, backslash | 주언어 싱크 -/+0.1초, 초기화 |
| Option + `[` / `]`, Option+backslash | 보조언어 싱크 -/+0.1초, 초기화 |
| Option+D/B/L/R | 이중 자막/가림/위치 잠금/위치 초기화 |
| Command+L/F | Chrome 주소창/찾기 유지 |
| 입력창·한국어 조합·실제 배열 | 입력 보호, 특수문자/dead-key와 OTTSub 행동 분리 |
| 재생·drag·전체화면·seek·탭 복귀·다음 화 | 실제 대사/음성 싱크와 회차 소유권 확인 |

macOS/Chrome/키보드·입력 소스·source build/해시·작품/언어와 항목별 통과/실패/미실행을 기록한다. 합성 KeyboardEvent를 실제 Mac dead-key 성공으로 쓰지 않는다. 실제 Netflix·물리 4K·두 기기 cloud·장시간은 자동 QA와 별도다.
Mac 수정은 Windows에 자동 반영되지 않는다. 변경 파일과 hash·QA를 대조해 반영한다.

## 2026-10-14 Mac 중간 보고서 — .41

### 판정과 중단 지점

- **판정:** Mac 자동 QA 통과, 실제 Chrome 기본 동작 일부 확인, 포괄적인 Mac 호환성 검증 미완료. 현재 “수정하지 않은 재현 결함”으로 남긴 항목은 없지만, 미실행 범위에는 아직 발견하지 못한 문제가 있을 수 있다.
- **사용자 결정:** 테스트는 나중에 재개한다. 현재 수정본과 상세 보고서를 GitHub에 보관하는 데까지 진행한다. 추가 테스트/Netflix 조작은 요청 전까지 보류한다.
- **수정 기준:** 제품 version `1.3.3`, build `1.3.3-local-review-followup-20261014.41`. .40→.41에서 확인된 일반 결함을 고쳤고 Netflix 원본 request/profile·선택·광고/시계/회차 보호와 권한은 바꾸지 않았다.
- **검사 후 상태:** 주/보조 싱크 0.0초, 이중 자막 ON, 가림 OFF, 위치 잠금 OFF, 활성 싱크 대상 주언어. 찾기 문자열을 비웠고 Chrome 미디어 팝업에서 일시정지→재생 버튼 전환을 확인한 뒤 팝업을 닫았다. 이 기록은 종료 당시 상태이며 다음 실행 시의 상태를 보장하지 않는다.

### 기기·설치·실행 환경

| 항목 | 실제 확인값/범위 |
|---|---|
| Mac | macOS 26.6.2, build 25G83, arm64 |
| 실제 사용자 Chrome | 155.0.8059.40; `chrome://version` 화면에서 확인 |
| 오프라인 QA 브라우저 | Chromium 151.0.7922.34, Playwright 캐시 chromium-1234, 별도 임시 profile |
| Node / Python | 24.19.0 / 3.12.14 |
| 실제 소스/개발 확장 원본 | `/Users/gaejib/Workspace/Business/OTTSub` |
| GitHub | 비공개 K2Bact/OTTSub, main; 공유 전 기준 커밋 `56adb70` |
| 실제 콘텐츠 | 사용자가 연 Netflix 브레이킹 배드 시즌 1 1화; 주언어 자동 영어, 보조언어 한국어 |
| 실제 조작 방법 | CUA native macOS App을 통한 Chrome 조작, OS로 전달한 키와 접근성/화면 관찰 |
| 자동 QA 방법 | 실제 제품 파일 + 모의 Netflix 입력, 오프라인 Chromium MAIN/ISOLATED 확장 통합과 popup 검사 |

실제 Chrome 조작에는 별도 ChatGPT Chrome 확장을 설치하지 않았다. 오프라인 QA는 로그인한 사용자 Chrome profile을 사용하지 않는다. ChatGPT/Codex 로그인과 OTTSub 설치·Chrome Sync 로그인은 서로 다른 사항이다.

### OS 감지·단축키의 현재 구현

`src/core/platform.js`는 `navigator.userAgentData.platform`→`navigator.platform`을 기본으로 읽고, 사용 가능한 extension context에서는 `chrome.runtime.getPlatformInfo()` 결과를 반영한다. Mac은 `mac`, Windows는 `win`, Linux/ChromeOS 등은 `other`, 모르는 값은 `unknown`이다. Mac에는 Option, 그 밖에는 Alt 라벨을 표시하고 번역된 단축키 안내를 갱신한다. 이 기능은 .34부터 있었으며 .41에서 새로 만든 것이 아니다.

`src/input/keyboard-router.js`는 글자 결과 대신 `event.code`를 사용하고 Mac Option/Windows Alt의 공통 `altKey`로 보조 기능을 구분한다. `[`/`]`는 주언어 ±100ms, backslash는 주언어 초기화이며 Option/Alt를 더하면 보조언어다. Option/Alt+D/B/L/R은 이중 자막/가림/위치 잠금/위치 초기화다. Command/Ctrl/Shift/AltGraph·조합 중 입력·keyCode 229·입력/선택/shadow 입력과 반복 toggle은 보호한다. backslash 외 `IntlYen`/`IntlRo` 코드도 있지만 실제 JIS 하드웨어 검증은 아직이다.

OS에 맞춘 기본 키와 안내는 구현돼 있다. 사용자가 키를 자유롭게 재지정하는 설정 UI는 없다. Linux/ChromeOS의 인식 분기가 있다고 해서 해당 OS의 지원·실기 검증이 완료된 것은 아니다.

### 발견한 결함과 실제 수정

| 문제/재현 | 확인한 원인 | .41 수정 | 확인 근거 |
|---|---|---|---|
| 싱크를 저장한 뒤 패널을 열면 주언어 값이 0으로 덮임 | `attachRangeWheel` wrapper가 event를 연결할 때 `input`을 즉시 발행; 초기 slider 값이 설정으로 저장됨 | 연결 시 event 발행 제거 | 초기화 stack 추적, 저장값 패널 회귀 검사, 실제 Chrome 재열기 +0.1초 보존 |
| 저장값/단축키 변경과 주·보조 숫자/현재 slider가 맞지 않음 | popup 초기 복원·storage listener·live status 경로에서 두 offset 표시 갱신 누락 | 세 경로에서 기존 `updateDisplay`/`updateSecondaryDisplay` 호출; status는 유한 숫자만 반영 | 저장 +0.3/-0.2, 외부 revision 변경 +0.5/-0.3, live status +0.7/-0.4 및 실제 패널 확인 |
| HUD에 `hud_secondary_sync_adjusted`, `hud_pos_locked`, `{mode}` 등이 그대로 노출 | 사용 키와 기존 번역 키가 다르거나 blur mode 인자가 없음 | 기존 7언어 sync prefix+실제 초 값, 올바른 lock 키, 번역된 blur mode 전달 | 실제 content handler+engine+i18n을 7언어로 실행; 실제 Chrome 한국어 HUD |
| slider 값을 바꾼 직후 다시 0.0초가 됨 | popup은 `{offsetMs}`/`{deltaMs}`를 보내지만 content 네 분기는 객체 전체를 숫자로 사용 | 객체 내부 값과 legacy 숫자 모두 수신 | 수정 전 실제 수신 엔진 0≠300 실패, popup 실제 송신→production content 회귀, 최종 Chrome 주+0.2/보조+0.1 유지 |

제품 변경 파일은 `manifest.json`의 build 표기, `popup/popup.js`, `src/content.js`다. 새 제품 모듈/권한/호스트, storage migration, 구조 분할은 없다. 기존 숫자 offset 명령 호환성도 검사했다.

회귀 검사 변경은 `tests/helpers/content-harness.cjs`의 선택적 `beforeContent` 로딩 지점, platform runtime/browser의 실제 handler·두 엔진·저장/조회/휠·송수신 검사, native select browser 두 파일의 Mac 범위 표시다. 기존 정적 UI 검사에서 제품에 불필요한 `dispatchEvent` 문자열을 강요하던 단언은 제거하고 실제 wheel/ARIA 동작 검사로 보완했다.

### 자동 QA 실행 이력과 한계

| 실행 | 결과 | 의미 |
|---|---|---|
| .40 기준 `2026-10-14T13-37-23-412Z-89993` | 102/104, 약 98.5초 | 두 native select 키 입력 가정 실패. 다른 검사와 제품 결함을 구분 |
| .41 중간 `2026-10-14T13-51-55-133Z-94936` | 104/104, 약 93.6초 | 최종 slider payload 수정 전 결과이므로 최종 기준으로 쓰지 않음 |
| **.41 최종 `2026-10-14T14-04-35-375Z-97514`** | **104/104, 94.049초(표시 94.0초)** | payload 수정과 관련 회귀 검사를 포함한 최종 source 기준 |

위 run ID는 실행기가 남긴 UTC 형식 식별자다. 최종 합계는 개별 assert 개수가 아닌 **suite 수**다.

| 최종 그룹 | 통과/전체 suite |
|---|---|
| syntax | 47/47 |
| runtime | 25/25 |
| legacy | 15/15 |
| browser | 17/17 |
| 합계 | **104/104** |

최종 실패 0, 생략 그룹 없음(`skipped=[]`), 검사 중 소스 변경 없음(`sourceChangedDuringRun=[]`). 이 결과는 합성/오프라인 범위의 통과이며 실제 Netflix·물리 입력·음성 싱크 전체의 합격을 뜻하지 않는다. 이번 보고서 작성 중 제품 코드는 추가 변경하지 않았다. 최종 실행에 기록된 소스/검사 파일 142개의 SHA256을 모두 대조해 불일치 0개를 확인했고, manifest/popup/content 해시도 아래 표와 일치했다. 공유 문서의 파일 링크와 `git diff --check`도 확인했다. 문서 갱신 때문에 전체 QA를 다시 실행하지 않았다.

**Mac native select 대체 검사:** headless Mac에서 Windows식 Home/ArrowDown으로 선택 변경을 기대한 두 suite가 실패했고, 최소 HTML에서도 같은 입력으로 선택값이 바뀌지 않았다. Mac 분기는 `selectOption`으로 지원 항목 선택 가능/저장된 미지원 항목 disabled/선택 보존을 확인한다. JSON에 `nativeSelectKeyboard: "not covered headlessly; enabled selection API checked"`를 기록한다. Windows의 Home/ArrowDown 검사는 유지했다. “생략 그룹 없음”이 Mac native 키 동작까지 검사했다는 뜻은 아니다. 실제 정상 언어 메뉴의 Down/Up/Return은 아래 별도 관찰이며, **disabled 상태로 저장된 언어/CC에서 실제 키로 벗어나는 동작은 미실행**이다.

### 실제 Mac Chrome에서 남긴 14개 관찰

아래 키는 CUA가 OS에 전달했다. 사람이 실제 물리 키를 눌렀거나 IME 조합을 완료했다는 증거가 아니다. A는 마지막 slider payload 수정 전 .41, B는 수정 후 최종 .41이다. 같은 version_name을 쓴 두 단계라 아래 해시로 구분한다.

| 번호 | 입력/행동 | 관찰 결과 | source |
|---|---|---|---|
| 1 | Option+backslash | 보조언어 0.0초, 읽을 수 있는 0.0s HUD | A |
| 2 | Option+] | 보조 +0.1초, HUD/패널 일치 | A |
| 3 | ] | 주 +0.1초, HUD/패널 일치 | A |
| 4 | 패널 닫기→다시 열기 | 주/보조 +0.1초 둘 다 유지 | A |
| 5 | Option+L 두 번 | 위치 잠금 ON·번역 안내 확인 후 OFF 복원 | A |
| 6 | Option+B 두 번 | 가림 “보통(8px)” 안내 확인 후 OFF 복원 | A |
| 7 | Option+D 두 번 | 이중 자막 OFF 확인 후 ON 복원 | A |
| 8 | 주/보조 reset 및 설정 복원 | 양쪽 0.0초, 이중 자막 ON, 잠금 OFF | A |
| 9 | Command+L | Chrome 주소창(Omnibox) 열림 | A |
| 10 | Command+F, 한국어와 `[` 붙여넣기 | 찾기 필드에 문자열 표시; IME 조합 검사는 아님 | A |
| 11 | 찾기 입력 중 offset 확인 | 주/보조 0.0초 유지; 찾기 문구 제거/닫기 | A |
| 12 | [와 Option+[ | 주/보조 각각 -0.1초 독립 변경 후 0.0초 복원 | A |
| 13 | 주언어 slider 변경 | 주 +0.2초/보조 0.0초가 live status 조회 뒤에도 유지 | B |
| 14 | 보조 slider도 변경 | 주 +0.2초/보조 +0.1초 동시 유지; UI double click으로 양쪽 0.0초 복원 | B |

추가 관찰: 패널/진단이 .41로 일치했고 주 587묶음·보조 597묶음 준비 상태 및 영어/한국어 대사 동시 노출을 확인했다. 정상 주언어 메뉴에서 Down으로 한국어까지 이동하고 Up/Return으로 원래 자동 영어 선택을 유지했다. 이는 선택된 disabled 항목의 키 탈출 검사가 아니다.

CUA `typeText`로 한국어를 보내려는 시도는 공백으로 전달돼 붙여넣기 시험으로 분리했다. 이를 제품 IME 실패나 한국어 물리 조합 성공으로 집계하지 않는다. 실제 소리를 듣고 싱크를 판정한 적은 없다. 페이지에 “광고”라는 접근성 label이 있었다는 사실도 실제 광고 진입·종료 성공의 증거로 사용하지 않는다.

### 최종 소스 식별

| 파일 | 최종 .41 SHA256 |
|---|---|
| `manifest.json` | `8e249c9abd7a47d44b6329dd844604ecd0f212e101a5728c7757272e50dc280d` |
| `src/content.js` | `f41e345fa9cce3d5bffa11c7fd39d561f24310e3bc2d689205ca43ecd55ca900` |
| `popup/popup.js` | `8c5987e0e51db3a691a84d629a9b92cf0ebbc7c5417600cae3139c2e20ed06df` |

실제 관찰 A의 content 해시는 `e1580137b750eb0d982b2a2cf54daec5f430eeb4b76c4f748af2c436f50a9587`, manifest/popup은 위 최종과 같다. 관찰 B와 최종 전체 자동 QA는 위 최종 해시다. A의 키 관찰을 최종 content 해시에서 모두 다시 수행했다고 기록하지 않는다. 최종 수정은 offset 명령 수신 네 분기이며 해당 회귀는 최종 전체 QA에 포함됐다.

### 남은 Mac 시험과 미완료 이유

| 범위 | 아직 없는 증거 | 재개할 때 확인할 것 |
|---|---|---|
| 전체화면/창 크기/drag/hover/잠금 | 실제 플레이어 전체 상호작용 조합을 아직 실행하지 않음 | 진입/해제·resize·이동·hover pause/resume·재생바 간섭·Option+R·위치 보존 |
| seek/intro skip/탭 복귀 | 오프라인 guard 회귀와 실제 서비스 조작은 별개 | 앞/뒤 탐색, 목적지 cue와 검증된 clock, 복귀 후 올바른 대사 |
| 회차 전환 | 수동/자동 다음 화를 실제로 통과한 기록 없음 | 새 owner 확정 전 이전 회차 자막 차단·다음 화 대사/언어 |
| 언어/일반·CC/원본 자막 | 기본 영어/한국어만으로 모든 조합을 증명하지 못함 | 주/보조 교체, 원본 ON/OFF, unavailable 저장 항목의 native-menu 이동, 중앙 modal |
| 실제 광고/토큰 갱신 | 실제 광고 진입/종료·CDN 재발급을 관찰하지 않음 | 실제 발생 시 clock/ad guard와 본편 복귀; 광고가 없으면 미실행 유지 |
| 성능/재시작/영속성 | 약 30분 CPU/heap 및 Chrome 재시작·강제 종료 시험 없음 | playing/paused·cue 변경 연타·설정 보존을 별도로 계측 |
| 물리 키보드/한글 IME/Option dead-key | OS 자동 입력과 붙여넣기는 물리 조합의 증거가 아님 | 실제 배열·입력 소스·조합 문자열과 단축키 충돌 |
| 음성 체감 싱크 | 사람이 소리를 듣고 비교하지 않음 | 실제 대사와 소리의 타이밍, 조정 후 체감 |
| 두 기기 Sync/물리 4K/장시간 | 두 Chrome 환경·실제 display·장시간 실행 자료 없음 | Chrome 계정/Sync, 실제 DPR·선명도, 누수 의심 시 30분→2시간 |

위 항목은 사용자 요청으로 지금 추가 실행하지 않는다. 도구로 가능한 실제 Chrome 조작은 에이전트가 맡고, 물리 키/음성 등 확보할 수 없는 증거만 필요할 때 이유와 최소 확인을 요청한다. `미실행`은 사용자에게 전부 수동 작업을 지시한 상태가 아니다. Linux/ChromeOS는 별도 지원 범위다.

### 로컬 원본 증거의 위치와 GitHub 보고 범위

원본 로그·스크린샷·profile·진단은 `.gitignore`로 제외한다. 아래 경로는 **이 Mac의 로컬 상대 경로**이며 GitHub의 다른 clone에 파일이 없어도 정상이다. 이 보고서의 표·해시·한계가 Git으로 공유하는 인계 기록이다.

| Mac 로컬 경로 | 내용 |
|---|---|
| `artifacts/qa/2026-10-14T14-04-35-375Z-97514/summary.{md,json}` | 최종 전체 결과, 개별 suite, source hashes |
| `artifacts/qa/latest.{md,json}` | 위 최종 실행을 가리키는 현재 결과 |
| `artifacts/qa/mac-live-20261014.json` | 14개 실제 관찰과 A/B source snapshot, 종료 상태 |
| `artifacts/qa/mac-followup-before/` | 회귀 재현에 필요한 수정 전 파일 일부 |
| `artifacts/qa/mac-select-precheck.json` | 최소 native select Mac 키 입력 관찰 |
| `artifacts/qa/mac-regression-before-runtime.log` / `mac-regression-before-browser.log` | HUD·패널 실패 기록 |
| `artifacts/qa/mac-targeted-after/sync-opening-debug.json` | 초기화 input→주언어 0 저장 원인 추적 |
| `artifacts/qa/mac-payload-before-runtime.log` | 수정 전 객체 명령의 엔진 값 0≠300 실패 |
| `artifacts/qa/mac-targeted-final/` | 최종 targeted runtime/browser 결과 |
| `artifacts/qa/handoff-20261014-before/` | 이번 보고서 정리 전 문서 보관본 |

GitHub에는 기존 현재 문서 6개를 갱신하며 별도 중복 보고서 파일은 만들지 않는다. .41 코드·회귀 검사·루트 README/지시사항도 같은 공유 단위다. `archive/artifacts/dist`, 원본 HAR/진단, Chrome profile과 ZIP은 올리지 않는다. 스토어 심사/출시와 이번 main 공유는 다른 작업이다.

### 재개 시 실행 환경

아래는 **기록용 명령**이다. 현재는 테스트 보류 상태다. 재개 요청을 받은 뒤 실제 폴더/Git 상태/Chrome 설치본을 먼저 확인하고 필요한 검사를 실행한다. 다른 Mac/Windows에서는 runtime 경로를 다시 확인한다.

현재 Mac의 프로젝트 루트에서 사용한 환경:

```sh
env NODE_PATH=/Users/gaejib/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  OTTSUB_PYTHON=/Users/gaejib/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/artifacts/qa-browsers" \
  TMPDIR="$PWD/artifacts/qa-temp" TEMP="$PWD/artifacts/qa-temp" TMP="$PWD/artifacts/qa-temp" \
  /Users/gaejib/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-qa.cjs
```

브라우저 캐시·임시 경로가 없는 clone에서는 프로젝트의 `artifacts` 아래에 준비한다. 기본 절차는 이 문서 앞부분과 `scripts/run-qa.cjs`를 따른다. 계정 로그인이나 자동 QA 통과만으로 물리 키/실제 음성/광고/회차 검증을 완료 처리하지 않는다.
