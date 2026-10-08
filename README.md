# VYNL 게시판 MVP

PRD의 검색·상세·판매 등록 범위를 먼저 구현한 TypeScript 기반 Next.js App Router 프로토타입입니다.

## 실행

Node.js 20.9 이상에서 실행할 수 있습니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 프로덕션 실행은 `npm run build && npm start`를 사용합니다.

```bash
npm run typecheck
npm test
```

`typecheck`는 strict TypeScript 검사를, `test`는 TypeScript 테스트를 실행합니다.

## 현재 범위

- 활성 판매글 목록과 공유 가능한 개별 상세 URL
- 판본별 최근 6개월 데모 체결가 그래프와 시세 요약
- 판본별 1–5점 앨범 평가와 평균·참여 인원 집계
- 앨범명, 아티스트, 카탈로그 번호, 바코드 검색
- 매체, 상태, 가격 필터와 가격·최신순 정렬
- 승인된 판본을 선택하는 판매글 등록
- 필수 상태, 구성품, 하자 설명, 사진 1장 이상 검증

데이터는 Next.js 서버 프로세스 메모리에 저장되므로 서버를 재시작하면 새로 등록한 판매글은 초기화됩니다. 인증, 영구 저장, 파일 업로드, 결제와 배송은 후속 증분 범위입니다.
