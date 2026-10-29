# 스토어 설명 수정 근거

복사할 최종 설명: [스페인어](es/listing.txt), [영어](en-us/listing.txt), [한국어](ko-kr/listing.txt). 계정 접속/업로드/게시 안 함. 확장 코드와 ZIP 변경 없음.

- `zero external network requests` 삭제: `src/network/track-fetcher.js`가 Netflix 자막 CDN에 fetch 요청함.
- `100% Privacy`, `zero video frame drop`, `most seamless` 등 입증하지 않은 절대 성능·품질 표현 삭제.
- Chrome 저장소 및 Chrome Sync 사용을 명시. 로컬 진단 도구 제외 설명은 스토어판으로 한정.
- Primary를 음성 원어로 고정하지 않음. `popup/modules/ui-primary.js`의 자동/직접 언어 선택 반영.
- 양쪽 크기 60–140%라는 설명 수정. `popup/modules/ui-style.js` UI 기준 주언어 60–140%, 보조언어 60–120%.
- 크레딧 자체를 인식한다는 표현을 원본 자막 위치에 따른 배치 조정으로 완화.
- 현재 side panel, 블러/숨김 및 hover pause 반영. 단축키는 `src/input/keyboard-router.js`와 대조.
- 광고 감지 중 숨김 및 광고/탐색 후 시간 검증, 원본 언어 임시 노출을 명시. [실제 로그 분석](../archive/docs/live-qa/2026-10-12-seek-language/README.md).
- 세 언어 설명은 동일한 기능과 제약을 설명한다. 사용 가능한 언어는 Netflix 작품/계정별이며 자동 번역 기능으로 표현하지 않는다.

## 스페인어 스크린샷 상태

**최신: 제작 완료.** [3장 파일·크기·검증](es/README.md). 아래는 이전 실패 시점 기록이다. 2026-10-12 후속 요청에서 허용된 브라우저로 캡처하고 시각 검토를 마쳤다.

`es/source/`에 현재 popup HTML/CSS/JS와 스페인어 번역을 렌더링하는 로컬 제작 소스를 작성했다. 3장 구성: 이중 자막 / 싱크 / 학습. 데이터·자막은 명시적인 데모다. 디버그 도구와 제품 ZIP에는 추가하지 않는다.

**미완료:** 자동 승인 검토 시스템이 사용량 한도 때문에 `http://127.0.0.1:49177/` 브라우저 접근 검토를 완료하지 못했다. 위험 판정이 아니지만 우회해서 캡처하지 않았다. 이미지 렌더링/시각 검증/최종 JPG 생성은 아직 수행하지 못했다. 서버는 종료했다. 승인 검토가 가능해지면 `python -B store_assets/es/source/serve.py` 후 허용된 브라우저로 1280×800의 3개 슬라이드를 캡처한다.
