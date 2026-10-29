# 러시아어 스토어 등록 자료 — 1.3.7

등록 언어는 **Русский / Russian (ru)**다. 새 업로드 파일은 [ottsub-store-1.3.7.zip](../../dist/ottsub-store-1.3.7.zip)이며 러시아어를 포함한 14개 메뉴 언어를 담았다. UI 언어와 Netflix 작품의 자막 제공 언어는 별개다.

- [이름·짧은 설명](metadata.txt): ZIP의 `_locales/ru/messages.json`과 같은 복사용 문구.
- [상세 설명](listing.txt): 사용법·FAQ 5문항·영어 제품 소개 사이트 링크를 포함한 러시아어 본문.
- 스크린샷 순서: [1. 이중 자막](screenshot1_dual_ru.jpg) → [2. 싱크 조절](screenshot2_sync_ru.jpg) → [3. 학습 기능](screenshot3_learning_ru.jpg).

3장은 **1280×800 RGB JPEG**다. 새 1.3.7 ZIP에서 추출한 실제 popup HTML/CSS/JS와 별도로 제공한 예시 연결 상태·자막 트랙·대사로 제작했으며, 하단에 예시임을 러시아어로 표시했다. 실제 Netflix 작품 영상이나 DRM 재생을 검증한 캡처가 아니다.

원본 문구는 [source/slides.json](source/slides.json), 제작 도구는 [기존 공통 도구](../common/capture-localized.cjs)다. 재생성 명령은 프로젝트 루트의 `node store_assets/common/capture-localized.cjs ru`이며 현재 manifest 버전의 `artifacts/releases/<version>/runtime`을 사용한다. [검증 JSON](verification.json)에 UI 언어·방향·버전·실제 음수 싱크·학습 카드 펼침과 이미지/ZIP 해시를 기록한다. [등록·권한 지침](../STORE_GUIDE.md), [배포 검사](../../artifacts/releases/1.3.7/verification.json)를 따른다. 스토어 업로드는 사용자가 직접 한다.
