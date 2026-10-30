# 스토어 등록 자료 — 1.3.9 / 16언어

2026-10-29 제품 세부정보의 설명란은 [한국어 전체 수정본](ko-kr/listing.txt)·[영어 전체 수정본](en-us/listing.txt)을 사용한다. Chrome114 조건·Netflix 구독/광고 범위를 명확히 하고 예전 키보드 안내를 제거했다. 다른 언어와 이름/짧은 설명은 그대로이며 1.3.9 ZIP도 바뀌지 않았다. [문구 대조](../docs/QA.md#store-listing-139-ko-en-20261029).

2026-10-29 현재 업로드용 파일은 **[ottsub-store-1.3.9.zip](../dist/ottsub-store-1.3.9.zip)**이다. **185,823 bytes·63파일·16언어**. 직전 제품 코드의 안내문 삭제·sidePanel 오류 방어·최소Chrome114 선언을 포함한다. 개발 버전명/진단기/테스트/문서/보고서 파일은 제외하고 개발 시장조사 링크는 숨긴다. 패키지6/6(SKIP0)·실제ZIP37/37 통과. 새 UI 언어가 없어 등록 문구/이미지는 이번에 재제작하지 않았다. 기존ZIP9개는 보존하며 실제 업로드는 사용자가 직접 한다. [이번QA](../docs/QA.md#release-139-20261029)·[AI기록](../OttsubAiTalk.md#release-139-20261029).

## 이전 배포 준비 기록 — 1.3.8 이하

아래 버전·파일 크기·제작 출처는 각 당시 기록이다.

2026-10-22 홈페이지 연결 후속 .67: [현재 ZIP](../dist/ottsub-store-1.3.8.zip) **185,601 bytes·63파일**. [fi](fi/README.md)·[th](th/README.md) 이미지6장을 이 ZIP으로 재촬영했다. 설명문은 그대로 사용한다. 아래 .66의 크기·해시·히브리어 갱신은 당시 기록이며 이번 사용 대상은 fi/th다. [검사](../docs/QA.md#homepage-link-20261022).

2026-10-22 사용자 요청으로 현재 개발본을 **1.3.8/.66·16언어**로 준비했다. [업로드 ZIP](../dist/ottsub-store-1.3.8.zip)은 **63파일·185,472 bytes**이며 기존 ZIP8개를 보존했다.

새 ZIP의 실제 UI로 [핀란드어 자료](fi/README.md)·[태국어 자료](th/README.md)·기존 요청의 [히브리어 자료](he/README.md)를 준비했다. 각 폴더에는 metadata.txt(이름·짧은 설명), listing.txt(상세 설명), 이중/싱크/학습 1280×800 RGB JPEG3장과 검증/문구 원본이 있다. 기존 상세 설명의 언어 목록도 16언어로 맞췄다.

이름·짧은 설명은 ZIP 메타데이터와 같고 이미지는 예시 상태·대사임을 표시한다. 실제 업로드는 사용자가 직접 한다. [등록 지침](STORE_GUIDE.md)·[이번 QA](../docs/QA.md#release-138-20261022)·[AI 기록](../OttsubAiTalk.md#release-138-20261022)을 따른다.

## 이전 등록 자료 이력

아래 버전·개수·출처는 각 제작 당시 기록이다.


2026-10-21 사용자 요청으로 [태국어 이름·짧은/상세 설명과 3종 스크린샷](th/README.md)을 준비했다. 검수된 .60/15언어의 실제 배포 입력 UI를 사용한 1280×800 RGB JPEG이며 예시 상태·대사임을 표시했다. 기존 .59/14언어 ZIP과 구분하고 [검사](../docs/QA.md#th-store-shots-20261021)·[AI 기록](../OttsubAiTalk.md#th-store-shots-20261021)을 따른다. 아래 14언어 배포 자료 설명은 당시 자료 범위다.

2026-10-20 GEO 후속으로 14언어 설명의 첫 문장을 제품 정의로 정리하고 시작 방법·누락된 자막 언어 안내와 공개 사이트 링크를 추가했다(FAQ 5문항). **[한국어 소개 페이지](https://k2bact.github.io/ottsub-site/ko/)·[영어 소개 페이지](https://k2bact.github.io/ottsub-site/)**를 GitHub Pages에 게시했다. [공개 저장소](https://github.com/K2Bact/ottsub-site)는 소개 페이지 자산만 담고 앱 코드 저장소는 비공개다. [콘텐츠 원본](geo/content.json), [로컬 검사](../artifacts/qa/geo-20261020/verification.json), [게시 후 HTTP·메타데이터 검사](../artifacts/qa/geo-20261020/live-verification.json), [최신 작업 기록](../OttsubAiTalk.md#geo-publication-20261020)을 따른다. 제품 입력·기존 ZIP은 바꾸지 않았다.

소개 페이지는 `node store_assets/geo/build.cjs`로 생성한다. 기본 `geo/site/` 출력은 **noindex 로컬 미리보기**이며 그대로 공개하면 검색 대상이 되지 않는다. 공개본은 `--base-url https://k2bact.github.io/ottsub-site/`로 canonical·언어별 alternate·사이트맵을 생성한 것이다. [게시 파일 명세](../artifacts/qa/geo-20261020/github-pages-candidate.json)의 6파일을 사용자 승인 후 게시했고 [배포 결과](../artifacts/qa/geo-20261020/github-publication.json)에 커밋·주소·비공개 앱 경계를 기록했다. GitHub 프로젝트 하위 경로에서는 `robots.txt`를 생성하지 않는다. 크롤러 정책은 호스트 루트의 파일이 결정하며 확인 당시 루트 robots.txt는 404였다. 다른 프로젝트의 루트 설정은 바꾸지 않았다.

`node store_assets/geo/verify.cjs`는 오프라인 Chromium으로 콘텐츠·메타데이터·레이아웃을 검사한다. [효과 관찰 기준](geo/evaluation.json)의 질문 10개는 아직 답변·인용 성공을 측정하지 않았으며, 자동 AI/API 호출을 하지 않는다. 별도 AI 전용 파일이나 가짜 평가·사용자 수·리뷰를 추가하지 않았다.

2026-10-20 Gemini가 **14개 UI 언어의 스토어 상세 설명(`listing.txt`)을 요약·기능·단축키·FAQ 구조로 정리**했고, Codex가 구현·검증 범위와 대조해 설명을 정정했다. 무료·무가입은 OTTSub 자체에 대한 설명이며 Netflix 계정·구독은 별도로 필요하다. 데스크톱 Chrome을 대상으로 하고 Windows Edge의 로컬 호환성 검사와 일부만 완료한 Mac 검증을 구분한다. 다른 Chromium 브라우저의 호환성을 보장하지 않으며 이 패키지는 모바일 Chrome·Safari용이 아니다. [검토·수정 및 QA](../OttsubAiTalk.md#aeo-review-20261020), [Gemini 수정 전 설명문](../archive/docs/reviews/2026-10-20-aeo-stage1/before/), [Codex 검토 전 상태](../archive/docs/reviews/2026-10-20-aeo-review/before/)를 따른다.

**현재 14언어 설명문은 새 1.3.7 ZIP과 일치하는 업로드용 자료다.** 러시아어 [이름·짧은 설명](ru/metadata.txt), [상세 설명](ru/listing.txt), [실제 1.3.7 UI 스크린샷 3장](ru/README.md)을 함께 준비했다. [새 ZIP](../dist/ottsub-store-1.3.7.zip)·[최종 대조](../artifacts/releases/1.3.7/verification.json)를 따른다. 기존 ZIP·다른 언어의 과거 버전 이미지는 보존했고 실제 업로드는 사용자가 한다.

FAQ와 명확한 기능 설명은 독자의 이해를 돕는 편집이다. 검색/AI 답변에서 노출·인용·추천이 늘었다는 실측은 없다. Google도 AI 검색에 특별한 마크업·최적화가 필수는 아니며 색인·노출을 보장하지 않는다고 안내한다([공식 안내](https://developers.google.com/search/docs/appearance/ai-features)). 확장 내부 `aria-label` 보강은 접근성·조작 식별 개선이며 공개 스토어 검색 색인의 개선 증거는 아니다.

포르투갈어 3장은 기존 1.3.6 ZIP UI로 제작한 당시 자료로 보존했다([검사](pt-pt/verification.json)). 최신 업로드 준비 ZIP은 [1.3.7](../dist/ottsub-store-1.3.7.zip)이며 **당시 14개 메뉴 언어**를 포함한다. 현재 개발 소스는 태국어를 포함한 15언어다. 국가별 배포 지역과 등록 언어는 별도다.

| 스토어 언어 | 등록 자료 | 이미지 |
|---|---|---|
| **한국어 (ko)** | [상세 설명 (AEO)](ko-kr/listing.txt) | 기존 ko-kr PNG/프로모션 보존 |
| **English (en)** | [상세 설명 (AEO)](en-us/listing.txt) | 기존 en-us PNG/프로모션 보존 |
| **ไทย (th)** | [이름·짧은 설명](th/metadata.txt), [상세 설명](th/listing.txt), [안내](th/README.md) | .60 실제 배포 입력 UI의 1280×800 RGB JPEG 3장 |
| **Русский (ru)** | [이름·짧은 설명](ru/metadata.txt), [상세 설명](ru/listing.txt), [안내](ru/README.md) | 실제 1.3.7 러시아어 UI의 1280×800 RGB JPEG 3장 |
| **Português (Portugal), pt_PT** | [이름/짧은 설명](pt-pt/metadata.txt), [상세 설명 (AEO)](pt-pt/listing.txt), [안내](pt-pt/README.md) | 실제 1.3.6 포르투갈어 UI의 1280×800 RGB JPEG 3장 |
| **繁體中文 (zh_TW)** | [상세 설명 (AEO)](zh-tw/listing.txt) | 추후 현지화 이미지 제작 대상 |
| **Türkçe (tr)** | [이름/짧은 설명](tr/metadata.txt), [상세 설명 (AEO)](tr/listing.txt), [등록 안내](tr/README.md) | 1.3.5의 1280×800 RGB JPEG 3장 보존, 실제 1.3.5 터키어 UI |
| **বাংলা (bn)** | [이름/짧은 설명](bn/metadata.txt), [상세 설명 (AEO)](bn/listing.txt), [등록 안내](bn/README.md) | 1.3.5의 1280×800 RGB JPEG 3장 보존, 실제 1.3.5 벵골어 UI |
| **עברית (he)** | [이름/짧은 설명](he/metadata.txt), [상세 설명 (AEO)](he/listing.txt), [등록 안내](he/README.md) | 1.3.4 RTL 이미지 3장 보존 |
| **Bahasa Melayu (ms)** | [이름/짧은 설명](ms/metadata.txt), [상세 설명 (AEO)](ms/listing.txt), [등록 안내](ms/README.md) | 1.3.4 LTR 이미지 3장 보존 |
| **हिन्दी (hi)** | [상세 설명 (AEO)](hi/listing.txt), [이미지 안내](hi/README.md) | 1.3.3/.41 UI 3장 보존 |
| **Español (es)** | [상세 설명 (AEO)](es/listing.txt), [이미지 안내](es/README.md) | 기존 이미지 보존 |
| **Deutsch (de)** | [상세 설명 (AEO)](de/listing.txt), [이미지 안내](de/README.md) | 기존 이미지 보존 |
| **日本語 (ja)** | [상세 설명 (AEO)](ja/listing.txt), [이미지 안내](ja/README.md) | 기존 이미지 보존 |
| **العربية (ar)** | [상세 설명 (AEO)](ar/listing.txt), [이미지 안내](ar/README.md) | 기존 RTL 이미지 보존 |

기존 tr/bn 6장은 당시 1.3.5 ZIP에서 추출한 실제 UI와 별도 예시 자막/연결 상태로 제작했다. 하단에 예시임을 표시했고 실제 Netflix 작품 영상/DRM 검증을 뜻하지 않는다. 제작 원본은 tr/source·bn/source와 common/capture-localized.cjs다. 언어별 verification.json에 이미지와 ZIP 해시·배치·언어·버전을 기록한다. 최종 [배포 검증](../artifacts/releases/1.3.7/verification.json), [등록·권한 지침](STORE_GUIDE.md).

기존 he/ms/hi 및 ko-kr/en-us/es/de/ja/ar 이미지와 공통 프로모션/아이콘은 보존했다. 작은 프로모션 타일은 440×280, 마키는 1400×560이다. 프로모션 타일은 기존 공통 자료를 사용한다.

## 저작권·사용 조건 (2026-10-30)

K2Bact의 권리 유보 고지는 루트 [LICENSE](../LICENSE)에 있다. 공식 배포본의 일반 이용을 허용하고 소스 재사용·수정본/재배포·상업적 재사용은 사전 서면 허락 대상으로 구분한다. 법률·GitHub 약관·제3자 권리 예외를 유지한다. 기존16언어 상세설명 준비본과3언어 홈페이지의조건링크를반영한다. 다음패키지는LICENSE를포함하며기존ZIP은소급변경하지않는다. 실제Chrome웹스토어설명변경/업로드는사용자가한다.
