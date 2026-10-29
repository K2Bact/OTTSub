# 벵골어 스토어 등록 자료 — 1.3.5

스토어 등록정보에서 **বাংলা / Bengali (bn)**를 추가하고 아래 파일을 사용한다. 방글라데시용 등록 언어는 bn이며 국가별 배포 지역 선택과는 서로 다른 설정이다.

- [이름·짧은 설명](metadata.txt): ZIP의 `_locales/bn/messages.json`과 동일한 복사용 문구.
- [상세 설명](listing.txt): 그대로 붙여넣을 UTF-8 본문.
- 스크린샷 순서: [1. 이중 자막](screenshot1_dual_bn.jpg), [2. 싱크 조절](screenshot2_sync_bn.jpg), [3. 학습 기능](screenshot3_learning_bn.jpg).

3장은 **1280×800 RGB JPEG**이며 1.3.5 ZIP에서 추출한 실제 벵골어 popup HTML/CSS/JS를 사용한다. 연결 상태·자막 수·대사는 제작용 예시이고 이미지 하단에 이를 표시했다. 실제 Netflix 작품/DRM 재생이나 원어민 전수 검수 결과로 사용하지 않는다.

재생성: 프로젝트 루트에서 `node store_assets/common/capture-localized.cjs bn`. 패키지 runtime과 임시 파일은 `artifacts/releases/1.3.5`를 사용한다. 문구 원본은 [source/slides.json](source/slides.json), 이미지/ZIP 해시와 UI·배치 확인은 [verification.json](verification.json)에 기록한다. 기존 공통 프로모션 타일/아이콘은 유지한다. [등록 지침](../STORE_GUIDE.md).
