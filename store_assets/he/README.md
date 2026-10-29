# 히브리어 스토어 등록 자료 — 1.3.8

등록 언어는 **עברית / Hebrew (he)**다.

- [metadata.txt](metadata.txt): 아래 확장 이름과 짧은 설명. ZIP의 _locales/he/messages.json과 동일하다.
- [listing.txt](listing.txt): 사용법·기능·단축키·FAQ·Netflix 조건·호환 범위·개인정보처리방침을 포함한 상세 설명.
- 스크린샷: [1. 이중 자막](screenshot1_dual_he.jpg) · [2. 싱크 조절](screenshot2_sync_he.jpg) · [3. 학습 기능](screenshot3_learning_he.jpg)

**이름 (52/75 UTF-16 code units)**

OTTSub - סנכרון כתוביות וכתוביות בשתי שפות ב־Netflix

**짧은 설명 (85/132 UTF-16 code units)**

כיוון תזמון הכתוביות ב־Netflix והצגת כתוביות בשתי שפות, עם קיצורי מקשים ופקדים נוחים.

이미지는 **1280×800 RGB JPEG**이며 업로드용 [ottsub-store-1.3.8.zip](../../dist/ottsub-store-1.3.8.zip)에서 추출한 실제 popup HTML/CSS/JS와 별도의 예시 상태·대사로 만들었다. 각 언어로 하단에 예시임을 표시했다. 실제 Netflix 작품/DRM 캡처·원어민 감수·업로드 완료의 증거는 아니다.

ZIP SHA-256: 96c4772fbb5624a48a5c694783df697b9172c7183d7bcf79efbe45423686061c

[verification.json](verification.json)에 ZIP·runtime·이미지 해시, UI 언어·방향·버전·음수 싱크·학습 카드 펼침/가림·호버·잘림 검사를 남겼다. 원본 문구는 [source/slides.json](source/slides.json)이다. 기존 파일은 archive/docs/releases/2026-10-22-1.3.8/before에 보존했다.

재생성은 새 ZIP을 artifacts/releases/1.3.8/runtime에 안전하게 추출한 뒤 프로젝트 루트에서 node store_assets/common/capture-localized.cjs he를 실행한다. 전체 [등록 지침](../STORE_GUIDE.md)·[이번 QA](../../docs/QA.md#release-138-20261022)·[AI 기록](../../OttsubAiTalk.md#release-138-20261022)을 따른다. 실제 업로드는 사용자가 직접 한다.
