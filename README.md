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

## Discogs 연동 설정 (선택)

관리자 앨범 추가 화면의 Discogs 검색과 앨범·판매글 화면의 `해외 최저가 (Discogs 참고)` 영역은 Discogs 개인 액세스 토큰을 사용합니다. 토큰이 없어도 앱은 정상 동작하며, 이 두 기능만 `정보 없음`으로 표시되거나 숨겨집니다.

1. Discogs에 로그인한 뒤 [Settings → Developers](https://www.discogs.com/settings/developers)에서 **Generate new token**으로 개인 토큰을 발급합니다. 팀원마다 각자 발급합니다.
2. `.env.example`을 `.env.local`로 복사하고 `DISCOGS_TOKEN=` 뒤에 토큰을 붙여 넣습니다.

   ```bash
   cp .env.example .env.local
   ```

3. 개발 서버를 재시작합니다. 환경 변수는 서버 시작 시 읽습니다.

- 토큰은 서버(Route Handler)에서만 읽으며 브라우저로 전달되지 않습니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.
- `.env.local`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다. 토큰이 노출되면 같은 화면에서 재발급하세요.
- Discogs 요청 한도는 토큰당 분당 60회입니다. 시세는 판본별로 6시간 캐시됩니다.
- 해외 최저가는 USD로 조회해 `src/exchange-rate.ts`의 고정 환율로 원화 환산합니다. 환율을 갱신할 때는 기준일 상수도 함께 바꿉니다.

## 현재 범위

- 활성 판매글 목록과 공유 가능한 개별 상세 URL
- 판본별 최근 6개월 데모 체결가 그래프와 시세 요약
- 판본별 1–5점 앨범 평가와 평균·참여 인원 집계
- 앨범명, 아티스트, 카탈로그 번호, 바코드 검색
- 매체, 상태, 가격 필터와 가격·최신순 정렬
- 승인된 판본을 선택하는 판매글 등록
- 필수 상태, 구성품, 하자 설명, 사진 1장 이상 검증
- 관리자 앨범 추가(Discogs 검색으로 자동 채움)와 Discogs 해외 최저가 참고 시세

데이터는 Next.js 서버 프로세스 메모리에 저장되므로 서버를 재시작하면 새로 등록한 판매글은 초기화됩니다. 인증, 영구 저장, 파일 업로드, 결제와 배송은 후속 증분 범위입니다.
