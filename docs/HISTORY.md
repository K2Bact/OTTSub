# 개발 이력 — 1.3.9 / .70 기준

2026-10-30 사용자 최신 지시의 저장소 운영 기준은 [OTTSub](https://github.com/K2Bact/OTTSub) 공개, [ottsub-dev](https://github.com/K2Bact/ottsub-dev) 비공개·읽기 전용 보관이다. 코드와 과거 이력의 독립 경계를 유지하며 로컬 AI대화/외부참고/계정자료는 Git에서 제외한다. 실제 변경·익명 접근·비공개 차단 결과는 [검증 기록](../artifacts/security/repository-visibility-20261030/result.json)에 기록한다. OTT-80. 아래 비공개 전용 정책과 이전 보관 이름은 각 당시 기록이다.

2026-10-30 사용자가 저장소 이름변경·새비공개저장소 생성·비공개보관을 명시승인해 실행했다. 원래주소 OTTSub는새독립비공개저장소이고, 기존저장소는 OTTSub-private-history-20261030에서 비공개·읽기전용으로6커밋을보존한다. 새저장소에서옛커밋/참고blob404·340파일동일·17언어·179입력/ZIP10보존을확인했다. [실행/검증](../OttsubAiTalk.md#repository-isolation-complete-20261030)·OTT-79. 아래승인대기는당시기록이다.

2026-10-30 저장소의 새 main1커밋·로컬자료2종 Git제외·340파일/17언어·비공개를 확인했다. 제품179입력/ZIP10보존. 옛SHA조회200이 남아 독립 저장소 격리안을 준비했으나 이름변경/새생성/보관은 자동승인 거절로 실행되지 않았다. [범위/현재판정](../OttsubAiTalk.md#repository-cleanup-20261030)·OTT-79.

2026-10-29 Gemini의 보고 정정·지침 기록 회신을 검증했다. 기존 지침을 보존한 AGENTS.md의8개 예방 규칙과 백업/전후해시를 직접 확인했고,179개 QA입력·ZIP10개는 동일하다. [독립 판정](../OttsubAiTalk.md#codex-reporting-rules-result-20261029)·OTT-78. 새 제품 검사나 추가AI왕복은 없으며 아래 회신 대기는 당시 기록이다.

2026-10-29 사용자 지시로 Gemini에 프랑스어 검수 보고 정정과 실제 프로젝트 지침에 재발 방지 규칙 기록을 요청했다. RN적재·지정깨우기1회·실제읽음/수락을 확인했고 전달기는 종료했다. 지침 변경 근거 회신 대기이며 제품/테스트/ZIP 변경은 없다. [요청/단계](../OttsubAiTalk.md#gemini-reporting-rules-request-20261029)·OTT-78.

2026-10-29 Gemini 프랑스어회신을 consume으로검증·수령하고대조했다. 새제품수정제안없음. 신규French브라우저8결과는확인했으나나머지실행원본로그가없어125는보고수치로한정했다. 파일59주장은현재60(아이콘포함64)으로정정하고배지/조판설명을보정했다. 현재179입력/ZIP10은그대로다. [판정](QA.md#codex-french-peer-result-20261029)·OTT-77완료. 아래회신대기는당시기록이다.

2026-10-29 사용자 지시로 Gemini 프랑스어 독립 검수를 요청했다. 일반 task-bridge **RN-TASK-8C390C7683FE86FA**: RN적재→고정OTTSub깨우기API1회→실제읽음·수락 확인, 전달기 종료. 완료결과 RN1회/귀환안내1회·1시간상한이며 아직 결과없음. [원문/단계](../OttsubAiTalk.md#gemini-french-review-request-20261029)·OTT-77. 제품.70·ZIP은 그대로다.

2026-10-29 **프랑스어 Français (FR)** 메뉴를추가했다. 현재1.3.9/.70·17언어×192키. 프랑스어192문구/metadata·지역감지·정렬/저장·RTL/320px 복구배지보완. [새전체QA](QA.md#french-ui-20261029) **122/122·292.0초·입력179**, French8/8·Pinned/Shared 통과. 기존16언어와ZIP10보존(package5PASS/1SKIP). [AI기록](../OttsubAiTalk.md#french-ui-20261029)·OTT-76. 아래.69 이하와16언어ZIP은각당시기록이다.

2026-10-29 Gemini 광고10회 결과를 독립대조했다. 원본160로그 PASS는수용하되 **2,840개명시case+무개수episode10회**로정정하고 광고×CC/OFF·탭지연응답 전수주장은제한했다. 집계기허위PASS7종은정식계약재집계로배제, 광고guard변형2종도실제검출했다. 정상gate17PASS·제품/ZIP변경없음. [판정](QA.md#codex-ad-test-10-reassessment-20261029)·OTT-74/75. 아래수신대기표기는당시기록이다.

2026-10-29 광고 관련 모든 기능의 실제10회 검사를 Gemini에 요청했다. RN요청1건 적재만 완료했고 목적OTTSub 깨우기는 계획검토전용 경로만 있어 미실행·실제읽음없음이다. 검사결과는 아직없다. [원문/전달단계](../OttsubAiTalk.md#gemini-ad-test-10-request-20261029)·OTT-74. 제품1.3.9/.69·ZIP은 그대로다.

2026-10-29 등록정보 후속: 한국어·영어 상세 설명에 Chrome114 조건과 OTTSub 무료/Netflix 구독·광고 처리 범위를 명확히 하고 예전 키보드 배열 안내를 제거했다. [수정본/대조](QA.md#store-listing-139-ko-en-20261029)·OTT-73. 제품1.3.9/.69·메타데이터·ZIP은 그대로다.

2026-10-29 사용자 요청으로 [스토어1.3.9 ZIP](../dist/ottsub-store-1.3.9.zip)을 준비했다. 개발본은 .69로 구분하고 개발 항목은 기존 패키징 규칙으로 제외했다. 패키지6/6(SKIP0)·실제ZIP37/37, 185,823 bytes·63파일·16언어. 기존ZIP9개 보존. 제품 코드는 직전.68 그대로이며 직전전체121/121과 이번 배포검사를 구분한다. [현재QA](QA.md#release-139-20261029)·[AI기록](../OttsubAiTalk.md#release-139-20261029)·OTT-72. 아래 기록의 현재 버전/ZIP은 각 당시 상태다.

2026-10-29 .68 유지: 실제확장탭API·늦은응답·pagehide, 일반/CC·OFF/ON·역순body조합을검사했다. 새제품결함0, 원본제품코드는그대로두고검사인프라보강. 새전체121/121·입력176, native5/compound10과음성대조2검출. package5PASS/1SKIP·ZIP9보존. [QA](QA.md#context-churn-20261029).

2026-10-29 .68 유지: Gemini 추가검사계획5사이클요청을고정채팅1회깨우기와함께전달해회신을받고중복/오류를재평가했다. 내부5차수행은독립인증하지않으며제품수정/검사는없다. [AI기록](../OttsubAiTalk.md#gemini-5cycle-plan-result-20261029)·[QA범위](QA.md#gemini-5cycle-plan-result-20261029).

2026-10-29 .68: 보정 계획으로 검사기 보고서 검증과 sidePanel의 미지원/동기·비동기 오류 방어를 구현했다. Chrome API하한114. 새전체120/120·입력175·회귀42/42·과거보고28/28·native panel22/22·worker 재시작 복원 PASS. package5PASS/1SKIP·ZIP9 보존. [QA](QA.md#qa-panel-fixes-20261029)·[AI 기록](../OttsubAiTalk.md#qa-panel-fixes-20261029).

2026-10-29 .67 유지: Gemini P2/P3 계획 회신을 실제28 raw계약/소스/공식API와 대조해 부분 채택·보정했다. 구현·새 테스트·추가AI송신/깨우기 없음. [판정](../OttsubAiTalk.md#gemini-fix-plan-reassessment-20261029)·[검토](QA.md#gemini-fix-plan-reassessment-20261029).

2026-10-28 .67 버전 유지: 사용자 지정 단축키 안내문을 공통 화면에서 삭제했다. 관련browser28/28·Pinned/Shared 통과, 키동작/사전/기존ZIP9 보존. P2/P3 수정계획을 Gemini 기존수신함에1회 요청, 구현은 미착수. [검사](QA.md#shortcut-note-removal-20261028)·[AI 요청](../OttsubAiTalk.md#gemini-fix-plan-request-20261028-sc01-sc02).

2026-10-28 .67 유지: 수정된 안정성·호환성 계획을 실행했다. 전체119/119·Chrome/Edge 오프라인12/12·Chromium worker 강제재시작 저장보존. 검사기 판정P2와 API방어P3를 재현해 미수정 후속 OTT-67/68로 기록했다. 입력174·ZIP9 보존, 제품/정식검사 변경 없음. [검사](QA.md#stability-compatibility-20261028)·[AI 기록](../OttsubAiTalk.md#stability-compatibility-20261028).

2026-10-22 .67: 사용자 지시로 배포본 설정 화면과 Chrome 확장 세부정보에 홈페이지를 연결했다. 1.3.8 ZIP을 다시 준비하고 기존 .66을 보존했다. 전체 QA **119/119·314.6초·입력174개**, 실제 ZIP 확장 **37/37**, 패키지6/6(skip0) 통과. fi/th 이미지만 새 ZIP 기준으로 갱신했다. [검사](QA.md#homepage-link-20261022)·[AI 기록](../OttsubAiTalk.md#homepage-link-20261022).

2026-10-22 .66: 사용자 요청으로 현재 .65 기능을 1.3.8로 묶었다. 16언어·63파일 ZIP, fi/th/he의 이름·짧은/상세 설명과 새 ZIP UI 이미지9장을 준비했다. 전체119/119·실제 ZIP 확장36/36·패키지6/6(skip0), 이전ZIP8개 보존. [검사](QA.md#release-138-20261022)·[AI 기록](../OttsubAiTalk.md#release-138-20261022)를 따른다.

2026-10-22: 스페인어 /es/ 소개·FAQ·개인정보 고지를 공개 사이트에 추가했다. 세 언어 전환과 메타/사이트맵·UTM을 연결했고 기존 한영 문구와 제품 .65를 보존했다. [검사](QA.md#site-spanish-20261022)·[AI 기록](../OttsubAiTalk.md#site-spanish-20261022)를 따른다.

2026-10-22: 블로그를 제외한 GEO 보강을 기존 공개 홈페이지에 반영했다. 직접적인 싱크/오차 증가 FAQ·고정 출처별 스토어 링크·로컬 주간 비교를 추가했다. 제품 .65와 기존 ZIP은 유지한다. [검사](QA.md#geo-improvements-20261022)·[AI 기록](../OttsubAiTalk.md#geo-improvements-20261022)를 따른다.

2026-10-22 .65: 핀란드어 메뉴·메타데이터와 개발본 전용 시장조사 링크를 추가했다. 실제 unpacked 보고서의 CSP 동작과 배포 입력 경계를 확인했고 [검사](QA.md#finnish-ui-20261022)·[AI 기록](../OttsubAiTalk.md#finnish-ui-20261022)를 따른다.

2026-10-21 .64 유지: [OTT 자막 확장 광고 대응·수익 모델 조사](../artifacts/research/ott-subtitle-market-20261021/OTTSub_자막확장_시장조사.html)와 로컬 비교 보고서를 준비했다. [확인 범위](QA.md#market-research-20261021)·[기록](../OttsubAiTalk.md#market-research-20261021)을 따른다.

2026-10-21 .64: hover OFF 전환의 소유 pause 해제와 대기 취소, 이전 시간 초과 진단용 단계 로그를 보완했다. [수정·새 전체 QA](QA.md#transition-review-20261021)·[AI 판정](../OttsubAiTalk.md#transition-review-20261021)을 따른다.

2026-10-21 .63: 추가 검수의 입력 경계·단일 자막 너비 보완과 회귀 편입. [수정·검증 상세](QA.md#boundary-review-20261021)·[AI 판정](../OttsubAiTalk.md#boundary-review-20261021)을 따른다.

2026-10-21 .62: 전체 프로그램 재검수에서 상태 연결 종료의 pagehide 리스너와 긴 자막 절단의 surrogate 손실을 수정했다. 고대비 검사의 모의 dual 상태 응답을 정정하고 독립 oracle/URL/비동기/발신자/HUD/화면 검사를 정식 편입했다. [최종 QA](QA.md#full-review-20261021) **114/114, 입력 167개**, 구버전 ZIP 비교 1 SKIP. [AI 판정](../OttsubAiTalk.md#full-review-20261021)을 따른다.

2026-10-21 .61: 사용자 승인 품질 후보 9개를 구현·검증했다. Gate12 정식 편입·언어 inventory 공통 검사, 상태 설명 59값 정정, 파서 재현 결함 5개·전체화면 제거 후 재생성 1개 수정, popup 대비·스위치 이름과 복합/반복 회귀를 보강했다. 정식 전체 QA **112/112, 275.4초, 입력 165개**. [판정](../OttsubAiTalk.md#quality-20261021)·[검사](QA.md#quality-20261021)를 따른다.

2026-10-21 .60 유지: 태국어 이름·짧은/상세 설명과 1280×800 RGB JPEG 3종(이중·싱크·학습)을 준비했다. 기존 캡처 도구에 검수된 배포 입력 스냅샷 선택을 추가하고 실제 UI/예시 데이터 경계·음수 싱크·학습 펼침·이미지 규격을 검증했다. [자료](../store_assets/th/README.md)·[QA](QA.md#th-store-shots-20261021)·[AI 기록](../OttsubAiTalk.md#th-store-shots-20261021)을 따른다. 새 ZIP·스토어/사이트 조작·제품 변경은 없다.

2026-10-21 .60: 태국어 192개 문구·Chrome th 메타데이터·Thai 정렬 항목을 추가했다. th-TH/th_TH UI 감지·명시적 선택 복원·LTR 전환·제공자 labelLocale 가드를 검증했고 자막 track identity와 Netflix request/profile·재생 guard는 유지했다. 새 전체 QA 105/105·155개 입력, 기존 14언어·8ZIP 보존을 확인했다. [작업](../OttsubAiTalk.md#thai-ui-20261021)·[QA](QA.md#thai-ui-20261021)를 따른다.

2026-10-21 .59 유지: 사용자 지시로 한·영 개인정보처리방침을 기존 GitHub Pages에 게시하고 실제 파일 일치·HTTP·빌드 완료를 확인했다. Language Reactor 6.0.1 공식 배포본의 유사 자막 처리와 요청 변경을 정적으로 비교했으며 설치/실행은 하지 않았다. 개발용 플레이어 fixture는 사용자 판단대로 유지하고 별도 추진 항목을 안 함으로 정리했다. [판정](../OttsubAiTalk.md#lr-comparison-privacy-publication-20261021)·[QA](QA.md#lr-comparison-privacy-publication-20261021)를 따른다.

2026-10-21 .59 유지: 코드·배포 ZIP과 공식 약관/정책을 대조하고 한·영 개인정보처리방침·생성 HTML·등록 지침을 보완했다. 기존 ZIP과 runtime은 보존했다. [검토·경계](../OttsubAiTalk.md#legal-review-20261021)를 따른다.

2026-10-20 .59 유지: 사용자 확인으로 상태표의 스토어 반영 이력을 정정하고 배포 확인 대기 항목을 추가하지 않도록 프로젝트 규칙을 반영했다. [기록](../OttsubAiTalk.md#app-status-confirmed-20261020)을 따른다.

2026-10-20 .59 유지: 사용자 요청으로 상태·담당·갱신일을 공통 상태표의 OTTSub ID로 이관했다. TODO는 항목별 설명으로 바꾸고 기존 원문을 보존했다. [이관 기록](../OttsubAiTalk.md#app-status-20261020)·[검사](QA.md#app-status-20261020)를 따른다. 제품 코드·ZIP은 변경하지 않았다.

2026-10-20 .59: .58 제품 로직으로 1.3.7/14언어 ZIP과 러시아어 이름·짧은 설명·상세 설명·실제 ZIP UI 스크린샷 3장을 준비했다. 기존 1.3.0–1.3.6 ZIP을 보존했다. [QA](QA.md#release-137-20261020)·[AI 기록](../OttsubAiTalk.md#release-137-20261020)을 따른다.

2026-10-20 .58 유지: 사용자 승인으로 소개 자료 전용 공개 저장소 `K2Bact/ottsub-site`와 GitHub Pages를 만들고 실제 게시·HTTP·메타데이터를 확인했다. 앱 저장소는 비공개다. [공개 결과](../OttsubAiTalk.md#geo-publication-20261020)·[QA](QA.md#geo-publication-20261020)를 따른다.

2026-10-20 .58 유지: GEO 후속으로 14언어 설명에 실제 사용법·언어 누락 안내를 추가하고 한국어·영어 정적 제품 소개 페이지를 만들었다. 콘텐츠·메타데이터·레이아웃 검사와 공개용 파일 경계를 확인했다. [작업 기록](../OttsubAiTalk.md#geo-implementation-20261020)·[QA](QA.md#geo-implementation-20261020)를 따른다. 실제 검색 효과는 미측정이다.

2026-10-20 .58 유지: Gemini의 AEO 설명·접근성 변경을 대조했다. 접근성 속성을 유지하고 14언어 설명의 실제 지원 범위와 대화 기록의 누락된 근거 구분을 정정했다. [판정](../OttsubAiTalk.md#aeo-review-20261020)·[새 QA](QA.md#aeo-review-20261020)를 따른다.

2026-10-20 .58 유지: 러시아어 Gemini 검수의 실제 스크립트/로그/현재 입력을 대조하고 제품 수정 없이 표기·근거 범위를 정정했다. 원문 archive 보존, 런타임 79/79 재실행과 보존 해시 직접 대조를 마쳤다. [AI 답변](../OttsubAiTalk.md#ru-review-response-20261020)·[QA](QA.md#ru-review-response-20261020)를 따른다.

2026-10-20 .58: 사용자 요청으로 러시아어 메뉴 192개·Chrome 메타데이터·Русский (RU)를 추가했다. 자동 감지/선택 복원/시스템 언어 우선 정렬과 Cyrillic 제공자 라벨 가드, 14언어 레이아웃/단축키/실제 확장 검사를 연결했다. 전체 105/105·154개 입력을 통과했고 기존 13사전·ZIP 7개를 보존했다. [QA](QA.md#russian-ui-20261020)·[AI 기록](../OttsubAiTalk.md#russian-ui-20261020)을 따른다.

2026-10-20 .57 유지: Gemini 전체 검수에서 지적한 STORE_GUIDE 문구 누락을 복구하고 이 문서를 정식 QA 해시에 추가했다. 수정 전 2스위트 exit 1을 재현했고 수정 후 400/400+hook 1/1·32/32, 전체 105/105·153개 입력을 확인했다. 34/35 오기와 예외 포함 13/13의 범위를 [AI 답변](../OttsubAiTalk.md#full-program-review-20261020)에 정정했다. 제품/ZIP은 그대로며 [QA](QA.md#full-program-review-20261020)를 따른다.

2026-10-19 .57 유지: 포르투갈어 스토어 이미지 3장을 기존 실제 ZIP UI 템플릿으로 제작했다. pt-PT UI와 pt-pt 자료/선택값을 구분하고 1280×800 RGB JPEG·음수 싱크·열린 학습 카드·예시 표시를 확인했다. 제품/ZIP은 그대로다. [검사](QA.md#pt-pt-store-shots-20261019), [자료](../store_assets/pt-pt/README.md), [AI 기록](../OttsubAiTalk.md#pt-pt-store-shots-20261019)을 따른다.

2026-10-19 .57: 사용자 요청의 **1.3.6 ZIP(13언어·60파일)**과 포르투갈어(포르투갈) 이름/짧은 설명/상세 설명을 준비했다. .56 실행 로직을 유지하고 version/version_name만 변경했다. 전체 QA 105/105·패키지 6/6·ZIP 실제 확장 smoke 10/10, 이전 6 ZIP/기존 locale 자료 보존을 확인했다. [검사](QA.md#release-136-20261019), [등록 자료](../store_assets/pt-pt/README.md), [AI 기록](../OttsubAiTalk.md#release-136-20261019)을 따른다.

2026-10-19 .56 유지: 사용자 요청으로 기존 검수 답변·판정 11개 문서를 루트 [OttsubAiTalk.md](../OttsubAiTalk.md)에 모으고 향후 AI 대화 기준으로 지정했다. REVIEW는 기존 링크·앵커 안내를 유지한다. [포르투갈어 9라운드 답변](../OttsubAiTalk.md#pt-pt-review-20261019)과 [독립 재실행/보존 검사](QA.md#pt-pt-review-20261019)를 추가했으며 제품 수정은 없다.

2026-10-19 .56: 포르투갈용 `Português (PT)` 메뉴 192문구·Chrome `pt_PT` 메타데이터를 추가해 13언어로 확장했다. 지역 UI 감지·저장 복원·영어 이름순 정렬·제공자 locale 경계와 기존 언어 회귀를 확장했다. 320px에서 긴 보조 대상 버튼은 `Secund.`로 다듬고 실제 텍스트 폭 검사도 보강했다. [검사](QA.md#2026-10-19-포르투갈어포르투갈-메뉴--56)를 따른다. 같은 요청에서 사용자가 동기화 추진을 취소해 TODO/지침에서 제외했다. 기존 설정 구현과 과거 증거·6 ZIP은 보존했다.

2026-10-19 공유 점검 후속: QA hash 목록에 생성된 Python 캐시 1개가 포함된 것을 발견해 run-qa 수집기에서 __pycache__/.pyc를 제외했다. 제품/정식 검사 동작은 그대로이며 전체 105/105(176.3초), 입력 151개로 재확인했다. 생성 캐시를 소스로 공유하지 않는다. 기존 152개 기록과 입력 수 차이는 cache 제외 1개다.

2026-10-19 .55 유지: 사용자가 현재 개발본의 OTTSub GitHub 푸시를 요청했다. 최신 152개 실행/검사 파일을 전체 QA 105/105 통과본과 대조하고 12언어 코드·현재 문서·검사/도구·등록 자료를 공유 대상으로 정리했다. 다른 PC의 CDN 회귀 검사에 필요한 공개 loopback TLS fixture 2개를 정확한 경로로 Git 제외 규칙에서 예외 처리했다. 제품/manifest/ID는 바꾸지 않았고 archive/artifacts/dist·ZIP·실기 보류는 유지한다.

2026-10-18 .55 유지: 사용자가 실기 실험을 나중으로 미뤘다. 동기화 probe를 정식 browser suite로 편입하고 runner 목록에 등록했다. 독립 12/12·전체 105/105(177.6초), 수신을 끊은 사본의 의도한 실패/exit 1을 확인했다. 제품/manifest/ZIP은 그대로이며 source 152개다. 실제 두 기기 cloud 보류와 기존 실기/계정 경계를 QA/TODO/HANDOFF에 갱신했다.

2026-10-18 .55 유지: 사용자가 설정 동기화 검사 계획 작성/착수를 요청해 QA에 계획을 먼저 저장했다. 현재 실행 파일의 동일 사본과 독립 Chromium 프로필 두 개로 전달·offline 충돌·중복/역순·분리 도착·닫힌 수신자·호출 실패 복구 12/12, 실제 UI 15회 비교를 완료했다. 제품/정식 테스트/manifest는 그대로이며 151소스/6ZIP 해시를 보존했다. 실제 두 기기 Chrome cloud transport는 환경 미확보로 미실행이다. 이 경계를 QA/REVIEW/TODO에 기록했고 다른 실기 보류는 유지한다.

2026-10-18 .55 검수 후속: Gemini 9라운드 script를 동일한 별도 사본으로 재실행해 9/9를 확인했다. 원본의 comparator 재구현을 제품 12언어 초기화 증거로 확대하지 않도록 정정하고 실제 popup 12/12 자동 선택·정렬·수동 변경·리로드 검사를 보완했다. finite 간체 금지어/labelLocale 신뢰, 태그 6종만 허용한다는 표현과 없는 selector도 정정했다. 제품/정식 테스트/manifest/ZIP은 그대로며 보고서 원문·원본 파일 3개·child 출력은 보존했다. REVIEW/QA를 따른다.

2026-10-18 .55: 사용자 요청으로 대만 번체 중국어 `zh-TW`/`zh_TW` 메뉴 192문구·metadata를 추가해 12언어로 확장했다. UI 목록은 Chrome UI 언어(미지원 시 navigator/en)를 첫 행에 두고 나머지는 영어 이름순으로 정렬하며 저장한 명시적 선택은 유지한다. 실제 자막 identity와 기존 11사전/metadata는 그대로다. 전체 QA 104/104(167.0초), 언어/순서 20/20, 배치 108/108, 실제 extension side-panel 19/19를 통과했다. 기존 ZIP 6개는 보존했고 준비된 1.3.5 ZIP은 .54/11언어 당시 파일이다. 상세는 QA/REVIEW/ARCHITECTURE를 따른다.

2026-10-18 .54: 사용자 요청으로 .53 제품 로직 그대로 version 1.3.5를 부여해 11언어 ZIP과 터키어/벵골어 등록 자료를 준비했다. 새 이름/짧은 설명·상세 설명·이미지 각 3장과 기존 he/ms/hi 설명의 11언어 목록을 반영했다. 기존 1.3.0~1.3.4 ZIP/이미지는 보존했다. 전체 QA 104/104(169.1초), 패키지 경계 6/6(skip 0), 실제 패키지 로드 10/10을 통과했다. Google 계정/업로드 조작은 하지 않았다. 상세는 QA와 STORE_GUIDE를 따른다.

2026-10-18 .53 검수 후속: 사용자 알림상 Gemini 검수 모델은 4.0 argon medium(이전 3.8 플래시 high)이다. 6라운드 스크립트를 원본과 동일한 별도 사본으로 재실행해 6/6 통과했다. 핵심 결과를 인정하며 문서 링크/실제 extension storage의 이번 실행 범위 설명만 정정했다. 제품/정식 테스트 변경은 없다. 원문/조사 원본을 보존하고 판정은 REVIEW, 재실행·독립 링크 대조는 QA에 기록했다.

2026-10-18 .53: 사용자 요청으로 터키어 Türkçe (TR), 192문구와 확장 메타데이터를 추가했다. 브라우저 tr-TR 감지/선택 복원·ar→tr LTR·provider 이름/CC와 실제 extension storage 검사를 기존 경로에 확장했다. 기존 10사전과 실제 자막 identity/요청/권한/시계 guard는 유지한다. 검사 결과는 QA, 어휘 근거와 검수 경계는 REVIEW에 모았다.

2026-10-18 .52 검수 후속: Gemini의 Bengali 8라운드 보고서를 실제 코드/원본 결과/공식 출처와 대조했다. 공통 bn 규범·색인의 잘못된 출처/공식성 2파일을 정정하고 원문/조사 파일을 보존했다. 누락된 실제 gate12·Bengali 숫자·DOM·ar→bn·키보드/휠 확인 9/9, 로컬 CDN 30/30을 통과했다. 기존 104/104 및 Gemini 103/104의 149개 소스가 현재와 일치하며 제품/정식 테스트 변경은 없다. 판정은 REVIEW, 검증 범위는 QA를 따른다.

2026-10-18 .52: 사용자 요청으로 벵골어(বাংলা, bn) 메뉴·192개 문구·확장 locale을 추가했다. bn-BD/bn-IN 감지·저장 언어 우선·he→bn LTR 전환과 제공자 이름 표시를 기존 경로에 연결했고 언어 행렬을 10개로 확장했다. 실제 트랙 identity/요청/권한/시계 guard는 유지하며 검사·초기 조건 실패와 결과는 QA.md에 모았다. 제출 1.3.4/.51 ZIP과 기존 등록 자료는 그대로다.

2026-10-16 실제 브라우저 검사 보류: Windows Netflix 재생 경계 검사를 준비했지만 브라우저 URL 확인 단계에서 Computer Use가 중단돼 실제 검증은 진행하지 못했다. 사용자가 해당 검사와 Chrome 조작이 필요한 실제 스크린리더 발화 검사도 미뤘다. 준비/중단 경계는 QA.md, 재개 전 보류 상태는 TODO.md에 기록했다. 제품/검사 코드 변경은 없다.

2026-10-16 wheel 후속: Gemini의 상태 응답/고부하 확정 결론을 원본 자료와 대조·정정하고, 실제 실패 시 storage fixture가 sync 쓰기를 local 변경으로 잘못 발행해 휠 시작값을 바꾸는 경로를 잡았다. 실제 Chrome API 비교 후 테스트 fixture와 결정적 회귀 2파일을 수정했다. 제품/manifest/제출 ZIP은 .51 그대로이며 재현·검증 결과는 QA.md, 주장별 반박은 REVIEW.md에 모았다. 같은 날 사용자가 Linux·ChromeOS 환경 구축/검사를 보류한 상태도 유지한다.

2026-10-16: 사용자가 1.3.4 스토어 제출을 알렸다. Linux 실기 제공 없이 검사할 계획을 요청해 현재 PC의 사용 가능한 실행 도구·Linux OS 분기·검사 경로와 공식 가상화/브라우저 문서를 대조했다. QEMU Ubuntu VM 안에서 제출 ZIP 실제 로드와 기존 회귀·X11 화면/입력·재생/보존을 검증할 계획을 QA.md에 작성했다. 이번에는 설치/VM 부팅/테스트·제품 변경·새 ZIP을 실행하지 않았다.

2026-10-15 .51: 최신 .50 제품을 1.3.4로 올리고 9언어 스토어 ZIP을 생성했다. 히브리어·말레이어 이름/짧은 설명·상세 설명·ZIP의 실제 UI로 스크린샷 각 3장을 제작했다. 힌디어 설명의 언어 목록은 9개로 갱신했다. 이전 ZIP/보고서는 보존하고, legacy 검사 3개의 고정 ZIP 허용 목록에 마지막 업로드 1.3.3을 추가했다. 제품 로직/권한/자막 guard는 .50 그대로다. 최초 QA 실패와 수정 후 최종 검증은 QA.md의 1.3.4 절을 따른다.

2026-10-15 파일·폴더 정리(.50 유지): 해시가 같은 검수 원문 4개를 archive의 기존 보관본으로 통일하고 docs를 현재 문서 6개로 되돌렸다. 루트 debug.log는 archive/generated로 옮겼다. 테스트 프로필의 재생성 가능한 캐시 1,731파일과 빈 하위 폴더 523개를 정리해 약 328.8MiB를 회수했다. 설정·HAR/진단·성공/실패 증거와 외부 런타임 junction은 보존했다. 경로/해시 검증은 QA.md의 정리 절에 기록한다. 제품/검사 코드·manifest·배포 ZIP 변경은 없다.

2026-10-15 .50: Gemini 말레이어 13·전방위 18항목을 원문/소스/공식 근거와 대조했다. 말레이어 문구는 유지했고 metadata 75/132자·실제 문구/81검사 분모·350ms debounce/catch-up·실사용 보장 과장을 정정했다. 보고서가 정상이라고 본 상태 안내창의 dialog/tooltip 불일치를 실제 Edge에서 재현해 named nonmodal dialog·포커스/expanded 수명을 수정했다. Downloader 주석의 과도한 SSRF 방어 표현도 교정했다. 실제 재현과 최종 전체/Edge 결과는 QA.md의 .50 절에 있다.

2026-10-15 .49: 사용자 요청으로 말레이어(Bahasa Melayu, ms) 메뉴·192개 UI 문구·확장 메타데이터를 추가했다. ms-MY 감지·선호 순서·명시한 저장 언어 우선·he→ms 방향 전환·설정 복원/동적 값과 일반/CC 툴팁·화면 검사를 확장했다. 320px의 양쪽 가림 라벨을 짧게 다듬고 글자 잘림 검사를 포함했다. 최종 전체/Edge 검사와 최초 잘못된 CC 검사 기대값은 QA.md의 말레이어 절을 따른다. 권한/자막 identity/재생 guard는 유지한다.

2026-10-15 Edge 호환성: 사용자 요청으로 실제 설치 Microsoft Edge에서 .47을 검사했다. 제품 변경 없이 전체 회귀와 native sidebar 아이콘 열기·브라우저 재시작 복원을 통과했다. 실제 서비스/스토어 설치/클라우드 경계와 원본 증거는 QA.md의 Edge 절을 따른다. 사용자가 이미 업로드한 1.3.3 이후 변경 비교 기준도 HANDOFF에 정정했다.

2026-10-15 일시정지 CPU 검토: .47 함수별 60초 진단과 안정 paused 300ms 후보의 60초×3회 동시 비교를 수행했다. sample 약 37.4%/script 시간 약 33.3% 감소했으나 전체 CPU가 낮아진 회차는 1/3이었다. 전체 CPU 개선을 입증하지 못해 실험 미채택·현재 .47/200ms 유지로 결정했다. 후보 src/회귀와 실패/원본 측정은 artifacts/qa/paused-cpu-20261015에 보존하고 제품/검사/manifest가 기존 QA 104/104 통과본과 바이트 동일함을 확인했다. 새 제품 build/ZIP/커밋은 만들지 않았다. MediaRecorder 영상의 탐색 한계와 상세 입력/수치는 QA.md를 따른다.

2026-10-15 .47: Gemini의 .46 모듈화 검수 31항목을 소스/실행/공식 문서와 대조했다. 계획 후 불완전한 storage API의 destroy TypeError와 동일 언어 echo 중복 번역을 재현·수정하고 key 범위 read/추적, 로컬 ESM 언어 호출, 접힘 초기 전용 주석을 반영했다. 미사용 3파일/manifest 항목(원본 총 4,183바이트)을 제거하고 실제 renderer/content 동작은 유지했다. popup 13/13·side-panel 13/13·최종 전체 QA 104/104, 128.2초 통과. 107에서 줄어든 항목은 삭제 파일 syntax 3개다. 원문/수정 전 증거와 31개 판정은 REVIEW/QA를 따른다. 새 ZIP·커밋/푸시는 하지 않았다.

2026-10-15 .46: 필요성 기반 모듈화 요청에 따라 실제 함수/소유권/API/load·수명/migration/QA/rollback 계획을 먼저 작성했다. 실제 popup의 오래된 초기 snapshot이 새 Hebrew/secondary -400ms를 English/primary 100ms로 되돌리는 문제를 재현하고 설정 연결 수명만 settings-binding으로 분리했다. 공통 UI 반영 함수와 초기 읽기 중 수용한 변경/삭제 우선·destroy 뒤 callback 무시를 연결했다. 집중 browser 6/6·전체 오프라인 QA 107/107(126.0초) 통과, 상세 패키지 검증과 한계는 QA.md를 따른다. 기존 스키마/revision/시계·광고·회차 guard와 배포 ZIP은 유지했다.

2026-10-15 .45: 성능·설정 보존 검사 재개 요청에 따라 독립 실제 Chromium 프로필에서 재시작·강제 종료·local/sync 전달을 검사했다. 선택한 sync target의 스키마 저장 누락(22/23), 패널 재열기 target 복원 누락, 허용된 원격 UI 언어 변경의 화면 반영 누락을 각각 재현·수정했다. 15개 local/relay 항목과 최종 전체 QA 105/105, 130.0초 통과. 권한/Netflix 선택·시계 guard 유지, 새 ZIP/커밋 없음. 재생/일시정지 각 15분 제품/미사용 CPU·memory 비교 및 각 100회 실제 자막 변경 입력 검사를 완료했다. 지속 누수 근거는 관찰되지 않았고 상세 수치·방법·실제 Mac/Netflix/두 기기 cloud 경계는 QA.md의 .45를 따른다.

2026-10-15 .44: 사용자 요청으로 CDN 최소 권한 감사를 수행했다. 실제 보관 HAR 507개 요청 중 자막 응답 11개는 nflxvideo/ACAO *였으며 단일 기록을 다른 CDN의 영구 미사용 근거로 쓰지 않았다. 현재 ISOLATED fetch CORS/다운로드 proxy 부재를 확인하고 실제 제품의 5-host/Netflix-only를 로컬 TLS 서버로 비교해 30/30 통과했다. 응답 주입 시험의 CORS 거부 실패는 검증 방법의 한계로 남기고 대체했다. CDN host_permissions 4개를 삭제하되 HTTPS 자막 URL allowlist는 유지했다. 패키저의 host 경계와 새로운 browser 회귀를 전체 QA에 포함했다. 결과와 한계는 QA.md를 따른다. 새 ZIP·실서비스/Mac 조작·커밋/푸시는 하지 않았다.

2026-10-15 .43: Gemini 히브리어 보고서 25항목을 소스와 대조하고 현재 REVIEW에 판정·반박·범위를 정리했다. 보고서가 정상이라고 본 HUD의 -0.5s 부호 역전을 he/ar에서 실제 Chromium 좌표/PNG로 재현해 LTR bdi로 수정했다. 반복 알림·언어 전환·안전 DOM 회귀를 추가했으며 결과는 QA.md의 .43을 따른다. 키 수 186→최종 192, 같은 거절 URL 재시도·400ms 실사용 보장·동기 storage/설정 유실 없음 등의 과도한 결론을 정정했다. 다음 빌드의 히브리어 스토어 등록정보 포함 요구를 인계/기억에 남겼다. 원문은 기존 위치와 archive에 보존했다. 기존 ZIP·힌디어 자료 유지, 새 ZIP/게시/커밋 없음, Mac 실기/성능 보류 유지.

2026-10-15 .42: 사용자 요청으로 히브리어 UI 192개 항목과 확장 메타데이터를 추가했다. 메뉴 선택 저장/복원·he-IL 감지·패널/HUD/복구 안내 RTL·제공자 이름의 히브리어 문자 근거를 연결했다. 검사 범위와 결과는 [QA](QA.md#2026-10-15-히브리어-메뉴--42)를 따른다. 제품 version은 1.3.3을 유지하며 개발 build만 .42다. 기존 .41 7언어 ZIP과 힌디어 등록 자료는 보존했다. 새 ZIP·커밋/푸시·스토어 조작·보류한 Mac 추가 실기는 실행하지 않았다.

2026-10-15 배포 파일 준비: Google 업데이트 서버의 실제 CRX ID/manifest로 1.3.2 공개 배포를 확인했다. 사용자 요청으로 .41 기반 1.3.3 ZIP(56개 파일, 힌디어 포함 7언어, 150,093 bytes)을 만들고 기존 ZIP은 해시 확인 후 보존했다. 힌디어 설명과 1280×800 실제 UI 스크린샷 3장, 버전별 패키지 기록을 준비했다. Windows 전체 로컬 QA 104/104, 122.9초·ZIP 검사 5/5·7언어 gate 통과. 제품 코드는 변경하지 않았다. Google 계정 접근/로그인 요청/개발자 콘솔 조작 금지와 사용자 직접 업로드 원칙을 작업 지침·기억 기록에 남겼다. 업로드/심사 신청은 하지 않았고 Mac 추가 실기 보류는 유지한다.

현재 상태는 [HANDOFF](HANDOFF.md), 남은 작업은 [TODO](TODO.md)를 읽는다. 아래는 각 버전 당시 결과다. 이전의 미해결·확인 전 문구를 현재 상태로 읽지 않는다. archive/artifacts는 Git 대상에서 제외한다. 과거 Windows 원본은 원래 Windows 폴더, .41 Mac raw 증거는 검사한 Mac에 있다. Git에서 읽을 수 있는 상세 .41 보고서는 QA.md다.

| 버전 | 변경과 당시 결과 | 기록 |
|---|---|---|
| .41 | Mac 전체 QA 104/104, 94.0초. 패널을 열 때 주언어 싱크 0 덮어쓰기 제거, 주/보조 숫자 복원·갱신, 슬라이더 명령 값 수신 및 7언어 단축키 HUD 수정. 실제 Chrome OS 입력으로 기본 단축키·값 유지 일부 확인; 물리 IME/음성/광고 전체 검증 별도 | [Mac 범위와 증거](QA.md#2026-10-14-mac-중간-보고서--41) |
| .40 | round3 25항목 대응, 새 주소 복구·강조/literal·provider 이름·owner mismatch·active tab·drag·키 안내. 로컬 QA 104/104, 129.9초. 실제 Chrome close 12회·tab event, 실기/cloud/장시간 별도 | [기록](../archive/docs/repair-40-review-followup-2026-10-14/README.md), [25항목 답변](../OttsubAiTalk.md) |
| .39 | es-ES 표시 Spanish/스페인어, 선택 identity/라틴아메리카/CC 유지. 검수 후 수정·필요성 기반 사전 계획 모듈화 원칙 기록. 전체 로컬 QA 102/102, 114.1초 | [기록](../archive/docs/repair-39-netflix-language-label-2026-10-14/README.md) |
| .38 | 5개 코드 결함 수정·거절 주소 복구 보강·실제 RTL CSS 방향 수정·TrackRecovery 연결·30항목 개별 답변. 전체 QA 101/101, 112.1초. 실사용 토큰/실기/전체 모듈화는 별도 | [기록](../archive/docs/repair-38-review-fixes-2026-10-14/README.md) |
| .37 | DPI 감시 종료/늦은 이벤트 보호와 Intl.DisplayNames 재사용. 전체 QA 98/98, 128.4초. 20회 교체 후 이전 DPI 리스너 0, 언어 함수 단독 중앙값 약 68% 감소. 전체 패널 CPU 개선율은 미확정 | [기록](../archive/docs/repair-37-performance-2026-10-14/README.md) |
| .36 | 한국어 → 크티, 나머지 6개 메뉴 → K2Bact Buy Me a Coffee. 함수 실행 7/7·문법 확인, 전체 QA 반복 없음 | [기록](../archive/docs/repair-36-global-support-2026-10-14/README.md) |
| .35 | 영어 메뉴 → K2Bact Buy Me a Coffee, 한국어/다른 언어 → 기존 크티. 공개 페이지 직접 확인, 링크 10/10 확인·문법 통과. 전체 QA 반복 없음 | [기록](../archive/docs/repair-35-support-link-2026-10-14/README.md) |
| .34 | OS 감지·Option/Alt 안내·브라우저/IME 키 보호. 최종 QA 96/96, 114.5초. Windows 호스트 모의 OS·키 이벤트 검사이며 실제 맥 Netflix 검증은 별도 | [기록](../archive/docs/repair-34-platform-shortcuts-2026-10-14/README.md) |
| .33 | Gemini 검수 판정·문구 수정·공통 언어 기준 정리. QA 93/93, 109.0초. 초기 타이밍 실패와 재통과를 기록하고 시계/시간 기준은 유지 | [검수](../archive/docs/reviews/2026-10-14-l10n/ASSESSMENT.md) |
| .32 | 로컬 1.3.3 힌디어 UI·주/보조 일반/CC 선택. 자동 QA 90/90, 89.3초. 새 기능의 실서비스 확인은 별도 | [구현](../archive/docs/repair-32-hindi-cc-2026-10-14/README.md) |
| .31 | Netflix 자체 트랙 준비, 원본 선택 유지. 자동 QA 87/87, 81.1초. 사용자 실제 스페인어 표시 성공 확인 | [수리](../archive/docs/repair-30-native-acquisition-2026-10-14/README.md) |
| .30 | 대기 조사·복사 버튼, 두 getter 비교. QA 86/86, 80.2초. 이후 실제 코드에서 두 getter가 같은 내부 함수임을 확인 | [조사](../archive/docs/repair-29-pending-track-probe-2026-10-14/README.md) |
| .29 | 읽기 전용 대체 앱 접근 경로. QA 86/86, 84.8초. 이후 새로고침에서 대기 재발 보고 | [수리](../archive/docs/repair-28-player-discovery-2026-10-14/README.md) |
| .28 | outgoing 요청 변경 제거. QA 86/86, 101.6초. 사용자 원본 전체 메뉴 복구 확인 | [수리](../archive/docs/repair-27-passive-manifest-2026-10-14/README.md), [실제 확인](../archive/docs/live-qa/2026-10-14-passive-menu-restored/README.md) |
| .27 | 로컬 주소 조사 화면. QA 86/86, 82.3초 | [조사](../archive/docs/repair-26-acquisition-inspector-2026-10-14/README.md) |
| .26 | 부분 준비 요청 변경 실험. QA 83/83, 99.3초. 메뉴 간섭 의심으로 .28에서 제거 | [당시 기록](../archive/docs/repair-25-full-track-manifest-2026-10-14/README.md) |
| .25 | 아랍어 UI/RTL·제한된 늦은 주소 조회. QA 83/83, 96.6초 | [수리](../archive/docs/repair-24-arabic-acquisition-2026-10-14/README.md) |
| .24 | 언어별 상태 안내·묶음 단위·정확한 트랙 연결. QA 82/82, 92.3초 | [수리](../archive/docs/repair-23-track-status-2026-10-13/README.md) |
| .23 | 언어/문자 구분·세션 혼합 방지·일본어 UI. QA 82/82, 70.9초 | [수리](../archive/docs/repair-22-language-review-2026-10-13/README.md) |

이전 단계의 다운로드/실제 표시 성공과 새로고침 뒤 초기 대기는 서로 다른 관찰이다. 실제 .31 표시 성공을 확인한 뒤 동일 시험을 반복 요구하지 않는다. 다른 작품·언어·광고·회차 조합까지 모두 검증한 것은 아니다.

실패를 포함한 [과거 QA](../archive/docs/qa-runs/latest.md)와 원본 HAR/JSON/스크린샷·수정 전 파일은 archive에 보존한다. [현재 QA](../artifacts/qa/latest.md)는 artifacts/qa에서 읽는다.

2026-10-14 파일 정리: docs의 현재 문서를 6개로 통합하고 과거 자료를 archive로 이동했다. 테스트 기준 파일은 tests/fixtures, 새 QA는 artifacts/qa로 연결했다. 제품 실행 코드/manifest/제출 ZIP은 그대로다. 정리 후 전체 QA 104/104, 120.8초. 업로드 준비는 보류했고 복사본은 제거했다.

2026-10-14 Git 사전 준비 재개: Git/GCM·K2Bact 인증과 비공개 K2Bact/OTTSub의 push 권한을 읽기 전용으로 확인했다. 실제 폴더를 origin/main의 기존 초기 커밋에 연결했고 제외 규칙/줄바꿈 규칙을 추가했다. archive/artifacts/dist와 원본 진단은 제외한다. 숫자 replay 3개를 필요한 수치만 남겨 tests/fixtures로 분리하고 공통 언어 gate 3개의 SHA256 snapshot을 포함했다. QA는 외부 app_common/archive 없이 실행되며 browser fallback은 HOME도 지원한다. 전체 로컬 QA 104/104, 122.8초. 제품/manifest/기존 원본과 제출 ZIP은 보존했고 새 ZIP·새 커밋·푸시·업로드·별도 복사본은 만들지 않았다. 실제 Mac 시험은 남아 있다.

2026-10-14 GitHub 코드 공유 승인: 사용자가 K2Bact/OTTSub에 필요한 파일의 업로드를 요청했다. 준비한 1.3.3/.40의 실행 파일·현재 문서·테스트/도구·등록 자료를 main 대상으로 확정하고 문서의 사전 준비 보류 문구를 갱신했다. 제품 코드는 직전 104/104 QA 통과본을 유지한다. 원본 archive/진단과 artifacts/dist는 공유 대상에서 제외하며 실제 Mac 시험은 별도로 남긴다.

2026-10-14 Mac .41: 원본 .40 자동 QA 102/104의 두 실패를 native select의 headless Mac 입력 한계로 분리했다. 직접 Chrome에서 확인한 HUD 내부 키/미치환 mode와 싱크 숫자 누락을 실제 handler/browser 회귀 검사로 재현했고, 추적 중 패널 초기화의 input 발행이 저장된 주언어 싱크를 0으로 덮는 원인을 고쳤다. 수정 후 전체 QA 104/104, 생략/검사 중 소스 변경 없음. 실제 Chrome .41에 다시 로드해 양방향 싱크·재열기 보존·Option D/B/L·Command L/F를 확인하고 원래 설정과 일시정지 상태로 복원했다. Mac native 메뉴의 자동 검사 대체 범위를 JSON/QA에 명시했다. 이 검사 종료 시점에는 .41은 Mac 로컬 수정본이었고 커밋/푸시/새 ZIP/업로드 전이었다. 이후 보고/공유 요청은 아래 별도 기록을 따른다.

.41 최종 실제 슬라이더 확인에서 +0.1초가 상태 조회 뒤 0으로 돌아가는 별도 문제가 재현됐다. popup이 보내는 `{offsetMs}`/`{deltaMs}`를 content가 숫자로 직접 변환하던 네 분기를 수정했고 기존 숫자 명령도 유지했다. 회귀 검사 원본 실패(0 != 300)와 실제 popup 송신→production content 엔진 검사를 추가했다. 최종 전체 QA는 104/104, 94.0초이며 실제 Chrome에서 주 +0.2초/보조 +0.1초가 조회 뒤에도 유지되는 것을 확인 후 0.0초로 복원했다.


2026-10-14 테스트 보류·인계 보고: 사용자가 Mac 시험이 아직 전부 끝나지 않았음을 확인하고 추가 테스트를 나중으로 미뤘다. 추가 Netflix 조작/자동 QA는 실행하지 않고, 기존 최종 104/104 결과와 .41 소스 해시를 기준으로 상세 중간 보고서를 QA.md에 정리했다. 실제 Chrome 14개 관찰의 slider 수정 전/후 source 차이, 미실행 이유, 재개 순서, 로컬 원본과 Git 공유 범위를 명시했다. HANDOFF/TODO/README와 루트 지시사항을 갱신해 오래된 .40·없는 MAC_LOCAL_QA.md·수동 조작 위임 지시를 대체했다. 사용자 요청에 따라 .41 코드·회귀 검사·보고서를 기존 비공개 저장소 main의 같은 공유 단위로 준비했다. 보류 상태를 테스트 완료로 바꾸지 않으며, raw 자료/배포 ZIP/스토어 업로드는 포함하지 않는다. 정확한 공유 커밋은 이 문서를 포함한 Git 이력과 원격 main을 확인한다.
