# 말레이어 스토어 등록 자료 — 1.3.4

2026-10-18: 상세 설명의 메뉴 목록은 1.3.5의 11언어로 갱신했다. 아래 이미지와 이미지 검증 기록은 기존 버전 그대로 보존한다.

스토어 등록정보의 **Bahasa Melayu(ms)**에 아래 자료를 사용한다.

- [이름·짧은 설명](metadata.txt): ZIP의 `_locales/ms/messages.json`과 동일하다.
- [상세 설명](listing.txt): 그대로 붙여넣을 UTF-8 본문.
- 스크린샷 순서: [1. 이중 자막](screenshot1_dual_ms.jpg), [2. 싱크 조절](screenshot2_sync_ms.jpg), [3. 학습 기능](screenshot3_learning_ms.jpg).

이미지는 모두 **1280×800 RGB JPEG**다. 1.3.4 업로드 ZIP에서 추출한 실제 popup HTML/CSS/JS와 말레이어 LTR 화면으로 제작했다. 연결 상태·자막 수·대사는 제작용 예시이며 이미지 하단에 이를 표시했다. 실제 Netflix 작품 화면이나 DRM/실기 검증의 증거가 아니다. 이름/설명 길이·구조와 제품 기능 대조를 수행했으며 원어민 검수 완료를 주장하지 않는다.

재생성: 프로젝트 루트에서 `node store_assets/common/capture-localized.cjs ms`. 패키지 runtime과 임시 폴더는 `artifacts/releases/1.3.4`를 사용한다. 문구 원본은 [source/slides.json](source/slides.json), 해시·버전·LTR/언어·레이아웃·오류 검사 결과는 [verification.json](verification.json)에 있다. 프로모션 타일과 아이콘은 기존 공통 자료를 사용한다. 전체 패키지와 등록 방법은 [등록 지침](../STORE_GUIDE.md)을 따른다.
