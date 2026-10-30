# 스토어 등록 지침 — 1.3.9 / 16언어

2026-10-29 제품 세부정보의 설명란은 [한국어 전체 수정본](ko-kr/listing.txt)·[영어 전체 수정본](en-us/listing.txt)을 사용한다. Chrome114 조건·Netflix 구독/광고 범위를 명확히 하고 예전 키보드 안내를 제거했다. 다른 언어와 이름/짧은 설명은 그대로이며 1.3.9 ZIP도 바뀌지 않았다. [문구 대조](../docs/QA.md#store-listing-139-ko-en-20261029).

2026-10-29 현재 업로드용 파일은 **[ottsub-store-1.3.9.zip](../dist/ottsub-store-1.3.9.zip)**이다. **185,823 bytes·63파일·16언어**. 직전 제품 코드의 안내문 삭제·sidePanel 오류 방어·최소Chrome114 선언을 포함한다. 개발 버전명/진단기/테스트/문서/보고서 파일은 제외하고 개발 시장조사 링크는 숨긴다. 패키지6/6(SKIP0)·실제ZIP37/37 통과. 새 UI 언어가 없어 등록 문구/이미지는 이번에 재제작하지 않았다. 기존ZIP9개는 보존하며 실제 업로드는 사용자가 직접 한다. [이번QA](../docs/QA.md#release-139-20261029)·[AI기록](../OttsubAiTalk.md#release-139-20261029).

## 이전 배포 준비 기록 — 1.3.8 이하

아래 버전·파일 크기·제작 출처는 각 당시 기록이다.

이번 업로드용 ZIP은 **[ottsub-store-1.3.8.zip](../dist/ottsub-store-1.3.8.zip)**이다. **1.3.8/.67**에서 설정 화면 하단 홈페이지 링크와 manifest의 homepage_url을 추가했다. **16언어·63개 런타임 파일·185,601 bytes**이며 기존 ZIP8개와 링크 추가 전 .66 ZIP을 보존했다. 개발 진단·테스트·홈페이지 소스·시장조사 보고서·스토어 이미지·version_name은 ZIP에 포함하지 않는다. 개발 보고서 링크는 배포판에서 숨겨진다. 실제 업로드는 사용자가 직접 한다.

## 이번 현지화 등록 자료

| 등록 언어 | 이름·짧은 설명 | 상세 설명 | 스크린샷 3종 |
|---|---|---|---|
| Suomi / Finnish (fi) | [metadata.txt](fi/metadata.txt) | [listing.txt](fi/listing.txt) | [이중](fi/screenshot1_dual_fi.jpg) · [싱크](fi/screenshot2_sync_fi.jpg) · [학습](fi/screenshot3_learning_fi.jpg) |
| ไทย / Thai (th) | [metadata.txt](th/metadata.txt) | [listing.txt](th/listing.txt) | [이중](th/screenshot1_dual_th.jpg) · [싱크](th/screenshot2_sync_th.jpg) · [학습](th/screenshot3_learning_th.jpg) |

핀란드어·태국어 이미지는 홈페이지 링크를 포함한 새 ZIP에서 추출한 실제 UI와 별도로 제공한 예시 상태·대사로 만든 **1280×800 RGB JPEG**다. Netflix 실재생 캡처가 아니며 하단에 각 언어로 예시임을 표시한다. 링크 추가 전 자료는 archive/docs/homepage-link-20261022/before에 보존했다. 이름·짧은 설명은 각 ZIP locale/messages.json과 동일하다. 기존 상세 설명의 메뉴 목록도 현재16언어에 맞춘다. 히브리어 등록 자료의 추가 갱신은 이번 요청 범위가 아니며 사용할 필요 없다.

권한은 storage·sidePanel·https://*.netflix.com/*로 이전판과 같다. **단일 목적 (Single Purpose)**과 **최소 권한 (Least Privilege)**은 아래 기존 설명을 유지한다. 기존 Chrome 저장 쓰기 경로와 MAX_WRITE_OPERATIONS_PER_MINUTE 고지도 유지한다. 개인정보처리방침은 [한국어](https://k2bact.github.io/ottsub-site/ko/#privacy)·[영어](https://k2bact.github.io/ottsub-site/#privacy)·[스페인어](https://k2bact.github.io/ottsub-site/es/#privacy)에서 제공한다.

[이번 QA](../docs/QA.md#release-138-20261022)·[AI 기록](../OttsubAiTalk.md#release-138-20261022)·[전체 등록 자료](README.md)를 따른다. 실제 Netflix/DRM·원어민 감수·실발화·다른 OS 검증과 로컬 배포 검사를 구분한다.

## 이전 배포 기록 — 1.3.7 이하

아래의 “이번”·“현재”와 버전/개수는 각 과거 배포 당시 기록이다.


이번 업로드용 파일은 **[ottsub-store-1.3.7.zip](../dist/ottsub-store-1.3.7.zip)**이다. 러시아어와 접근성 보강을 반영한 .58 개발본을 **1.3.7/.59, 14언어·61파일**로 준비했다. ZIP은 **177,089 bytes**이며 개발 진단/테스트/개인 키/version_name과 GEO 웹사이트 파일은 제외했다. 기존 1.3.0–1.3.6 ZIP과 등록 자료를 보존했다. [공식 업데이트 버전 기준](https://developer.chrome.com/docs/webstore/update#upload_an_updated_zip_file)을 따른다. 실제 업로드·심사 신청은 사용자가 한다.

## 러시아어 등록정보

등록 언어는 **Русский / Russian (ru)**다. 이름·짧은 설명은 [metadata.txt](ru/metadata.txt), 상세 설명은 [listing.txt](ru/listing.txt)를 사용한다. 이름과 짧은 설명은 이 ZIP의 `_locales/ru/messages.json`과 같으며 각각 53/75·126/132 UTF-16 code units다.

스크린샷 순서는 [1. 이중 자막](ru/screenshot1_dual_ru.jpg) → [2. 싱크 조절](ru/screenshot2_sync_ru.jpg) → [3. 학습 기능](ru/screenshot3_learning_ru.jpg)이다. 새 1.3.7 ZIP에서 추출한 러시아어 실제 UI로 만든 **1280×800 RGB JPEG 3장**이며 화면 상태·대사는 예시임을 표시한다. [러시아어 안내](ru/README.md)와 [검증](ru/verification.json)을 따른다. 제품 소개 주소는 [한국어](https://k2bact.github.io/ottsub-site/ko/)·[영어](https://k2bact.github.io/ottsub-site/)이며 러시아어 스토어 설명에는 영어 사이트임을 안내했다.

## 기존 포르투갈어 자료

등록 언어는 **Português (Portugal)**, 앱 코드는 pt-PT, Chrome locale 폴더는 **pt_PT**다. pt_BR(브라질)와 구분한다. [공식 locale 목록](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)과 [등록정보 현지화](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize_your_listing)를 따른다.

포르투갈어 이름·짧은 설명은 [metadata.txt](pt-pt/metadata.txt), 상세 설명은 [listing.txt](pt-pt/listing.txt)에 있다. 기존 [이중 자막](pt-pt/screenshot1_dual_pt-pt.jpg)·[싱크](pt-pt/screenshot2_sync_pt-pt.jpg)·[학습](pt-pt/screenshot3_learning_pt-pt.jpg) 이미지는 **1.3.6 ZIP UI로 제작한 당시 자료**로 보존했다. 이번에 1.3.7로 다시 촬영했다고 표시하지 않는다. [기존 검사](../artifacts/qa/pt-pt-store-shots-20261019/verification.json)와 [전체 색인](README.md)을 따른다.

## 현재 이름·언어

기본 locale은 en이며 ZIP과 개발 메뉴/메타데이터는 **14언어**다. 메뉴 언어와 Netflix에서 실제 제공하는 자막 언어는 별개다.

| locale | 확장 이름 |
|---|---|
| ko | OTTSub - 넷플릭스 자막 싱크 & 이중 자막 |
| en | OTTSub - Subtitle Sync & Dual Subtitles for Netflix |
| es | OTTSub - Sincronización y subtítulos dobles para Netflix |
| de | OTTSub – Untertitel-Synchronisation für Netflix |
| ja | OTTSub - Netflix字幕のタイミング調整・二言語字幕 |
| ar | OTTSub - ضبط توقيت ترجمة Netflix والترجمة المزدوجة |
| hi | OTTSub – Netflix उपशीर्षक का समय समायोजन |
| he | OTTSub - סנכרון כתוביות וכתוביות בשתי שפות ב־Netflix |
| ms | OTTSub - Segerak & Sari Kata Dua Bahasa Netflix |
| bn | OTTSub - Netflix সাবটাইটেল সিঙ্ক ও দ্বৈত সাবটাইটেল |
| tr | OTTSub - Netflix alt yazı senkronu ve çift alt yazı |
| zh_TW (앱 zh-TW) | OTTSub - Netflix 字幕時間調整與雙語字幕 |
| pt_PT (앱 pt-PT) | OTTSub - Sincronização e legendas duplas na Netflix |
| ru | OTTSub — синхронизация и двойные субтитры для Netflix |


## 단일 목적 (Single Purpose)·최소 권한 (Least Privilege)

Netflix 자막 시간 조절과 주/보조 이중 자막으로 시청·언어 학습을 돕는다. 권한은 storage(설정 보관), sidePanel(설정 패널), https://*.netflix.com/*(플레이어/자막 관찰과 표시)이며 .58과 같다. tabs/scripting/downloads/all_urls 권한은 추가하지 않았다.

기존 설정 저장은 local을 우선 사용하고 sync 쓰기를 350ms debounce/flush로 합친다. Chrome storage.sync에는 `MAX_WRITE_OPERATIONS_PER_MINUTE` 등의 [쓰기 한도](https://developer.chrome.com/docs/extensions/reference/api/storage#property-sync)가 있어 요청이 실패할 수 있다. debounce가 모든 한도 초과·입력 유실을 막는다는 보장은 아니며, 실패한 기록은 다음 시작 시 재전달하는 기존 경로를 사용한다. 이 설명은 현재 구현·권한 설명이며 기기 간 동기화 작업을 재개하거나 새 기능으로 제안하는 뜻이 아니다.

배포판에 로컬 진단 recorder·ad observer·분석/시청 기록 추적 도구를 포함하지 않는다. Netflix에서 받은 자막을 브라우저에서 처리하고 환경설정을 Chrome storage에 보관한다. 기존 Chrome storage 동작을 바꾸거나 기기 간 동기화를 새 과제로 추진하지 않는다. 외부 요청 0건·완벽한 싱크·심사 승인을 보장하지 않는다.

## 개인정보처리방침·데이터 처리 고지 — 2026-10-21 공개 반영

로컬 자막 처리와 Chrome 환경설정 저장도 Chrome 웹스토어의 데이터 처리 고지 대상이다. “개발자가 자막을 서버로 수집하지 않는다”를 “데이터를 전혀 처리하지 않는다”로 바꾸어 쓰지 않는다. [공식 FAQ의 로컬 처리·저장 고지](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)와 [2026년 정책 변경](https://developer.chrome.com/blog/cws-policy-updates-2026)을 따른다.

한·영 방침 원본은 [privacy.json](geo/privacy.json)이며 기존 소개 페이지 생성 도구가 `#privacy` 섹션과 푸터 링크를 만든다. 자막·작품/재생 정보, 환경설정과 기존 Chrome 저장 경로, 보관·관리, 선택적 후원 링크, GitHub 호스팅 IP 기록, 문의 경로와 Limited Use를 설명한다. 기존 설정 구현을 바꾸거나 기기 간 동기화 과제를 재개하는 작업이 아니다.

2026-10-21 사용자 지시로 기존 홈페이지에 **실제 게시**했다. [한국어 개인정보처리방침](https://k2bact.github.io/ottsub-site/ko/#privacy), [영어 개인정보처리방침](https://k2bact.github.io/ottsub-site/#privacy)은 로그인 없이 열리고 푸터에서 접근할 수 있다. [공개 검증](../artifacts/qa/lr-comparison-20261021/live-verification.json)에서 HTTP 200·검토본 SHA-256·Pages built를 확인했다. 실제 Google 콘솔 정책 필드의 설정값은 접근/변경하지 않았다. 기존 1.3.7 배포 완료의 사용자 확인을 다시 묻거나 대기 항목으로 만들지 않는다.

## 검증·보존 기록

[최종 배포 검증](../artifacts/releases/1.3.6/verification.json)과 [QA](../docs/QA.md#release-136-20261019): 전체 105/105, 패키지 6/6, 실제 ZIP 확장 smoke 10/10. 이전 ZIP 6개·버전별 보고서·기존 locale 설명/이미지 SHA256 보존을 확인했다. 포르투갈어 이름 51/75·짧은 설명 112/132 UTF-16 code units다.

실제 Netflix/DRM·원어민 전수·발화·다른 OS 검증은 이번 범위가 아니다. Google 계정 접근·개발자 콘솔 조작·실제 업로드/심사 신청은 하지 않았다. 업로드는 사용자가 직접 한다. 기존 제출 상태를 새로 조회하거나 게시 완료로 표시하지 않는다.

## 저작권·사용 조건 (2026-10-30)

K2Bact의 권리 유보 고지는 루트 [LICENSE](../LICENSE)에 있다. 공식 배포본의 일반 이용을 허용하고 소스 재사용·수정본/재배포·상업적 재사용은 사전 서면 허락 대상으로 구분한다. 법률·GitHub 약관·제3자 권리 예외를 유지한다. 기존16언어 상세설명 준비본과3언어 홈페이지의조건링크를반영한다. 다음패키지는LICENSE를포함하며기존ZIP은소급변경하지않는다. 실제Chrome웹스토어설명변경/업로드는사용자가한다.
