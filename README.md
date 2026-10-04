# 스도쿠 탐험
어린이가 실제 퍼즐에서 풀이 방법을 발견하는 모바일 웹앱.

## 실행
Node.js 22 이상. 외부 의존성 없음.

```
npm ci
npm run dev
npm test
npm run build
```

개발 주소: http://localhost:5173. 정적 배포 디렉터리: `dist`. Cloudflare Pages에서는 빌드 명령 `npm run build`, 출력 디렉터리 `dist`를 사용한다. Workers Static Assets는 `wrangler.jsonc`를 사용한다.

## 첫 버전
- 학습: 한 칸의 유일 후보 / 한 구역에서 숫자의 유일 자리. 도움받는 장면 이후 혼자 적용.
- 문제: 6×6(2×3 상자), 정답 유일성 및 두 기법으로의 완주 가능성 검증.
- 3단계 힌트, 후보 메모, 충돌 표시, 되돌리기, 문제 자동 저장.
- 학습으로 전환해도 문제 진행 유지. 시간 제한 및 생명 차감 없음.

[설계](docs/design.md)
