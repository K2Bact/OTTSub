# 홈페이지 설명과 유입 측정

한국어·영어·스페인어 홈페이지 원본은 content.json, 개인정보 고지는 privacy.json, 고정 캠페인 값은 campaigns.json이다. build.cjs로 미리보기 또는 기존 GitHub Pages용 파일을 만든다. 앱 배포 패키지에는 이 폴더가 들어가지 않는다.

홈페이지의 스토어 링크는 `utm_source=ottsub_site`, `utm_medium=referral`을 사용한다. `utm_campaign`은 `site_help_20261022_ko_hero`처럼 언어·위치까지 고정해 Chrome 문서에 명시된 캠페인 차원으로 구분한다. `utm_content`에도 `ko_hero`, `ko_footer`, `ko_privacy` 또는 `en_...`·`es_...`를 넣되 이 추가 차원의 제공 여부에만 의존하지 않는다. 개인정보·자막·시청 정보·임의 입력값은 링크에 붙이지 않는다. canonical·구조화 데이터의 제품 URL에는 UTM을 넣지 않는다.

개발 테스트는 스토어를 실제로 열지 않는 오프라인 QA를 우선한다. 별도로 실제 테스트 링크를 만들 때는 campaigns.json의 `ottsub_devtest / referral / qa_only`를 사용한다. 정상 공개 링크를 클릭한 개발자의 방문은 자동 식별되지 않는다. 도시·국가로 테스트 사용자를 추정해 제외하지 않는다.

## 주간 CSV 비교

계정 접속이나 새 분석 SDK 없이 사용자가 내보낸 집계 자료로만 비교한다. Chrome 웹스토어 GA4는 스토어 상세페이지 통계다. 홈페이지 자체 방문이나 확장 프로그램의 실제 사용 횟수로 바꾸어 해석하지 않는다.

1. `weekly-template.csv`의 헤더를 유지하고 같은 기간·보고서의 집계값을 행으로 옮긴다. GA4 원본에는 보고서마다 열과 범위가 다르므로 임의 자동 매핑하지 않는다. 원본 CSV를 함께 보관한다.
2. `property_id`, `timezone`, `filters`에는 실제 속성·시간대·필터를 적는다. `scope=total`은 원본 전체 집계이며 출처 4칸을 비운다. 출처별 세션 기준 집계는 `session_campaign`을 쓴다. 서로 다른 집계 기준을 섞지 않는다.
3. 시작일·종료일은 양 끝 포함 7일이다. `audience`는 확인된 실제 유입 `production`, 확인된 개발 테스트 `test`, 구별할 수 없는 경우 `unknown`이다. 근거가 없으면 unknown을 쓴다.
4. `visitors`는 상세페이지 고유 방문자, `install_users`는 설치 이벤트가 있는 고유 사용자, `install_events`는 설치 완료 이벤트 횟수다. 같은 모집단·필터에서 설치자가 방문자의 부분집합임을 확인했을 때만 `same_population=true`를 쓴다. 모르면 false로 적고 전환율을 계산하지 않는다.
5. `sessions`, `engaged_sessions`, `page_views`도 같은 보고서 조건의 집계값이다. 미제공·임계값 처리된 숫자는 빈칸으로 두며 0으로 대체하지 않는다. 채널별 고유 방문자를 더해 전체 방문자 수를 만들지 않는다.
6. 아래 명령으로 로컬 HTML·JSON을 만든다. 원본 입력은 바꾸지 않는다.

```powershell
node store_assets/geo/measure.cjs --input artifacts/analytics/weekly.csv --out artifacts/analytics/weekly-result
```

`weekly.html`은 같은 속성·시간대·필터·출처·테스트 구분의 바로 이전 7일과 비교한다. 시험 유입은 제외 목록에 따로 보존하고 미확인은 별도로 표시한다. 표본이 작을 때의 변화를 성장성이나 인과 효과로 확정하지 않는다. 공개 후 데이터 반영까지 시간을 두고 완료된 기간끼리 비교한다.

AI 추천 여부는 evaluation.json의 질문·실제 답변·인용 URL·증거로 별도 기록한다. chatgpt.com에서 온 방문만으로 추천 성공 처리하지 않는다. 실제 관찰값이 없으면 not_measured를 유지한다. 예약 실행·자동 AI/API 호출은 하지 않는다.

근거: [Chrome 웹스토어 GA4 이벤트·UTM](https://developer.chrome.com/docs/webstore/google-analytics), [GA4 참여율·반송률](https://support.google.com/analytics/answer/12195621?hl=en). 등록·수집·색인·노출·클릭·설치는 서로 다른 단계다. 이번 작업의 판정·검사·게시 기록은 [AI 대화](../../OttsubAiTalk.md#geo-improvements-20261022)를 따른다.

## 저작권·사용 조건

권리 고지 요약의 원본은 `rights.json`이며 전체 조건은 프로젝트 루트 `LICENSE`다. 빌드 시 영어·한국어·스페인어의 `#terms`와 하단 링크/고지, 동일한 `LICENSE` 파일을 생성한다. 공식 배포본의 일반적인 최종 사용자 이용 허락과 소스 재사용·수정본/재배포·상업적 재사용의 별도 허락을 구분한다. 법률/GitHub/제3자 권리 예외를 유지한다.
