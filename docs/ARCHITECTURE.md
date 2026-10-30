# 모듈화 현황 — 1.3.9 / .71

2026-10-30 .71 권리 고지는 정적 popup anchor/CSS와 웹사이트 rights.json 렌더링으로 연결한다. 새 런타임 모듈·state·API·권한·load 순서 변경 없이 루트 LICENSE를 미래 package-store.py의 명시적 필수 파일로 포함하고 QA 입력 해시에 추가했다. 기존 생성된 사이트 미리보기도 전체 조건 LICENSE.txt를 포함한다. [검증](QA.md#rights-reserved-20261030).

2026-10-29 프랑스어는기존src/i18n.js 사전·fr metadata·메뉴option만추가하고기존UI정규화/Intl라벨formatter를재사용한다. 제품모듈/state/load순서/권한·Netflix트랙identity는그대로다. audit-l10n에는공통Gate10을고정fixture와연결해새문구의조판회귀를막는다. [현재검사](QA.md#french-ui-20261029).

2026-10-29 배포 준비는 manifest 버전만1.3.9/.69로 올렸다. 모듈·state 소유권·API·load 순서는 .68과 같다. 기존 package-store.py의 허용목록과 개발용 version_name 제거를 재사용하며 실제 ZIP에서 개발 보고서 링크 숨김을 검증했다. [배포QA](QA.md#release-139-20261029).

2026-10-29 검사보강: 새제품모듈/state이동없이tests/test_status_churn_browser.cjs가현재popup을읽어임시확장에복사하고content상태응답만fixture로대체한다. 탭API와popup/status-connection은실제동작하며guard변형은산출물사본에서만한다. 기존compound suite는페이지생성부를로컬함수로재사용해kind/OFF조합을추가했다. 제품모듈/manifest/버전은유지. [검증과경계](QA.md#context-churn-20261029).

2026-10-29 .68: 새 제품 모듈이나 state 소유권 이동 없이 기존 run-qa의 summarizeOutput/run에서 보고서 계약/종료 판정을 강화했다. 이름으로 한정한 episode 무개수 계약은 유지하며 새 회귀파일을 정식 runtime job에 포함했다. side-panel worker는 시작당1회 API등록만 소유하고 try/await/catch 진단 후 종료하며 설정 캐시/재시도/timer를 만들지 않는다. manifest는 API하한114·개발버전.68만 갱신했다. [구현·검사](QA.md#qa-panel-fixes-20261029).

2026-10-22 .67: 홈페이지 연결은 정적 HTML anchor·CSS 포커스 표시·manifest homepage_url만 추가한다. 모듈·API·state·load 순서·권한은 바뀌지 않는다. 기존 캡처 도구에 --zip-runtime을 추가해 별도 추출본과 실제 ZIP 영수증의 전 파일 해시를 대조한다. [검사](QA.md#homepage-link-20261022)를 따른다.

2026-10-22 배포 .66은 .65 제품 로직을 유지하고 manifest 버전만1.3.8로 올린다. package-store.py의 기존 src/popup/_locales/icons allowlist를 그대로 사용하고 version_name·개발 도구를 제외한다. capture-localized.cjs의 기존 실제 ZIP 캡처 경로에 fi만 추가했다. 현지화 설명의 언어 목록을16개로 갱신하며, 기존 설명 검사도 해당 inventory 단락만 새 목록으로 검증하고 기능/단축키 문단은 보존하도록 맞췄다. 앱 모듈·state 소유권·API·load 순서는 바꾸지 않았다. [검사](QA.md#release-138-20261022)·[AI 기록](../OttsubAiTalk.md#release-138-20261022)를 따른다.

2026-10-22 홈페이지는 content.json의 en/ko/es 목록을 기준으로 언어별 페이지·상호 이동·hreflang·사이트맵을 만든다. 언어 탐색은 상대 URL의 정적 링크이며 JS·탐지/리다이렉트·저장 상태가 없다. navLabel/nativeName과 예시 대사의 언어 태그는 각 페이지 데이터가 소유한다. 캠페인 언어도 같은 목록으로 검증하며 앱 UI/자막 트랙의 언어 정책과는 독립이다. CSS의 언어 버튼 묶음은 좁은 화면에서 줄을 바꾼다. rollback 범위는 archive/docs/site-spanish-20261022/before와 public-before다. [검사](QA.md#site-spanish-20261022)·[AI 기록](../OttsubAiTalk.md#site-spanish-20261022)를 따른다.

2026-10-22 GEO 외부 도구: store_assets/geo/content.json·privacy.json·campaigns.json을 build.cjs가 정적 HTML로 만든다. 캠페인 값은 출처와 언어·버튼 위치에 한정한 고정값이며 query/시청 정보·개인 식별자를 전파하지 않는다. canonical/schema URL은 캠페인 링크와 분리한다. 제품 런타임·권한·모듈 소유권 변화는 없다.

measure.cjs는 사용자가 정규화한 집계 CSV를 로컬에서 읽고 HTML/JSON만 출력한다. 상태 저장·계정/API·예약 실행이 없으며, 동일 속성·시간대·필터·모집단·범위·연속7일에 한해서 비교한다. 사용자 수의 채널 합산을 만들지 않고 테스트/미확인을 구분한다. 검사는 store_assets/geo/test-measure.cjs 및 verify-improvements.cjs에 있다. 공개 배포에는 이 도구와 입력을 넣지 않는다. rollback은 archive/docs/geo-improvements-20261022/before와 public-before에 보관한 범위로 한정한다. [검사](QA.md#geo-improvements-20261022)·[AI 기록](../OttsubAiTalk.md#geo-improvements-20261022)를 따른다.

2026-10-22 .65는 기존 i18n의 fi 사전과 popup UI 목록을 확장한다. UI 지역 정규화는 기존 resolveLanguage가 맡고 자막 track identity resolver는 그대로다. popup의 기존 DOMContentLoaded에서 version_name에 -local-이 있을 때만 내부 보고서 링크를 채우고 표시한다. 새 권한·background 메시지·저장 키·구독·제품 모듈 소유권 이동은 없다.

보고서 tools/dev-research/report.html의 상태는 별도 페이지가 소유한다. report.js는 해당 페이지의 검색/필터/가정 계산/인쇄 DOM 이벤트만 관리하고, 탭이 닫히면 함께 종료된다. MV3의 inline script 제한 때문에 원본 HTML의 스크립트를 외부 파일로 제공했으며 CSP를 완화하지 않았다. 로컬 보고서 원본은 artifacts/research에 보존하고 배포 입력은 기존 src/popup/_locales/icons allowlist를 유지한다. 정식 QA는 dev-research의 HTML/JS도 해시에 포함한다. rollback은 archive/docs/finnish-ui-20261022/before의 기존 파일과 이번 fi·dev-research·신규 browser test 추가분으로 범위를 한정한다. [검사](QA.md#finnish-ui-20261022)·[AI 기록](../OttsubAiTalk.md#finnish-ui-20261022)를 따른다.

2026-10-21 .64는 content가 이미 소유하던 hover 설정·debounce·pause 소유권을 내부 `setHoverPauseEnabled`에서 함께 해제하는 보완이다. 제품 모듈·공개 API·state 소유권 이동·manifest load 순서·권한 변경은 없다. 현재 video와 기존 canDisplay 조건을 통과한 소유 pause만 재개한다. renderer와 clock/ad/seek/episode guard는 변경하지 않았다. [근거·QA·rollback 원본](QA.md#transition-review-20261021)을 따른다.

2026-10-21 .63은 기존 parser·sync-engine 입력 검증과 단일 모드 CSS 경계 보완이다. 제품 모듈·공개 API·state 소유권·initialization/cancel/destroy·manifest load 순서·권한은 변경하지 않았다. 검사 전용 파일 2개를 정식 실행 목록에 추가했다. [근거·QA·변경 전 백업](QA.md#boundary-review-20261021)을 따른다.

2026-10-21 .62 재검수는 기존 `status-connection.stop()`의 소유 리스너 제거와 sync-engine의 문자열 절단 경계 보완이다. 제품 모듈·공개 API·state 소유권·manifest load 순서·권한 변경은 없다. 새 runtime/browser 파일은 검사 전용이다. 기존 request/profile·원본 선택·clock/ad/seek/episode guard는 그대로다. [검사·rollback 백업](QA.md#full-review-20261021)을 따른다.

2026-10-21 .61 품질 보강은 기존 parser/renderer/popup/i18n 내부 수정이며 제품 모듈 분리·새 API·state 소유권·manifest load 순서·권한 변경은 없다. parser는 선형 태그 정리, renderer는 기존 fullscreen watchdog 세대 무효화, popup은 이름/대비/안내를 보완했다. 새 tests/helpers는 검사 입력 목록과 오프라인 페이지 제공만 소유하고 제품에서 로드하지 않는다. Netflix request/profile·원본 선택 및 clock/ad/seek/episode guard는 변경하지 않았다. [QA](QA.md#quality-20261021)와 변경 전 archive/docs/quality-20261021/before를 따른다.

2026-10-20 .59 배포 준비는 .58 제품 로직의 version/version_name 변경이다. 새 모듈·API·state 소유권·load 순서·수명·권한 변경은 없다. 러시아어 스토어 캡처는 기존 공통 제작 도구에 ru 입력을 추가했다. [검사](QA.md#release-137-20261020)를 따른다.

2026-10-20 GEO는 `store_assets/geo`의 정적 콘텐츠·생성 도구·검사 범위다. 확장 manifest·제품 모듈·load 순서·state 소유권과 API는 바꾸지 않았다. 공개 파일 생성은 소개 페이지 자산만 허용하며 앱 소스를 포함하지 않는다. [기록](../OttsubAiTalk.md#geo-implementation-20261020)을 따른다.

2026-10-20 AEO 접근성 보강은 기존 popup/i18n 경계의 속성 바인딩 추가다. 새 모듈·API·state 소유권·load 순서·구독 수명 변경은 없다. [검토](../OttsubAiTalk.md#aeo-review-20261020)·[검사](QA.md#aeo-review-20261020)를 따른다.

2026-10-20 .58은 기존 i18n/popup 경계에서 러시아어 ru를 추가했다. 기존 UI resolver가 ru-RU/ru_RU 등 UI 표기를 ru로 해석하며 subtitle resolver/BCP-47 identity는 바꾸지 않는다. Cyrillic은 여러 언어가 공유하므로 러시아어 제공자 라벨은 명시적 labelLocale의 ru 출처와 문자 가드를 함께 확인한다. 다른 문자계/출처일 때는 Intl 표시를 쓰고 트랙 자체는 수정하지 않는다. 새 모듈/API/state 소유권·load 순서·구독 수명·권한 변경은 없다. [검사](QA.md#russian-ui-20261020)를 따른다.

2026-10-20 검수 후속은 정식 QA 입력 경계를 STORE_GUIDE까지 확장한 검사 도구 수정이다. 제품 모듈/API/state 소유권·load 순서·수명·권한에는 변경이 없다. [검사와 범위](QA.md#full-program-review-20261020)를 따른다.

2026-10-19 .57 업로드 준비는 manifest version/version_name 변경뿐이다. .56 실행 로직·모듈/API/state 소유권·load 순서·수명주기·권한은 같다. 설명/패키지 확인은 [QA](QA.md#release-136-20261019), AI 기록은 [OttsubAiTalk.md](../OttsubAiTalk.md#release-136-20261019)를 따른다.

2026-10-19 [AI 대화 통합·포르투갈어 검수 후속](../OttsubAiTalk.md#pt-pt-review-20261019)은 문서 진입점 변경이며 제품/API/state 소유권·load 순서·수명주기 변경은 없다. 구조에 관한 AI 의견도 앞으로 OttsubAiTalk.md에 기록한다.

2026-10-19 .56은 기존 i18n/popup 경계에서 포르투갈용 `pt-PT`를 추가했다. `resolveLanguage`의 Portugal prefix 정규화·`_locales/pt_PT`·`data-english-name="Portuguese (Portugal)"`을 연결했다. `ui-dual`은 명시적 Portugal labelLocale와 기존 타 문자 가드를 사용하며 제공자 출처가 다른 경우 Intl 표기를 쓴다. 실제 subtitle resolver/identity는 별개다.

새 모듈/API/state 소유권·load 순서·구독 수명 변경은 없다. 저장소의 `pt-pt`를 기존 UI resolver가 `pt-PT`로 복원하며 나머지 12사전은 그대로다. 검사는 [QA](QA.md#2026-10-19-포르투갈어포르투갈-메뉴--56)를 따른다. 기기 간 동기화는 사용자 요청으로 향후 과제에서 제외했으며 이 지시가 아래 과거 계획보다 우선한다.

2026-10-19 GitHub 공유 점검의 실행 도구 변경은 run-qa 수집기의 __pycache__/.pyc 제외다. Python bytecode는 import가 갱신하는 생성물이며 검사 소스/입력에 포함하지 않는다. 제품 모듈/API/state 경계는 바꾸지 않았다. 실행 suite는 기존 105개 그대로이고 hash 대상은 152→151이다. [최종 공유 QA](QA.md#2026-10-19-공유용-qa-입력-정리--55-유지)를 따른다.

2026-10-18 동기화 정식 검사 편입은 **제품 모듈/API/state 소유권 변경 없음**이다. tests/test_settings_sync_browser.cjs는 과거 조사 artifacts에 의존하지 않고 현재 제품을 별도 runtime으로 복사해 독립 프로필 두 개의 실제 storage/onChanged/popup을 검사한다. relay가 transport를 대신하는 경계는 유지한다. run-qa에 browser 1개만 등록했으며 19→20 suites다. JSON stdout은 passed/total/cases/errors와 원본 result 경로를 제공하고 별도 실행 폴더에 snapshot/UI/event를 보존한다. 전체 105/105와 음성 대조군의 실패 검출은 [QA](QA.md#2026-10-18-동기화-정식-자동검사-편입--55-유지)를 따른다. 실제 두 기기/계정 접근은 사용자 보류/금지를 유지한다.

2026-10-18 설정 동기화 보완은 **제품 모듈/API/state 변경 없음**이다. `settings-revisions`의 항목별 n/origin/value 계약과 popup settings-binding을 현재 실제 확장 프로필 두 개에서 확인했다. 새 시험 도구는 per-key payload를 선택적으로 전달·보류하며 cloud transport를 대체한다. raw/revision 분리 도착 시 local/UI 보존과 시작 시 sync raw 복구, 실패한 sync 호출 후 시작 시 local revision 재전달까지 관찰했다. 이를 cloud 전파·영구 자동 재시도 보장으로 확대하지 않는다. [계획/결과](QA.md#2026-10-18-두-기기-설정-동기화-보완--55-유지)를 따른다. source 151개는 기존 .55 그대로다.

2026-10-18 Gemini 대만 검수 후속은 **제품/API/state 변경 없음**이다. 원본 12언어 loop가 comparator를 재구현한 한계를 실제 popup 12개 초기화/저장 snapshot reload로 보완했다. `resolveLanguage`는 나열된 6태그만 받는 allowlist가 아니라 TW/Hant prefix 기반 UI resolver이며, `ui-dual`의 TW/Hant labelLocale+Han 근거는 제공자 locale 신뢰 계약이다. 둘 다 한자 정서법 필터나 실제 track identity 병합으로 확대하지 않는다. 판정은 [REVIEW](../OttsubAiTalk.md#gemini-대만-번체-9라운드-보고서-대조--2026-10-18), 실행은 [QA](QA.md#2026-10-18-gemini-대만-번체-검수-후속--55-유지)를 따른다. 기존 .55 구조와 정식 검사 151개 소스는 유지한다.

2026-10-18 .55는 기존 i18n/popup 경계 안에서 번체 중국어(대만)와 언어 정렬을 추가한다. 새 파일/모듈 분리는 하지 않았다. `OTTSubI18n.resolveLanguage(lang)`는 UI 전용으로 TW/Hant를 canonical `zh-TW`에 매핑하고 기존 11언어는 base locale을 지원한다. `detectBrowserLanguage()`는 Chrome UI→navigator→en 순서다. setLanguage/t/updateDOM도 동일 resolver를 사용한다. Chrome 폴더 `zh_TW`는 audit 입력에서 `zh-TW`로 매핑한다. subtitle의 track-languages resolver와 별개이며 두 코드 경계를 합치지 않는다.

`popup.js`의 내부 `orderUILanguages(systemLanguage)`는 DOMContentLoaded 때 한 번 실행한다. 각 option의 `data-english-name`으로 영어 이름 정렬하며 시스템 언어만 첫 행으로 올리고 선택값은 보존한다. 이후 settings-binding이 저장한 명시적 선택을 복원한다. 수동 전환 시 재정렬하지 않으므로 선택 언어와 시스템 기준 행은 별개다. 기존 storage guard는 `zh-tw` 소문자로 저장하며 UI resolver가 `zh-TW`로 복원한다. revision/동기화 소유권·구독/해제 수명은 바꾸지 않았다.

`ui-dual`은 명시적 TW/Hant labelLocale와 Han 문자가 있을 때 번체 provider 이름을 채택하고 그 외에는 기존 번역/Intl 경로로 표시한다. Han 문자만으로 Traditional/Simplified를 구분하지 않으며 실제 자막 track/CC identity나 fallback 목록은 그대로다. 정식 검사 10파일을 12언어/순서/저장/identity로 확장했다. 검사와 보존 범위는 [QA](QA.md#2026-10-18-대만-번체-메뉴와-언어-정렬--55)를 따른다. 아래 .54 이하 내용은 당시 구현 기록이다.

2026-10-18 .54는 검수 완료한 .53의 제품 로직을 유지한 배포 버전 변경이다. manifest version/version_name만 올렸고 새 모듈/API/state 소유권이나 권한 경계는 바꾸지 않았다. 정식 검사 3개의 과거 ZIP 허용 버전에 1.3.4를 추가했으며 스토어 캡처 helper의 locale 허용 목록만 bn/tr로 확장했다. 아래 .53 이하 구조는 당시 구현 기록이며 [배포 QA](QA.md#2026-10-18-135-배포-준비--54)를 따른다.

2026-10-18 .53은 기존 i18n에 터키어 192문구/Chrome locale과 popup 선택/허용 목록을 추가한 변경이다. 기존 base-language 감지·storage revision·LTR 처리·Latin provider labelLocale/Intl 경로를 재사용한다. ui-dual의 문자 판정이나 새로운 모듈/API/state 소유권은 바꾸지 않았다. 메뉴 tr-TR 감지는 실제 자막 tr/tr-TR 병합 근거가 아니다. 검사와 변경 경계는 [QA](QA.md#2026-10-18-터키어-메뉴--53)를 따른다. 아래 .52 이하 내용은 당시 구현 기록이다.

현지화 검사의 실행 경계(2026-10-18): `scripts/audit-l10n.cjs`는 pinned 또는 명시한 shared engine의 gate1/gate2/OTTSub profile만 호출한다. 규범 README 추가는 실행 gate 연결이 아니다. 이번 보고서 후속의 shared gate12는 일회성 조사에서 직접 호출했으며 정식 실행기/모듈 경계는 변경하지 않았다. 결과는 [QA](QA.md#2026-10-18-gemini-벵골어-검수-후속--52-유지)를 따른다.

2026-10-18 .52는 기존 i18n에 벵골어 192문구·Chrome locale 메타데이터와 popup 언어 허용/선택 항목을 추가한 변경이다. 기존 navigator base-language 감지·settings binding/revision·LTR 경로를 그대로 사용한다. 제공자 이름 표시에는 Bengali 문자 범위/locale 근거를 추가하되 실제 트랙 지역/CC identity는 바꾸지 않는다. 새 모듈/API/state 경계나 권한 변경은 없다. 검사/보존 범위는 [QA](QA.md#2026-10-18-벵골어-메뉴--52)를 따른다.

2026-10-16 wheel 후속은 **검사 도구 경계 수정**이다. 공용 popup fixture의 local/sync 데이터와 이벤트 영역을 분리하고 no-op 변경 이벤트를 제거했으며 sync catch-up/UI 회귀를 추가했다. 제품의 storage guard/revision·status 연결·input handler·모듈/API는 바꾸지 않았다. Gemini의 시간 기반 입력 guard와 poll 억제는 채택하지 않았다. [판정](../OttsubAiTalk.md#gemini-wheel-기초-조사-대조--2026-10-16), [재현/실제 API 비교/검증](QA.md#2026-10-16-wheel-간헐-실패-후속--51-제품-유지)을 따른다. 아래 Linux 계획은 작성 후 사용자 지시로 실행 보류 상태다.

2026-10-16 Linux 계획에는 제품 모듈/API 변경을 포함하지 않는다. 현재 platform.js의 Linux→other/Alt 계약과 runtime fallback을 실제 Linux에서 확인할 계획이다. 제출 ZIP 실행 트리와 .51 개발 QA 트리를 별도로 고정하며, Windows 공유 폴더 대신 프로젝트 안의 VM 디스크/ext4에서 경로 대소문자와 native 확장 수명을 검사한다. 계획/입력/판정 경계는 [QA](QA.md#2026-10-16-linux-가상환경-검증-계획--실행-전)에 있다. 실행 결과가 아니다.

.51 배포 준비는 제품 module/API/state 변경이 없다. manifest의 version/version_name만 1.3.4로 올리고, 고정된 과거 ZIP 허용 목록에 1.3.3을 추가했다. screenshots 제작 도구는 store_assets/common에 두며 ZIP에서 추출한 popup을 읽는다. 별도 mock Chrome API/예시 트랙은 등록 이미지 제작에만 사용하고 배포 파일에 포함하지 않는다. 기존 .50 제품/검사 수명은 아래 기록을 따른다.

파일 배치 정리(2026-10-15): 제품/검사/도구 경계와 module/import 경로는 유지한다. docs에는 현재 문서 6개만 두고 원본 검수는 `archive/docs/reviews`, 생성 로그는 `archive/generated`, 정리 도구·이동표/해시는 `archive/maintenance`에 둔다. 자동 QA/스크린샷·프로필 설정은 `artifacts/qa`, 반복 검사의 기준 파일은 `tests/fixtures`다. 외부 런타임 junction과 프로필 storage는 캐시 제거 대상에서 제외한다.

.50은 기존 상태 안내 UI의 접근성 수리다. `ui-popover.js`의 currentPopoverTarget 소유권과 show/hide API는 유지한다. show는 이전 trigger expanded를 정리하고 이름/설명이 있는 비모달 dialog의 닫기 버튼으로 focus를 옮긴다. hide는 원래 trigger로 복귀하거나 바깥 클릭의 숨은 focus를 해제한 뒤 aria-hidden을 적용한다. 저장/전송/전역 키 라우팅·시계 guard는 바꾸지 않는다. rollback 단위는 기존 popup.html/ui-popover.js와 두 회귀 검사·manifest build label이며 새 모듈화가 아니다. 보고서의 Shadow DOM/1초 rect cache/검증 우회 배속 보정은 구체 재현·측정 근거가 없어 채택하지 않았다. 세부 판단/검사는 REVIEW/QA의 .50 절을 따른다.

.49는 기존 i18n에 말레이어 192문구, popup의 언어 허용 목록/선택 옵션과 확장 locale을 추가한 변경이다. 기존 브라우저 base-language 감지와 settings-binding/storage를 그대로 사용하며 새 모듈/API/state 소유권은 없다. LTR과 현재 9언어를 검증하고 실제 자막 언어·지역/CC identity를 메뉴 언어로 추측하지 않는다. 아래 .47/.48 소스 동등성과 실험 계획은 해당 시점의 기록이다.

Edge 호환성 검사에서는 manifest/API/모듈 구조 변경이 필요하지 않았다. 현재 sidePanel API와 MAIN/ISOLATED 로드·설정 연결은 실제 Edge에서도 검사 범위를 통과했다. 시험용 브라우저 선택 preload와 native sidebar CDP 도구는 artifacts에만 두며 제품 의존성으로 추가하지 않는다. 상세는 QA.md의 Edge 절을 따른다.

2026-10-15 추가 일시정지 CPU 실험은 비용 감소와 전체 CPU 개선을 구분해 검토했고 **미채택**했다. 현재 src/manifest/검사 코드는 .47 통과본과 같다. 아래 .48 계획은 실험 기록이며 현재 실행 계약이나 향후 자동 실행 지시가 아니다. 상세 비용/판정은 QA.md의 일시정지 CPU 절에 있다.

.47은 Gemini 모듈화 검수 후속이다. 새 경계를 늘리지 않고 기존 settings-binding의 API 함수 검사/요청 key 범위를 보강했다. popup은 언어 첫 적용·전환만 번역하고 같은 값 echo를 건너뛰며 전역 applyLanguage alias를 제거했다. 호출자 없는 drag-controller/hover-pause/video-observer 3파일과 manifest 선언을 원본 보존 후 제거했다. 실제 drag/hover/video lifecycle은 renderer/content의 기존 소유자로 남는다. 31항목 판정은 REVIEW.md, 집중/전체 결과는 QA.md를 따른다.

.46에서 아래 구체 계획의 **popup 설정 복원/구독 경계 하나**를 구현했다. `popup/modules/settings-binding.js`가 storage listener·초기 읽기 중 변경 key·destroy를 소유하고 popup.js의 `applyStoredSettings`가 초기/실시간 UI 반영을 공통 처리한다. 오래된 초기 snapshot이 새 언어/싱크 대상을 되돌리는 경쟁을 재현 후 수정했다. 스키마/revision/실제 UI 상태 소유권과 manifest script 순서는 유지한다. 상세 검증은 QA.md의 .46을 따른다. 전체 모듈화 완료나 성능 향상으로 집계하지 않는다.

.45는 기존 storage-guard 스키마에 active sync target의 primary/secondary enum을 연결하고 popup의 최초/변경 복원 및 허용된 UI 언어의 화면 갱신을 보완했다. 키별 revision과 local 우선/sync debounce/echo 방지 계약을 유지한다. 새 state 소유자/제품 모듈/권한/파일 분리는 없다. 30분 성능 측정과 실제 텍스트가 바뀌는 입력 부하 검사는 제품과 별도 browser/profile/자체 영상으로 완료했다. 측정 도구의 GC/relay를 제품의 동작 또는 Chrome cloud 검증으로 집계하지 않는다. 재현 환경·수치·한계는 QA.md의 .45를 따른다.

.44의 자막 네트워크 계약은 ISOLATED track-fetcher의 page-origin CORS + HTTPS URL allowlist다. manifest에는 Netflix 주입/탭 접근 host 하나만 선언하며 CDN 4개 origin privilege를 제거했다. MAIN은 페이지 manifest/clock 관찰, side-panel SW는 패널 열기 역할을 유지한다. SW/확장 페이지 fetch proxy로 바꿀 때는 현재 패키저 host 경계·CORS/권한 회귀를 새 설계에 맞춰 검토해야 한다. 이번은 manifest 권한 축소와 QA이며 제품 모듈/state/API 분리는 없다.

.43은 기존 HUD 클래스에 `_setMessage` 메서드를 추가해 RTL 메시지의 시간/크기 수치 토큰만 bdi dir=ltr로 표시한다. 문자열 API·메시지 ID·fade/rAF 취소·state 소유권은 유지한다. 새로운 모듈/권한/load 순서 변경 없이 재현된 음수 부호 표시 결함을 해결했다. watchdog/adapter polling 최적화나 파일 길이 기반 분할은 이번 검수의 실행 범위가 아니다.

.42는 기존 i18n 사전에 히브리어를 추가하고 popup 언어 허용 목록·HUD 방향에 he를 연결했다. 언어 표시 모듈은 히브리어 문자 근거로 제공자 이름을 판단하지만 track identity/지역/CC 선택은 유지한다. 새 모듈·state 소유권 이동·API/load 순서 변경은 없다. 모듈화 계획 실행으로 집계하지 않는다.

2026-10-14. **부분 모듈화 상태이며 전체 모듈화는 완료하지 않았다.** 폴더에 파일이 있는 것과 실행 코드에서 사용하는 것을 구분한다.

.41은 기존 popup 오케스트레이터의 싱크 복원/갱신과 wheel 초기화 부작용, content 단축키 HUD 및 기존 슬라이더 명령의 숫자/객체 값 수신을 고쳤다. 새 제품 모듈이나 state 소유권 이동은 없으며 아래 분리 계획의 실행으로 집계하지 않는다.

| 실행 책임 | 현재 연결 | 남은 책임 |
|---|---|---|
| 패널 | popup.js → popup/modules의 storage/status/UI 모듈 | 일부 초기화·event 연결은 popup.js에 남음 |
| 패널 설정 연결 | **popup/modules/settings-binding** → popup.js의 applyStoredSettings | .46에서 실제 연결. 초기 snapshot/수용한 local 변경의 순서·구독/해제를 담당하며 실제 저장/revision/UI 상태는 기존 모듈에 남음 |
| 언어/트랙/설정 | core/platform, track-languages, settings-revisions, storage-guard | content의 설정 변수·명령 분기는 남음 |
| 자막 다운로드 | network/track-fetcher | trusted CDN·deadline·abort·alternate/retry·결과 상태를 담당 |
| 거절 주소 복구 | **network/track-recovery** → content.js | .38에서 실제 연결. 회차/역할/언어/종류별 다른 거절 URL 집합만 10초 간격·최대 3회 metadata 읽기, 거절 URL 제외, 상태 상한·회차 reset. playback 보호·request 소유권은 content가 검증 |
| 재생 검증 | video/bridge, adapter, gate, clock, native-reference | content의 staging/commit·회차 수명은 남음 |
| 입력/원본 control | input/keyboard-router, interaction/controls-hit-detector | drag/hover의 실제 처리는 renderer/content에 남음 |
| 자막 배치/출력 | layout/dual-placement, renderer, parser | parser의 TTML/VTT, renderer의 DOM/drag/style/DPI가 큰 파일에 남음 |
| 진단 | tools/local-diagnostics | 제품 배포에서 제외하는 별도 로컬 진단 |

## .41 인계 시 유지할 경계

- OS 분류/Option·Alt 표시는 `src/core/platform.js`, 물리 code·modifier·입력 보호는 `src/input/keyboard-router.js`다. 플랫폼 감지와 사용자 키 재지정 UI를 혼동하지 않는다. 재지정 UI는 없다.
- popup은 입력/표시와 메시지 송신, content의 주/보조 sync engine은 실제 offset 상태를 맡는다. status 응답·허용된 local 설정이 popup 숫자를 갱신한다. UI event 연결 자체가 설정을 쓰지 않아야 한다.
- offset 메시지는 `{offsetMs}`/`{deltaMs}`와 기존 숫자를 수신한다. 이 계약은 실제 popup 송신과 production content engine을 연결한 회귀 검사에 있다.
- 이번 보고서 갱신은 새 모듈화 계획이나 구현을 시작한 것이 아니다. 추가 실기 시험은 사용자 요청으로 보류 중이며 재개 기준은 HANDOFF/QA/TODO를 따른다.

## .47에서 정리한 미사용 틀

`.46`까지 `src/interaction/drag-controller.js`, `src/interaction/hover-pause.js`, `src/video/video-observer.js`는 export 선언만 있고 src/popup/tools/tests에 호출자가 없었다. `.47`에서 파일과 manifest 선언을 제거했다. 원본은 `artifacts/qa/modularization-review-20261015/before`에 해시와 함께 보존했다. 실제 drag/hover/video 기능은 기존 renderer/content에서 동작하며 이번을 그 기능의 분리/통합 완료로 집계하지 않는다. 아래 .46 계획의 '미연결 틀 유지'는 당시 기록이고 현재 상태는 이 절이 우선한다.


## 분리 판단

content/renderer의 state·drag/hover·parser는 큰 책임이 남아 있다. .47의 미사용 틀 제거를 기능 분리 완료로 집계하지 않는다. 실제 오류·변경 충돌·구체적인 향후 위험을 확인한 후보만 채택하고 아래 내용을 실제 함수/API로 채운 뒤 수행한다. 코드 길이만으로 분리하거나 성능 개선을 선언하지 않는다.

## 2026-10-15 채택 계획 — popup 설정 복원/구독

이 절은 .45 소스를 확인한 뒤 **구현 전에 작성한 구체적인 계획**이다. 이번 사용자의 모듈화 실행 요청에 따라 아래 한 후보를 조사·구현·검증한다. 기존 후보 목록 전체의 분리를 시작하지 않는다.

완료 기록: 초기 snapshot 재현은 en/primary/100ms로 rollback되어 실패했고, 구현 후 집중 browser 6/6·최종 전체 QA 107/107(126.0초)을 통과했다. 실제 pagehide에서 새 UI 구독 1개가 제거되는 것도 확인했다. 최종 전체 QA 결과와 실패 로그의 구분은 QA.md에 있다.

### 1. 필요성과 대안

`.45 popup/popup.js`의 DOMContentLoaded 끝에는 `chrome.storage.local.get` 초기 복원과 `chrome.storage.onChanged` 실시간 복원이 별도로 있다. .45에서 고친 sync target 최초/변경 복원, 원격 UI 언어 갱신 누락은 이 경로별 매핑을 따로 유지해야 하는 실제 변경 이력이다. 초기 get은 비동기인데 이후 수용한 local 변경을 기억하지 않아, 오래된 snapshot callback이 늦게 도착하면 offset/target/UI 언어를 다시 덮을 수 있다. 이 순서를 제어한 실제 popup browser 회귀로 수정 전에 확인한다. 스키마의 active target 누락은 다른 계층의 결함이므로 이 분리만으로 재발을 막았다고 하지 않는다.

단순 helper 추출은 두 UI 매핑의 중복은 줄이지만 읽기/구독/해제 수명과 callback 경쟁은 popup에 남긴다. 따라서 **storage→화면 반영 연결의 수명만** `popup/modules/settings-binding.js`로 분리하고, 실제 UI 반영은 popup의 단일 `applyStoredSettings(values, {initial})`로 모은다. 새로운 설정 저장소·스키마·revision 알고리즘·기능별 UI 소유자를 만들지 않는다. 추가 비용은 ES module 1개와 popup instance당 listener 1개/초기 읽기 중 변경 key Set 1개이며 timer/request/영상 listener는 추가하지 않는다. renderer/content/parser는 이번 필요성 근거가 없어 미채택이다.

대안 검토 보완: 기존 storage-guard.readSettings는 content.js의 visualKeys 초기 복원에서 sync/local을 합성하고 임시 listener를 해제한다. popup은 수용한 local만 반영하는 상시 구독·명시적 destroy가 필요하다. 이를 그대로 재사용하면 popup의 initial sync fallback 계약이 달라지며, 이 helper를 popup에 맞춰 바꾸면 content 초기 복원에도 영향을 준다. 기존 helper와 revision 정책은 유지하고 구독 수명만 새 모듈에 두었다.

### 2. 현재 코드 지도와 소유권

| 현재 호출/상태 | 소유자·수명 | 이번 처리 |
|---|---|---|
| popup.html의 i18n→platform→track-languages→settings-revisions→storage-guard→type=module popup.js | popup document; MAIN/content와 별도 context | 순서 유지, popup.js의 정적 import만 추가 |
| DOMContentLoaded의 local.get callback / onChanged 익명 listener | popup.js, 문서가 닫힐 때까지; 초기 read 취소/명시적 구독 해제 없음 | binding이 구독하고 늦은 callback을 차단 |
| queuePopupStorageSave/flushPopupStorageSave | modules/storage.js→storage-guard→settings-revisions; local write/sync debounce/revision | 이동하지 않음; 새 binding은 저장/송신하지 않음 |
| selectStorageChanges/validateStorageSchema | storage-guard; 수용한 revision과 schema 검증 | 함수를 주입해 사용, binding이 revision을 재구현하지 않음 |
| offset 두 값/활성 target | ui-sync.js의 module state; popup wrapper의 기존 target 필드 | updateDisplay/updateSecondaryDisplay/setSyncTarget 호출 유지 |
| 언어/트랙 종류·학습의 edited 방어 | ui-primary/dual/track-kind/learning의 module state | 초기 적용에만 initial=true 유지; 변경은 기존 false |
| UI 언어/lastResponseData/connectionState/connectedTabId | popup.js | applyLanguage와 status transport 유지 |
| 스타일/접힘 DOM·사용자 event | ui-style/ui-accordion 및 popup event wiring | 기존 update/restore 호출; 접힘은 기존처럼 초기 복원에만 적용 |
| status polling 500ms/탭 listener | status-connection.js | 기존 유지; status 응답을 storage snapshot으로 취급하지 않음 |

수정 전 파일/해시는 `artifacts/qa/settings-modularization-20261015/before-source-hashes.json`과 `before/{popup/popup.js,manifest.json,scripts/run-qa.cjs,docs/ARCHITECTURE.md}`에 보존했다. popup.js SHA256은 `1eb62dd70c0bde427669db7e3b96c576e4baa488ac46b25ff168204969baab91`다. raw가 다른 기기에 없더라도 이 절의 함수/소유권/입력으로 재현할 수 있다.

### 3. 새 API와 수명

| API | 입력·출력 | 호출자/소유자 | 실패·취소·정리 |
|---|---|---|---|
| `bindPopupSettings({storage, validate, selectChanges, apply, hasReadError})` | Chrome storage 객체와 동기 callback 주입→`{destroy()}` | DOMContentLoaded가 1회 호출, binding이 해당 구독 소유 | listener를 먼저 연결한 뒤 local.get, sync 이벤트 직접 적용 금지 |
| `applyStoredSettings(values, {initial})` | 검증된 partial setting→동기 UI 변경, 반환값 없음 | popup.js, 기존 UI 모듈들 호출 | 없는 key를 default로 채우거나 storage/message로 되쓰지 않음 |
| `destroy()` | 인수/반환값 없음, 반복 호출 가능 | popup pagehide에서 호출 | onChanged listener 제거, Set 해제, 뒤늦은 read/event 무시 |

binding은 window/document/OTTSub 전역을 숨겨 읽지 않는다. storage-guard 함수·오류 확인·UI 함수를 호출자가 전달한다. 정적 module 로드는 DOM/Chrome에 접근하지 않으며 생성 시점부터만 구독한다. 초기 읽기 중 수용한 local key와 삭제 key를 기록하고 초기 snapshot에서 제외한다. 최초 snapshot도 같은 schema로 검증하며 key별 default를 추가하지 않는다. local 변경은 기존 guard의 select 결과만 적용한다. read 오류/예외가 있어도 live 구독은 유지하고, destroy 뒤 read callback은 무시한다. 원본 Chrome get 자체를 중단하는 API는 없어 callback을 논리적으로 무효화한다. 별도 timer/AbortController/영상·회차 owner는 필요 없다.

episode/player/track request ownership과 clock/ad/seek gate는 content의 기존 소유자로 남는다. binding은 download/Netflix 선택/track code 변환을 수행하지 않는다. 기존 미연결 drag-controller/hover-pause/video-observer 틀은 이번 경계와 무관해 그대로 유지하며 통합 완료로 집계하지 않는다.

### 4. Migration 순서와 완료 조건

1. **기준 회귀**: 새 `tests/test_popup_settings_browser.cjs`에서 실제 popup을 열고 초기 snapshot callback만 보류한다. local에 offset 800/secondary -400/target secondary/he를 수용한 뒤 오래된 en/primary snapshot을 반환해 화면 rollback을 재현한다. 실패 로그를 보존한다.
2. **공통 적용**: popup에 `applyStoredSettings`를 만들고 초기/변경의 offset·target·언어·track kind·dual·lock·style·learning 매핑을 합친다. initial/edited와 접힘 초기 전용 계약을 유지한다. 이 단계는 동작 이동이며 schema/range/storage key는 변경하지 않는다.
3. **수명 분리·연결**: 위 binding을 구현하고 기존 get/listener를 실제 호출 1개로 대체한다. pagehide에서는 binding.destroy를 호출한다. 중복 구독/기존 복원 블록은 제거한다. ESM 정적 import라 manifest script 목록은 그대로이고, 패키저는 popup 하위 .js를 자동 포함한다.
4. **경쟁 방어**: 초기 읽기 중 새 값/삭제를 snapshot에서 제외하고, 오류/중복 destroy/늦은 callback을 검사한다. 새 스키마/저장 migration 없이 복원 순서의 결함만 수정한다.
5. **회귀·정리**: 새 browser suite를 run-qa에 등록하고 실제 module import·패키지 entries 포함을 확인한다. .46 build label과 현재 문서 6개/루트 안내를 갱신한다. 새 ZIP·커밋/푸시·스토어 조작 없이 최종 전체 QA까지 수행한다.

### 5. 검증 입력과 완료 기준

- 늦은 초기 snapshot보다 **그 사이 수용한 local 변경**이 UI에서 우선한다. 바뀌지 않은 초기 값은 정상 복원되고 초기 접힘·언어/CC 편집 방어를 유지한다.
- sync 영역의 오래된 값은 직접 UI에 적용하지 않고, 기존 revision 계층이 local로 수용한 값만 적용한다. 잘못된 스키마 입력/삭제가 default나 이전 snapshot을 되살리지 않는다.
- 실제 binding의 start→event→destroy→late read/event→다시 새 instance를 실행해 listener 수가 원래대로 돌아오고 옛 apply가 호출되지 않아야 한다. read 오류·storage API 부재도 검사한다.
- 실제 popup의 restore가 storage.set/sendMessage를 추가로 발행하지 않아야 한다. Hebrew RTL/secondary slider/정상 재열기·원격 변경 .45 회귀를 유지한다.
- affected suites: 신규 popup settings, test_language_names_browser, test_side_panel_browser, test_review40_browser, test_hindi_track_kind_browser, test_platform_shortcuts_browser와 전체 run-qa. schema/revision runtime·패키지 경계도 전체 QA에서 확인한다.
- 성능 향상은 목표/완료 조건이 아니다. 기존 .45 30분 수치를 변경 후 성능 측정으로 재사용하지 않는다. 실제 Netflix/DRM·Mac·두 기기 cloud는 이번에도 미검증이며 기존 실기 보류를 유지한다.

### 6. Rollback

실패 시 위 before snapshot에서 **이번에 변경한 파일만** 복원한다. popup.js의 이전 get/listener와 manifest label, run-qa 등록을 함께 되돌리고 이번 새 binding/suite만 제거한다. test_store_package.py에는 이번에 추가한 binding 바이트 일치 assertion 한 줄만 역적용한다. 현재 작업 트리에는 .42–.45 및 사용자 변경이 있으므로 HEAD reset/전체 checkout을 쓰지 않는다. 문서는 완료 결과를 되돌린 사실을 남긴다. storage key/revision migration이 없어 기존 설정은 유지된다. 기존 .41 배포 ZIP은 바꾸지 않으므로 rollback 영향이 없다. 확장/패널 reload는 필요하지만 배포/스토어 조작은 이 로컬 작업의 완료 조건이 아니다.

## 2026-10-15 .47 검수 후속 계획 — 기존 경계 보강/미사용 코드 제거

구현 전 범위를 다음처럼 정했다. 별도 제품 모듈을 추가하거나 renderer/content 수명을 이동하는 작업이 아니다. Gemini 31항목의 최종 판정은 REVIEW.md에 둔다.

1. **근거/대안**: 미사용 3파일의 export는 정의와 manifest 외에 src/popup/tools/tests 호출자가 없다. 총 원본 4,183바이트이며, 평가 시 controller instance/timer/listener를 만들지 않는 IIFE 선언이다. 실제 동작은 renderer/content에 있어 성급한 통합은 input/ad/episode guard를 바꿀 위험이 크다. 선언/파일만 제거한다. UI 언어는 onchange의 직접 갱신과 local echo 갱신이 겹쳐 동일 DOM 번역이 반복되는지 실제 popup의 updateDOM 횟수로 확인한다. 불완전한 API에서 destroy가 throw하는 경계도 재현한다.
2. **소유권/현재 호출**: settings-binding의 reading/closed/changedDuringRead/구독은 그대로다. storage-guard의 검증/revision과 popup UI state는 이동하지 않는다. window.applyLanguage는 popup 내부 한 곳만 사용하므로 ESM의 기존 export/local 호출로 정리한다. 비동기/영상 호출 순서는 유지한다.
3. **API/load/수명**: bindPopupSettings에 선택적 keys를 추가한다(default null로 기존 호출 호환). popup은 기존 POPUP_STORAGE_KEYS와 legacy lock alias만 전달한다. 읽는 key 집합이 있으면 그 key만 초기 경쟁 추적 대상이며, 삭제 key는 여전히 오래된 snapshot 복원에서 제외한다. get/addListener/removeListener가 실제 함수인지 초기 확인 후 구독한다. destroy와 pagehide 계약은 유지하고 timer/글로벌 singleton은 추가하지 않는다. 미사용 파일 3개의 manifest 항목과 소스만 제거하고 상대 script 순서는 보존한다.
4. **Migration**: 먼저 기존 browser suite에 removeListener 부재/언어 중복 갱신/전역 alias/키 범위 회귀를 추가해 .46 실패를 보존한다. 이후 API guard·keys·로컬 언어 호출/동일 언어 단락을 수정하고 미사용 3파일을 제거한다. 언어 초기화 첫 1회는 생략되지 않도록 문서별 적용 완료 언어를 popup이 소유한다. 접힘 초기 복원 정책은 주석으로 명시한다.
5. **QA**: 실제 popup 초기 경쟁/스타일 편집 보존·원격 갱신·실제 Chrome API local import/lastError·MAIN/ISOLATED drag/hover/video 교체와 전체 QA를 실행한다. 패키지 entries에 제거 파일이 없고 현재 runtime import가 포함되는지 확인한다. DOM 호출 수 감소를 측정하되 체감속도/메모리/배터리 향상률로 일반화하지 않는다.
6. **Rollback**: `artifacts/qa/modularization-review-20261015/before-source-hashes.json`과 before 사본에서 이번 파일만 복원한다. 미사용 3개 원본과 manifest의 기존 script 순서를 함께 복원하고 새 회귀만 역적용한다. HEAD reset/설정 migration/새 ZIP은 필요 없다. .42–.46 사용자 변경과 기존 ZIP은 보존한다.

완료: 위 범위 구현 후 집중 popup 13/13·실제 확장 side-panel 13/13·최종 전체 오프라인 QA 104/104(128.2초)를 통과했다. 기존 107개와의 차이는 제거한 미사용 파일의 syntax 3개뿐이며 runtime/legacy/browser suite는 줄이지 않았다. raw/한계는 QA.md의 .47에 있다.

## 2026-10-15 .48 일시정지 CPU 비교 계획

구현 전 .47 release-like 확장을 실제 WebM/모의 Netflix 입력에서 60초 진단했다. sampleNow 320회/약 144.7ms inclusive, renderer.renderDual 320회/약 6.9ms, 전체 page script 약 162.0ms였다. 이 수치는 profiler/wrapper 비용을 포함하며 전체 CPU 개선율이 아니다. 비용이 작은 renderer에 별도 캐시/state를 추가하는 대신 기존 adapter의 주기 관찰만 비교한다.

- **소유권/API**: content.onPlaybackSample이 현재 owner·gate·표시 허용을 확인한 정상 종료에서 paused일 때만 `'stable-paused'`를 반환한다. adapter가 이 반환값과 실제 paused/not seeking/readyState≥2/adSignal absent/not pauseAd를 모두 확인하면 다음 기본 관찰을 300ms로 잡는다. 나머지 반환값/재생/광고/복구/불명확 상태는 기존 200ms다. 새 모듈이나 공유 mutable owner는 만들지 않는다.
- **기존 보호 유지**: 300ms는 gate의 500ms 연속성 한도보다 짧다. 500ms 연속성/1초 freshness/250ms 대사 onset 검증 수치는 바꾸지 않는다. playing 관찰은 200ms이며 play/playing/ratechange의 기존 즉시 watchdog 관찰과 DOM observer의 50ms 우선 예약은 유지한다. 반복 sampleNow에서 200ms를 무조건 대입하지 않도록 기본 예약만 선택한다. 이 계획은 모든 기기의 300ms 응답 상한 보장이 아니다.
- **검증**: 실제 adapter의 정상 paused/playing/seek/저준비/광고/회복 신호별 예약 시간과 stop 해제를 검사한다. 실제 확장/영상에서 quiet paused·설정/seek/재생 재개·pause-ad·video 교체·회차/광고 보호를 확인한다. .47 원본 runtime과 변경 runtime을 같은 영상/부하의 별도 프로필에서 동시에 60초씩 3회 비교하고 launch 순서를 교대한다. profiler를 제거한 CPU 시간/ScriptDuration/샘플 수를 기록한다. 짧은 비교의 변동과 합성 입력 한계를 명시하고 개선이 일관되지 않으면 채택 판단을 다시 한다.
- **Rollback**: `artifacts/qa/paused-cpu-20261015/before-source`와 before-hashes.json은 .47의 src/manifest 사본이다. adapter/content/manifest 및 새 회귀만 되돌리며 기존 .42–.47 사용자 변경·설정·ZIP은 유지한다. 전체 source checkout/reset을 하지 않는다. .45 30분 결과를 새 build 성능으로 재사용하지 않는다.

검토 결과: sample/script 비용은 감소했지만 전체 CPU가 낮아진 것은 3회 중 1회였다. 작은 script 절감만으로 cadence/API 변경을 채택할 근거가 부족해 후보를 artifacts에 보존하고 **제품/검사/manifest를 .47과 바이트 동일하게 복원**했다. 이 실험 label의 .48은 현재 제품 build가 아니다. 초기 결합 실행의 탐색 timeout과 MediaRecorder 영상의 실제 seek 한계는 QA.md에 별도로 기록했다.

## 모듈 분리 상세 계획 양식

2026-10-14 사용자 지시를 적용한다. **구체적인 후보를 채택할 때 아래 내용을 실제 함수·파일·state로 채워 작성한 뒤 코드를 변경한다.** 이 양식을 만든 것만으로 어떤 모듈 분리 계획이 완료된 것은 아니다.

## 1. 수행 여부 판단

- 해결하려는 현재 문제 또는 구체적인 향후 위험과 재현/변경 이력/측정 근거.
- 현재 파일 크기와 별개로 오류가 생기는 이유: 책임 중복, 서로 다른 수명, 검증 불가능한 의존성 등.
- 분리하지 않고 메서드 정리·중복 제거로 해결할 수 있는지 비교.
- 기대 효과와 추가되는 load/상태/인터페이스 비용. 근거가 부족하면 미채택으로 기록.

## 2. 현재 코드 지도

- 현재 진입 함수와 모든 호출자, import/script load 순서, MAIN/ISOLATED/popup 실행 경계.
- mutable state·DOM·timer·listener·request·AbortController별 소유자와 생성/해제 시점.
- 외부 계약: language/track identity, episode generation, playback/ad/seek gate, storage echo, native selection.
- 분리 대상과 현재 파일에 남길 책임을 함수명·줄/검증된 해시로 명시.

## 3. 새 경계와 API

| 새 API/상태 | 입력·출력 | 호출자·소유자 | 실패·취소·정리 계약 |
|---|---|---|---|
| 실제 후보 API를 기입 | 타입·nullable·동기/비동기 | 실제 함수와 파일 | 늦은 callback, owner 교체, 반복 destroy 등 |

- module이 외부를 숨겨서 읽지 않도록 의존성 전달과 callback 방향을 정한다.
- 회차/player/video/track 소유권을 어디서 검증하고, 이전 작업 완료를 어떻게 거부할지 명시.
- 생성→연결→변경→취소→해제의 순서와 재진입·중복 초기화·실패 경로를 적는다.
- 기존 미연결 틀이 있으면 통합/삭제/유지 중 하나와 이유를 정한다. 중복 구현 두 개를 남기지 않는다.

## 4. 단계별 migration

1. 현재 동작·호출·상태 경계의 필요한 회귀 검사를 확보한다.
2. API와 수명 경계를 만들고 기존 동작을 이동한다. 동작 개선은 별도 단계로 구분한다.
3. manifest/import/모의 harness/패키지 입력의 load 순서를 연결한다.
4. 실제 호출자를 전환하고 기존 중복 구현·unused export를 제거한다.
5. 실패·취소·remount/episode·해제와 기존 UX를 검사한다. 단계별 변경 파일·의존성·완료 조건을 적는다.

## 5. 검증과 완료 조건

- affected runtime/browser suite와 확인할 구체적인 입력·기대 결과를 기입한다.
- 실제 product module을 실행해 검증한다. 함수 존재·문자열 검색만으로 정상 동작을 승인하지 않는다.
- event/timer/request/listener가 해제되고 오래된 owner의 결과가 반영되지 않아야 한다.
- 선택 identity·원본 request/selection·clock guard가 유지돼야 한다.
- 전체 QA는 사용자 컴퓨터의 별도 오프라인 환경에서 실행한다. 성능 개선 주장은 비용 계측이 있어야 한다.
- 미검증 실서비스/실기/장시간 범위와 요청할 최소 사용자 입력을 기록한다.

## 6. rollback

- 수정 전 snapshot/hash와 되돌릴 파일·load 순서·storage migration 유무.
- 실패 시 fallback 또는 복구 절차, 사용자 설정·제출 ZIP에 대한 영향.
- 배포가 필요한 변경과 로컬 검증만으로 충분한 변경을 구분한다.
