# 힌디어 스토어 등록 자료 — 1.3.3

2026-10-18: 상세 설명의 메뉴 목록은 1.3.5의 11언어로 갱신했다. 아래 이미지와 이미지 검증 기록은 기존 버전 그대로 보존한다.

스토어 등록정보에서 हिन्दी(hi)를 선택하고 [설명](listing.txt)을 붙여넣는다. 확장 이름과 짧은 설명은 ZIP의 `_locales/hi/messages.json`에 포함한다. Google 계정 접속·스토어 업로드·심사 신청은 사용자가 직접 한다.

스크린샷은 아래 순서이며 모두 1280×800 RGB JPEG다.

1. [이중 자막](screenshot1_dual_hi.jpg)
2. [싱크 조절](screenshot2_sync_hi.jpg)
3. [학습 기능](screenshot3_learning_hi.jpg)

현재 1.3.3/.41 제품 HTML/CSS/JS와 실제 힌디어 UI를 사용한다. 주요 문구/컨트롤의 잘림을 육안 확인했고 가로 넘침·브라우저 오류는 없다. 연결 상태·자막 수·대사는 제작용 모의 데이터다. 하단에 데모임을 표시하며 실제 Netflix 장면이나 Mac 전체 호환성 검증을 나타내지 않는다.

제작/검증: `node store_assets/hi/source/capture.cjs`. 로컬 오프라인 Chromium만 사용한다. 언어·버전·선택·가로 넘침·브라우저 오류·이미지 해시는 [verification.json](verification.json)에 남긴다. 등록·게시 완료와 구분한다.
