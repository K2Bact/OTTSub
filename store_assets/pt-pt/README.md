# 포르투갈어(포르투갈) 스토어 등록 자료 — 1.3.6

등록 언어는 **Português (Portugal)**이다. 앱 UI 코드는 `pt-PT`, ZIP의 Chrome locale 폴더는 `_locales/pt_PT`다. 브라질 포르투갈어(pt_BR)나 국가별 배포 지역 선택과 구분한다. [Chrome 공식 locale 목록](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)과 [등록정보 현지화 안내](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize_your_listing)를 따른다.

- [이름·짧은 설명](metadata.txt): ZIP의 pt_PT messages.json과 동일한 복사용 문구.
- [상세 설명](listing.txt): 그대로 붙여 넣을 UTF-8 포르투갈어 본문.
- 스크린샷 순서: [1. 이중 자막](screenshot1_dual_pt-pt.jpg), [2. 싱크 조절](screenshot2_sync_pt-pt.jpg), [3. 학습 기능](screenshot3_learning_pt-pt.jpg).
- 업로드 파일: [ottsub-store-1.3.6.zip](../../dist/ottsub-store-1.3.6.zip).

3장은 **1280×800 RGB JPEG**다. 업로드 ZIP에서 추출한 실제 포르투갈어(포르투갈) popup HTML/CSS/JS를 사용했다. 연결 상태·자막 수·대사는 제작용 예시이며 하단에 포르투갈어로 표시했다. 실제 Netflix 작품 화면이나 DRM 재생 검증은 아니다. 기존 공통 프로모션/아이콘과 [히브리어 설명·스크린샷](../he/README.md)을 포함한 기존 자료는 보존했다.

재생성: 프로젝트 루트에서 `node store_assets/common/capture-localized.cjs pt-PT`. 앱/브라우저 UI 코드는 pt-PT, 이미지 폴더·파일 접미사는 pt-pt, 실제 보조 자막 선택값은 pt-pt이며 다른 지역 자막과 합치지 않는다. [문구 원본](source/slides.json), [3장 제작 결과](verification.json), [보존·최종 검사](../../artifacts/qa/pt-pt-store-shots-20261019/verification.json), [전체 등록 안내](../STORE_GUIDE.md)를 따른다. 제품/ZIP/버전은 이번 이미지 작업으로 바꾸지 않았다.
