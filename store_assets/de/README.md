# 독일어 등록 자료

2026-10-14: 현재 **1.3.2 실제 독일어 설정 UI**로 스토어 스크린샷 3장을 제작했다. Deutsch 현지화 항목에 아래 순서로 올리면 된다. 업로드는 사용자가 직접 한다.

1. [이중 자막](screenshot1_dual_de.jpg) — 영어 + 독일어 선택과 두 언어 상태.
2. [싱크 조절](screenshot2_sync_de.jpg) — 언어별 싱크, 0.1초 조절 및 단축키. 실제 UI 슬라이더를 −100ms로 조작했다.
3. [학습 기능](screenshot3_learning_de.jpg) — 보조언어 블러와 마우스 오버 일시정지.

모두 **1280×800 RGB JPEG**다. 독일어 표시, 주요 설명·컨트롤의 잘림을 육안 확인했다. 브라우저 오류 없음, 선택 언어·블러·싱크 상태와 해시는 [verification.json](verification.json)에 기록했다. [Chrome Web Store 이미지 규격](https://developer.chrome.com/docs/webstore/images)을 기준으로 제작했다.

설정창은 제품의 실제 HTML/CSS/JS와 독일어 번역을 렌더링했다. 연결 상태와 자막 수는 제작용 모의 데이터이며, 자막 예시는 직접 작성했다. 하단에 데모 데이터임을 표시했다. Netflix 작품 화면이나 실제 재생 검증 결과를 나타내지 않는다.

재현: `node store_assets/de/source/capture.cjs`. Playwright Chromium을 사용하며 모든 요청을 로컬 파일로 처리한다. [독일어 HTML](source/index.html), [Chrome API 제작용 데이터](source/fixture.js)가 함께 보관돼 있다. 이 폴더는 배포 ZIP 밖에 있으며, 제품 코드와 기존 1.3.2 ZIP은 변경하지 않았다.

기존 [설명문 초안](listing.txt)은 2026-10-12 .22 기준 자료다. 현재 스토어 설명은 대화에서 제공한 붙여넣기용 문안을 사용한다.
