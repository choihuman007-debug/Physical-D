import { useState, useCallback, useEffect, useRef } from "react";

// ─── GOOGLE SHEETS 연동 ($0 비용, AI API 아님) ───
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwdG3Tow1sarsa-tHEzDm0L3MiIpynv5EQJE66Ft3mYOd75Qt5L1IsIHE0ETSIr6IM/exec';

async function callSheets(action, body = {}) {
  const response = await fetch(APPS_SCRIPT_URL + '?action=' + action, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || '저장 실패');
  return data;
}
async function readSheets(action, params = '') {
  const url = APPS_SCRIPT_URL + '?action=' + action + (params ? '&' + params : '');
  const response = await fetch(url);
  const data = await response.json();
  if (!data.success) throw new Error(data.error || '조회 실패');
  return data;
}

// ─── EMBEDDED LIBRARY DATA (170 exercises) ───
const RAW_LIB = [{"id":"PW-001","n":"바벨 행 클린","ne":"Barbell Hang Clean","p":"Hinge","t":"Power","tg":"Full Body","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x3","rs":"150s","it":"75-85%","pt":"힙 힌지에서 폭발적 트리플 익스텐션, 프론트 랙 캐치","v":"https://youtu.be/DaKC_BEN5bk?si=lRFIFF35WCnD50lM"},{"id":"PW-002","n":"바벨 파워 클린","ne":"Barbell Power Clean","p":"Hinge","t":"Power","tg":"Full Body","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x3","rs":"150s","it":"75-85%","pt":"1st Pull 천천히, 2nd Pull 폭발적","v":"https://youtube.com/shorts/bmAkgnh7xjc?si=LcdVEB3iHl5e8ZR2"},{"id":"PW-003","n":"트랩바 점프","ne":"Trap Bar Jump","p":"Plyo","t":"Power","tg":"Quad","eq":"TrapBar","sp":"Fast","sc":"Main","sr":"4x5","rs":"120s","it":"30-40%","pt":"최대 높이 점프, 착지 소프트하게","v":"https://youtube.com/shorts/0e6RAkY_Zbk?si=RV_Zh_GFktuizb-c"},{"id":"PW-004","n":"박스 점프","ne":"Box Jump","p":"Plyo","t":"Power","tg":"Quad","eq":"Box","sp":"Fast","sc":"Main","sr":"4x5","rs":"120s","it":"체중","pt":"팔 스윙 활용, 소프트 착지, 스텝다운","v":"https://youtube.com/shorts/7EfeTsHZ5vk?si=sU76QMuXlTG2LYzI"},{"id":"PW-005","n":"드롭 점프","ne":"Drop Jump","p":"Plyo","t":"SSC","tg":"Calf","eq":"Box","sp":"Fast","sc":"Main","sr":"3x5","rs":"120s","it":"체중","pt":"접지 시간 최소화, 착지 즉시 점프","v":"https://youtube.com/shorts/gpXV2dzZ-oA?si=hpocRDzjgIBH35TH"},{"id":"PW-006","n":"메디신볼 체스트패스","ne":"Med Ball Chest Pass","p":"Push","t":"Power","tg":"Chest","eq":"MedBall","sp":"Fast","sc":"Main","sr":"3x8","rs":"90s","it":"3-5kg","pt":"최대 속도 릴리즈, 팔꿈치 완전 신전","v":"https://youtube.com/shorts/X07VbltBxg8?si=I-hsbGH5eBlPP2Vw"},{"id":"PW-007","n":"메디신볼 오버헤드 스로우","ne":"Med Ball OH Throw","p":"Push","t":"Power","tg":"Shoulder","eq":"MedBall","sp":"Fast","sc":"Main","sr":"3x8","rs":"90s","it":"3-5kg","pt":"전신 연동, 힙 익스텐션 시작","v":"https://youtube.com/shorts/NktkzTpq1Lo?si=jUXZUiy5ApjO2YkZ"},{"id":"PW-008","n":"메디신볼 로테이셔널 스로우","ne":"Med Ball Rotational Throw","p":"Rotation","t":"Power","tg":"Core","eq":"MedBall","sp":"Fast","sc":"Main","sr":"3x6 each","rs":"90s","it":"3-5kg","pt":"하체→코어→상체, 벽에 최대 속도","v":"https://youtube.com/shorts/02c2YLgF8iE?si=xCwa5suSfke6UYHL"},{"id":"PW-009","n":"메디신볼 시티트 오버헤드 스로우","ne":"Med Ball Steaded OH Throw","p":"Push","t":"Power","tg":"Core","eq":"MedBall","sp":"Fast","sc":"Main","sr":"3x6","rs":"90s","it":"4-6kg","pt":"힙 힌지→폭발적 신전","v":"https://youtube.com/shorts/0nEg-Hr8WAw?si=9FyaAJ1cOpHuJP9Q"},{"id":"PW-010","n":"덤벨 푸시프레스","ne":"DB Push Press","p":"Push","t":"Power","tg":"Shoulder","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x5","rs":"120s","it":"70-80%","pt":"딥 후 폭발적 드라이브, 록아웃","v":"https://youtube.com/shorts/EYOumY8pY2U?si=BgS9BzWnFtLhNjNB"},{"id":"PW-011","n":"플라이오 푸시업","ne":"Plyo Push-up","p":"Push","t":"Power","tg":"Chest","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x6","rs":"120s","it":"체중","pt":"착지 시 팔꿈치 굽혀 충격 흡수","v":"https://youtube.com/shorts/iO0sT5FDgj4"},{"id":"PW-012","n":"래터럴 바운드","ne":"Lateral Bound","p":"Plyo","t":"Power","tg":"Hip","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x6 each","rs":"90s","it":"체중","pt":"착지 후 1초 스틱, 무릎 정렬","v":"https://youtu.be/soqQy4dzEts?si=zixTgMzGVCEWOeqs"},{"id":"PW-013","n":"싱글레그 래터럴 바운드 & 턱 점프","ne":"Single Leg Lateral Bound & Tuck Jump","p":"Plyo","t":"Power","tg":"Quad","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x5 each","rs":"90s","it":"체중","pt":"무릎 드라이브, 착지 안정성","v":"https://youtube.com/shorts/xyrB--UaRa4?si=josTRA7Y-U5itiGs"},{"id":"PW-014","n":"케틀벨 스윙","ne":"Kettlebell Swing","p":"Hinge","t":"Power","tg":"Glute","eq":"Kettlebell","sp":"Fast","sc":"Main","sr":"4x10","rs":"90s","it":"중량","pt":"힙 힌지, 팔 아닌 힙으로 스윙","v":"https://youtu.be/1cVT3ee9mgU?si=E8ubkPrA7GVjHcMM&t=13"},{"id":"PW-015","n":"바벨 점프 스쿼트","ne":"Barbell Jump Squat","p":"Plyo","t":"Power","tg":"Quad","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x6","rs":"120s","it":"30-40%","pt":"쿼터 깊이 최대 점프, 착지 흡수","v":"https://youtube.com/shorts/8egQqUhWzSU?si=HwaZMQAO4PwCyCrE"},{"id":"PW-016","n":"바벨 하이풀","ne":"Barbell High Pull","p":"Pull","t":"Power","tg":"Full Body","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"90s","it":"빈봉~가볍게","pt":"골반 폭발적 힘, 팔은 보조","v":"https://youtube.com/shorts/er9Rc2S_kLA?si=VVHuRAGjEvyDWYHZ"},{"id":"PW-017","n":"덤벨 회전 파워 드라이브","ne":"DB Rotational Power Drive","p":"Rotation","t":"Power","tg":"Core","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"3x8 each","rs":"60s","it":"자세유지+빠른속도","pt":"회전 시 하체 주도, 코어 연동","v":"https://youtube.com/shorts/mEUVc2bNGNw?si=-9Gx82LvJN-oLJXB"},{"id":"PW-018","n":"바벨 스피드 벤치프레스","ne":"Speed Bench Press","p":"Push","t":"Power","tg":"Chest","eq":"Barbell","sp":"Fast","sc":"Main","sr":"5x4","rs":"60s","it":"1RM 40-55%","pt":"바를 최대한 빠르게 밀기 , 빠르게 3회 = 1회","v":"https://youtube.com/shorts/dnwxEFZYi-Q"},{"id":"PW-019","n":"밴드 덤벨 프레스","ne":"Banded DB Press","p":"Push","t":"Power","tg":"Chest","eq":"Dumbbell, Band","sp":"Fast","sc":"Main","sr":"4x5","rs":"60s","it":"가볍게 빠르게","pt":"하체에 계속 힘주기","v":"https://youtube.com/shorts/d1kUN7DJqeQ"},{"id":"PW-020","n":"덤벨 플로어 프레스 스피드","ne":"DB Floor Press Speed","p":"Push","t":"Power","tg":"Chest","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"5x6","rs":"60s","it":"빠른속도 가능 중량","pt":"바닥을 밀어내듯 폭발적","v":"https://youtube.com/shorts/TvPviMnKg6s"},{"id":"PW-021","n":"싱글암 푸시프레스 하프닐링","ne":"SA Push Press HK","p":"Push","t":"Power","tg":"Shoulder","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x8 each","rs":"60s","it":"자세유지+무겁게","pt":"하프닐링 하체 반동→팔 전달","v":"https://youtube.com/shorts/CNqBJSlu3IY"},{"id":"PW-022","n":"덤벨 인클라인 스피드 프레스","ne":"DB Incline Speed Press","p":"Push","t":"Power","tg":"Chest","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x12","rs":"60s","it":"속도유지 중량","pt":"반동 없이 순수 팔 속도","v":"https://youtube.com/shorts/-IpH1-c50d4"},{"id":"PW-023","n":"덤벨 디클라인 스피드 프레스","ne":"DB Decline Speed Press","p":"Push","t":"Power","tg":"Chest","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"60s","it":"25-35kg","pt":"반동 없이 스피드 집중","v":"https://youtube.com/shorts/EohNba8GraI"},{"id":"PW-024","n":"싱글암 랜드마인 푸시프레스","ne":"SA Landmine Push Press","p":"Push","t":"Power","tg":"Shoulder","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8 each","rs":"60s","it":"5-15kg","pt":"최대 가동 범위 프레스","v":"https://youtube.com/shorts/ewd9eJOmgmM"},{"id":"PW-025","n":"바벨 스내치 그립 점프","ne":"Snatch Grip Jump","p":"Plyo","t":"Power","tg":"Hip","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"120s","it":"체중 15-20%","pt":"빈봉 연습 먼저, 폭발적 점프","v":"https://youtu.be/tHeWiiC_vgw"},{"id":"ST-001","n":"바벨 백스쿼트","ne":"Barbell Back Squat","p":"Squat","t":"Strength","tg":"Quad","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"5x8","rs":"150s","it":"80-90%","pt":"발 전체 접지, 무릎 발끝 방향","v":"https://youtu.be/-bJIpOq-LWk"},{"id":"ST-002","n":"바벨 프론트스쿼트","ne":"Barbell Front Squat","p":"Squat","t":"Strength","tg":"Quad","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x8","rs":"150s","it":"1RM 70%","pt":"팔꿈치 높게, 상체 수직","v":"https://youtube.com/shorts/EVT6Mx_WNBc"},{"id":"ST-003","n":"바벨 데드리프트","ne":"Barbell Deadlift","p":"Hinge","t":"Strength","tg":"Hamstring","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"3x12","rs":"180s","it":"60-70%","pt":"척추 중립, 천천히→빠르게","v":"https://youtu.be/AweC3UaM14o"},{"id":"ST-004","n":"루마니안 데드리프트","ne":"Romanian Deadlift","p":"Hinge","t":"Strength","tg":"Hamstring","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x6","rs":"120s","it":"70-80%","pt":"힙 힌지, 바 몸에 밀착","v":"https://youtu.be/xR6PKlmysOI"},{"id":"ST-005","n":"바벨 벤치프레스","ne":"Barbell Bench Press","p":"Push","t":"Strength","tg":"Chest","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x5","rs":"150s","it":"80-90%","pt":"견갑골 후인하강, 바 직선","v":""},{"id":"ST-006","n":"바벨 오버헤드프레스","ne":"Barbell OHP","p":"Push","t":"Strength","tg":"Shoulder","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x6","rs":"120s","it":"75-85%","pt":"코어 잠금, 바 얼굴 옆","v":""},{"id":"ST-007","n":"풀업 가중","ne":"Weighted Pull-up","p":"Pull","t":"Strength","tg":"Back","eq":"Bodyweight","sp":"Controlled","sc":"Main","sr":"4x5","rs":"120s","it":"체중+추가","pt":"데드행 시작, 견갑골 우선","v":""},{"id":"ST-008","n":"인클라인 덤벨프레스","ne":"Incline DB Press","p":"Push","t":"Strength","tg":"Chest","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x8","rs":"90s","it":"70-80%","pt":"30도 경사, 상부 가슴","v":""},{"id":"ST-009","n":"덤벨 로우","ne":"DB Row","p":"Pull","t":"Strength","tg":"Back","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x8 each","rs":"90s","it":"70-80%","pt":"팔꿈치 골반 쪽, 회전 최소화","v":""},{"id":"ST-010","n":"불가리안 스플릿스쿼트","ne":"Bulgarian Split Squat","p":"Lunge","t":"Strength","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x8 each","rs":"90s","it":"70-80%","pt":"앞발 뒤꿈치, 몸통 수직","v":""},{"id":"ST-011","n":"힙 스러스트","ne":"Hip Thrust","p":"Hinge","t":"Strength","tg":"Glute","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x12","rs":"90s","it":"70-80%","pt":"둔근 최대 수축, 과신전 금지","v":"https://youtu.be/5S8SApGU_Lk"},{"id":"ST-012","n":"바벨 워킹 런지","ne":"Barbell Walking Lunge","p":"Lunge","t":"Strength","tg":"Quad","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"5x8","rs":"90s","it":"60-70%","pt":"보폭 일정, 무릎 90도","v":"https://youtu.be/HSYMPiGycsY"},{"id":"ST-013","n":"랫 풀다운","ne":"Lat Pulldown","p":"Pull","t":"Strength","tg":"Back","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10","rs":"90s","it":"70-80%","pt":"견갑골 하강, 팔꿈치 옆구리","v":""},{"id":"ST-014","n":"시티드 로우","ne":"Seated Cable Row","p":"Pull","t":"Strength","tg":"Back","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10","rs":"90s","it":"70-80%","pt":"흉추 신전, 견갑골 후인","v":""},{"id":"ST-015","n":"덤벨 숄더프레스","ne":"DB Shoulder Press","p":"Push","t":"Strength","tg":"Shoulder","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x8","rs":"90s","it":"70-80%","pt":"팔꿈치 45도, 록아웃","v":""},{"id":"ST-016","n":"싱글암 덤벨 로우","ne":"SA DB Row","p":"Pull","t":"Strength","tg":"Back","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x8 each","rs":"90s","it":"체중 20-30%","pt":"벤치 한 손 지지, 코어 안정","v":"https://youtube.com/shorts/w9TsaN1A_30"},{"id":"ST-017","n":"트랩바 데드리프트","ne":"Trap Bar Deadlift","p":"Hinge","t":"Strength","tg":"Quad","eq":"TrapBar","sp":"Controlled","sc":"Main","sr":"4x5","rs":"150s","it":"85-95%","pt":"무릎 더 굽혀도 OK","v":""},{"id":"ST-018","n":"클로즈그립 벤치프레스","ne":"Close Grip Bench","p":"Push","t":"Strength","tg":"Arm","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x8","rs":"120s","it":"1RM 70%","pt":"어깨너비, 팔꿈치 몸에","v":"https://youtu.be/XEFDMwmrLAM"},{"id":"ST-019","n":"덤벨 스텝업","ne":"DB Step-up","p":"Lunge","t":"Strength","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x8 each","rs":"90s","it":"70-80%","pt":"뒷발 밀지 않기","v":""},{"id":"ST-020","n":"바벨 굿모닝","ne":"Barbell Good Morning","p":"Hinge","t":"Strength","tg":"Hamstring","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x10","rs":"120s","it":"15-20kg","pt":"힙 힌지, 허리 말림 금지","v":"https://youtube.com/shorts/7cpldMZjLOs"},{"id":"ST-021","n":"펜들레이 로우","ne":"Pendlay Row","p":"Pull","t":"Strength","tg":"Back","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"60s","it":"몸무게 70-80%","pt":"가슴 열고 팔꿈치 뒤로","v":"https://youtube.com/shorts/0PSfteHhUtg"},{"id":"ST-022","n":"고릴라 로우","ne":"Gorilla Row","p":"Pull","t":"Strength","tg":"Back","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x12 each","rs":"60s","it":"70-80%","pt":"견갑 먼저, 팔 따라오기","v":"https://youtube.com/shorts/w8BxFfKhuw8"},{"id":"ST-023","n":"바벨 B스탠스 데드리프트","ne":"B-Stance Deadlift","p":"Hinge","t":"Strength","tg":"Glute","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"5x8 each","rs":"90s","it":"70-80%","pt":"앞쪽 다리 바깥 엉덩이","v":"https://youtu.be/GK7aZGipTj0"},{"id":"ST-024","n":"프론트풋 엘리베이티드 스플릿 스쿼트","ne":"FFE Split Squat","p":"Lunge","t":"Strength","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x12 each","rs":"60s","it":"체중 30-40%","pt":"3초 하강, 깊은 ROM","v":"https://youtube.com/shorts/ue44yRNK95o"},{"id":"ST-025","n":"바벨 힙 쓰러스트 pause","ne":"Hip Thrust Pause","p":"Hinge","t":"Strength","tg":"Glute","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"4x12","rs":"90s","it":"체중 2배","pt":"위에서 3초, 바닥 닿으면 안됨","v":"https://youtube.com/shorts/To7hXXuZJ60"},{"id":"HY-001","n":"케이블 체스트플라이","ne":"Cable Chest Fly","p":"Push","t":"Hypertrophy","tg":"Chest","eq":"Cable","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"스트레치 2초 홀드","v":""},{"id":"HY-002","n":"페이스풀","ne":"Face Pull","p":"Pull","t":"Hypertrophy","tg":"Shoulder","eq":"Cable","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"가볍게","pt":"외회전, 후면삼각근 수축","v":"https://youtube.com/shorts/ZBhK5Vzphc4"},{"id":"HY-003","n":"바이셉 컬","ne":"DB Bicep Curl","p":"Pull","t":"Hypertrophy","tg":"Arm","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"상완 고정, 수피네이션","v":""},{"id":"HY-004","n":"트라이셉 푸시다운","ne":"Tricep Pushdown","p":"Push","t":"Hypertrophy","tg":"Arm","eq":"Cable","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"팔꿈치 고정, 완전 신전","v":""},{"id":"HY-005","n":"래터럴 레이즈","ne":"Lateral Raise","p":"Push","t":"Hypertrophy","tg":"Shoulder","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"가볍게","pt":"90도까지만","v":""},{"id":"HY-006","n":"해머 컬","ne":"Hammer Curl","p":"Pull","t":"Hypertrophy","tg":"Arm","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"중립 그립, 상완 고정","v":""},{"id":"HY-007","n":"오버헤드 트라이셉 익스텐션","ne":"OH Tricep Extension","p":"Push","t":"Hypertrophy","tg":"Arm","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"팔꿈치 앞으로, 스트레치","v":""},{"id":"HY-008","n":"인클라인 덤벨 컬","ne":"Incline DB Curl","p":"Pull","t":"Hypertrophy","tg":"Arm","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x10","rs":"60s","it":"60-70%","pt":"45도, 롱헤드 스트레치","v":""},{"id":"HY-009","n":"인클라인 리어델트 로우","ne":"Incline Rear Delt Row","p":"Pull","t":"Hypertrophy","tg":"Shoulder","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"가볍게","pt":"후면어깨+등 연결","v":"https://youtube.com/shorts/qEDZYYPjoB4"},{"id":"HY-010","n":"레그 컬","ne":"Leg Curl","p":"Pull","t":"Hypertrophy","tg":"Hamstring","eq":"Machine","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"엉덩이 안 들리게, 1초 홀드","v":""},{"id":"HY-011","n":"레그 익스텐션","ne":"Leg Extension","p":"Push","t":"Hypertrophy","tg":"Quad","eq":"Machine","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"완전 신전, 천천히 내리기","v":""},{"id":"HY-012","n":"카프 레이즈","ne":"Calf Raise","p":"Push","t":"Hypertrophy","tg":"Calf","eq":"Machine","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"60-70%","pt":"최대 ROM, 2초 홀드","v":""},{"id":"HY-013","n":"레그 프레스","ne":"Leg Press","p":"Squat","t":"Hypertrophy","tg":"Quad","eq":"Machine","sp":"Steady","sc":"Main","sr":"4x10","rs":"90s","it":"70-80%","pt":"풋 포지션으로 타겟 변경","v":""},{"id":"HY-014","n":"덤벨 풀오버","ne":"DB Pullover","p":"Pull","t":"Hypertrophy","tg":"Back","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"60-70%","pt":"랫 스트레치","v":""},{"id":"HY-015","n":"케이블 크런치","ne":"Cable Crunch","p":"Stabilize","t":"Hypertrophy","tg":"Core","eq":"Cable","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"60-70%","pt":"척추 플렉션으로","v":""},{"id":"HY-016","n":"프리쳐 컬","ne":"Preacher Curl","p":"Pull","t":"Hypertrophy","tg":"Arm","eq":"Barbell","sp":"Steady","sc":"Main","sr":"3x10","rs":"60s","it":"60-70%","pt":"상완 밀착, 네거티브 천천히","v":""},{"id":"HY-017","n":"슈러그","ne":"Barbell Shrug","p":"Pull","t":"Hypertrophy","tg":"Shoulder","eq":"Barbell","sp":"Steady","sc":"Main","sr":"3x12","rs":"60s","it":"70-80%","pt":"귀 방향, 롤링 금지","v":""},{"id":"HY-018","n":"슬라이딩 햄스트링 컬","ne":"Sliding Ham Curl","p":"Pull","t":"Hypertrophy","tg":"Hamstring","eq":"Bodyweight","sp":"Steady","sc":"Main","sr":"3x15","rs":"60s","it":"체중","pt":"수건/플레이트 대체 가능","v":"https://youtu.be/e17hjjvQLQQ"},{"id":"HY-019","n":"밴드 푸쉬업","ne":"Banded Push-up","p":"Push","t":"Hypertrophy","tg":"Chest","eq":"Band","sp":"Steady","sc":"Main","sr":"3x20","rs":"60s","it":"밴드 텐션","pt":"가변 저항 추가","v":"https://youtube.com/shorts/RYV6D14cI0s"},{"id":"HY-020","n":"리버스 크런치","ne":"Reverse Crunch","p":"Stabilize","t":"Hypertrophy","tg":"Core","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x20","rs":"60s","it":"체중","pt":"꼬리뼈 들릴 정도로 강하게","v":"https://youtu.be/N5CHqtgiylc"},{"id":"SB-001","n":"팔로프 프레스","ne":"Pallof Press","p":"Stabilize","t":"Stability","tg":"Core","eq":"Cable","sp":"Controlled","sc":"Accessory","sr":"4x12","rs":"60s","it":"가볍게","pt":"코어 회전 저항, 팔 신전","v":"https://youtube.com/shorts/Ar8-f3k70zY"},{"id":"SB-002","n":"데드 버그","ne":"Dead Bug","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x12","rs":"60s","it":"체중","pt":"허리 바닥 밀착, 호흡 연동","v":"https://youtube.com/shorts/VAVrsPX9GHY"},{"id":"SB-003","n":"사이드 플랭크","ne":"Side Plank","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x30s each","rs":"60s","it":"체중","pt":"어깨 아래 팔꿈치, 골반 정렬","v":""},{"id":"SB-004","n":"버드독","ne":"Bird Dog","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x8 each","rs":"60s","it":"체중","pt":"대각선 신전, 골반 레벨","v":""},{"id":"SB-005","n":"터키시 겟업","ne":"Turkish Get-up","p":"Stabilize","t":"Stability","tg":"Full Body","eq":"Kettlebell","sp":"Controlled","sc":"Accessory","sr":"3x3 each","rs":"90s","it":"가볍게","pt":"각 단계 정확히","v":""},{"id":"SB-006","n":"베어 크롤","ne":"Bear Crawl","p":"Carry","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"4x15회","rs":"60s","it":"체중","pt":"무릎 2인치, 골반 안정","v":"https://youtube.com/shorts/l8eRtgP7ZoY"},{"id":"SB-007","n":"싱글레그 글루트 브릿지","ne":"SL Glute Bridge","p":"Hinge","t":"Stability","tg":"Glute","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x10 each","rs":"60s","it":"체중","pt":"골반 레벨 유지","v":"https://youtube.com/shorts/Cpc9qjU8tEY"},{"id":"SB-008","n":"밴드 풀 어파트","ne":"Band Pull-apart","p":"Pull","t":"Stability","tg":"Scapular","eq":"Band","sp":"Controlled","sc":"Accessory","sr":"2x30","rs":"30s","it":"가볍게","pt":"견갑골 후인+하강","v":"https://youtube.com/shorts/SuvO4TBwSu4"},{"id":"SB-009","n":"플랭크 숄더 탭","ne":"Plank Shoulder Tap","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x20","rs":"60s","it":"체중","pt":"골반 흔들림 최소화","v":"https://youtube.com/shorts/VfwCQ14soUo"},{"id":"SB-010","n":"힙 에어플레인","ne":"Hip Airplane","p":"Stabilize","t":"Stability","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"2x8 each","rs":"60s","it":"체중","pt":"싱글레그+고관절 회전","v":"https://youtube.com/shorts/U5f8h7FDEa0"},{"id":"SB-011","n":"싱글암 오버헤드 캐리","ne":"SA OH Carry","p":"Carry","t":"Stability","tg":"Shoulder","eq":"Dumbbell","sp":"Controlled","sc":"Accessory","sr":"4x30s","rs":"60s","it":"코어힘 들어올 정도","pt":"몸 흔들림 없이","v":"https://youtube.com/shorts/5X823MU2ZzQ"},{"id":"SB-012","n":"푸시업 플러스","ne":"Push-up Plus","p":"Push","t":"Stability","tg":"Scapular","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"3x20","rs":"30s","it":"체중","pt":"견갑골 전인 추가","v":"https://youtube.com/shorts/Jpd24buw2IE"},{"id":"SB-013","n":"스캡 풀업","ne":"Scap Pull-up","p":"Pull","t":"Stability","tg":"Scapular","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"3x15","rs":"30s","it":"체중","pt":"팔 안 굽히고 견갑 하강","v":"https://youtube.com/shorts/nw-FIMwCkLs"},{"id":"SB-014","n":"사이드 플랭크 힙 레이즈","ne":"SP Hip Raise","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x20 each","rs":"60s","it":"체중","pt":"엉덩이 바닥 안 닿게","v":"https://youtube.com/shorts/3W2N3X1izC8"},{"id":"SB-015","n":"사이드 플랭크 힙 어브덕션","ne":"SP Hip Abduction","p":"Stabilize","t":"Stability","tg":"Hip","eq":"Band","sp":"Controlled","sc":"Accessory","sr":"2x20 each","rs":"60s","it":"밴드","pt":"사이드 플랭크+힙 어브덕션","v":"https://youtube.com/shorts/Gwlp_wL1wPo"},{"id":"SB-016","n":"코펜하겐 플랭크","ne":"Copenhagen Plank","p":"Stabilize","t":"Stability","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"4x20s","rs":"60s","it":"체중","pt":"내전근 활성","v":"https://youtu.be/aDsaGBnvDQo"},{"id":"SB-017","n":"노르딕 햄스트링","ne":"Nordic Ham Curl","p":"Pull","t":"Stability","tg":"Hamstring","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x6","rs":"90s","it":"체중","pt":"버틸 수 있는 구간까지","v":"https://youtube.com/shorts/GzxNzNRy9T0"},{"id":"SB-018","n":"힙 록 드릴","ne":"Hip Lock Drill","p":"Stabilize","t":"Stability","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x10 each","rs":"60s","it":"체중","pt":"천천히 컨트롤","v":"https://youtu.be/Q6lnkOBUalI"},{"id":"SB-019","n":"데드버그 니 프레스","ne":"Dead Bug Knee Press","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x15 each","rs":"60s","it":"체중","pt":"무릎-손 접촉 강하게","v":"https://youtube.com/shorts/57fLKi3Ip3M"},{"id":"SB-020","n":"싱글 암 데드 행","ne":"SA Dead Hang","p":"Pull","t":"Stability","tg":"Scapular","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x30s each","rs":"30s","it":"체중","pt":"악력+견갑 전체","v":"https://youtube.com/shorts/eyGnaYx7pn4"},{"id":"MB-001","n":"월드 그레이티스트 스트레칭","ne":"World Greatest Stretch","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10 each","rs":"30s","it":"체중","pt":"각 포지션 2초, 흉추 회전","v":"https://youtu.be/-CiWQ2IvY34"},{"id":"MB-002","n":"90/90 힙 스위치","ne":"90/90 Hip Switch","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x12","rs":"30s","it":"체중","pt":"척추 중립, 골반만 회전","v":"https://youtube.com/shorts/9nhhZIpIZ7A"},{"id":"MB-003","n":"스파이더맨 런지 로테이션","ne":"Spiderman Lunge Rot","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10 each","rs":"30s","it":"체중","pt":"딥 런지 흉추 회전","v":"https://youtube.com/shorts/OTpfhOmmXkg"},{"id":"MB-004","n":"힙 CARs","ne":"Hip CARs","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10 each","rs":"30s","it":"체중","pt":"최대 ROM, 골반 고정","v":"https://youtube.com/shorts/7aFRBhdkQwo"},{"id":"MB-005","n":"숄더 CARs","ne":"Shoulder CARs","p":"Mobilize","t":"Mobility","tg":"Shoulder","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x5 each","rs":"30s","it":"체중","pt":"최대 ROM, 보상 없이","v":""},{"id":"MB-006","n":"흉추 로테이션","ne":"Thoracic Open Book","p":"Rotation","t":"Mobility","tg":"Shoulder","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x12 each","rs":"30s","it":"체중","pt":"사이드라잉, 시선 손 따라","v":"https://www.youtube.com/watch?v=peeW19ofFUg"},{"id":"MB-007","n":"코사크 스쿼트","ne":"Cossack Squat","p":"Squat","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x12 each","rs":"30s","it":"체중","pt":"한쪽 완전 신전, 체중 이동","v":"https://youtube.com/shorts/MJvazUpmdZU"},{"id":"MB-008","n":"힙 다이나믹 스트레칭","ne":"Hip Dynamic Stretch","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x6 each","rs":"30s","it":"체중","pt":"동적 고관절 가동범위","v":"https://www.youtube.com/watch?v=tsGPYSQbZx4"},{"id":"MB-009","n":"다이나믹 레그 스윙","ne":"Dynamic Leg Swing","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x15 each","rs":"30s","it":"체중","pt":"전후좌우, 골반 안정","v":"https://youtube.com/shorts/3l31E2cMGMk"},{"id":"MB-010","n":"크로스 런지","ne":"Cross Lunge","p":"Lunge","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"3x12","rs":"30s","it":"체중","pt":"왕복 1회, 내전 스트레치","v":"https://youtube.com/shorts/1Ge2t1-KqeU"},{"id":"MB-011","n":"힙 로테이션 드릴","ne":"Hip Rotation Drill","p":"Mobilize","t":"Mobility","tg":"Hip","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x8 each","rs":"30s","it":"체중","pt":"폼롤러, 고관절 회전","v":"https://youtube.com/shorts/C4MDREc9ERg"},{"id":"MB-012","n":"프레이어 스트레칭","ne":"Prayer Stretch","p":"Mobilize","t":"Mobility","tg":"Back","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10","rs":"30s","it":"체중","pt":"등 바닥 쪽 누르기","v":"https://youtu.be/5aac9TULxrM"},{"id":"MB-013","n":"흉추 캔 오프너","ne":"Thoracic Can Opener","p":"Mobilize","t":"Mobility","tg":"Shoulder","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10","rs":"30s","it":"체중","pt":"흉추 가동성 확보","v":"https://youtube.com/shorts/x_k8RchSpnA"},{"id":"MB-014","n":"밴드 숄더 디스로케이션","ne":"Band Shoulder Dislocate","p":"Mobilize","t":"Mobility","tg":"Shoulder","eq":"Band","sp":"Controlled","sc":"Warmup","sr":"2x10","rs":"30s","it":"가볍게","pt":"넓은 그립, 천천히 넘기기","v":""},{"id":"MB-015","n":"월 앵클 모빌리티","ne":"Wall Ankle Mobility","p":"Mobilize","t":"Mobility","tg":"Calf","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x10 each","rs":"30s","it":"체중","pt":"무릎 벽 터치, 뒤꿈치 안 뜨게","v":""},{"id":"TR-001","n":"케이블 리프트","ne":"Cable Lift","p":"Rotation","t":"Transfer","tg":"Core","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10 each","rs":"60s","it":"60-70%","pt":"저→고, 하체 주도","v":""},{"id":"TR-002","n":"케이블 찹","ne":"Cable Chop","p":"Rotation","t":"Transfer","tg":"Core","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10 each","rs":"60s","it":"60-70%","pt":"고→저, 코어 컨트롤","v":""},{"id":"TR-003","n":"런드마인 프레스","ne":"Landmine Press","p":"Push","t":"Transfer","tg":"Shoulder","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"90s","it":"코어 흔들림 없이","pt":"대각선 빠르게 밀기","v":"https://youtu.be/8xQQnsjzLhs"},{"id":"TR-004","n":"런드마인 로테이션","ne":"Landmine Rotation","p":"Rotation","t":"Transfer","tg":"Core","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"3x8 each","rs":"60s","it":"가볍게","pt":"하체 고정, 상체 회전","v":""},{"id":"TR-005","n":"싱글레그 RDL","ne":"Single Leg RDL","p":"Hinge","t":"Transfer","tg":"Hamstring","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x8 each","rs":"90s","it":"60-70%","pt":"골반 레벨, T자","v":"https://www.youtube.com/watch?v=2SHsk9AzdjA"},{"id":"TR-006","n":"슬레드 푸시","ne":"Sled Push","p":"Push","t":"Transfer","tg":"Quad","eq":"Sled","sp":"Fast","sc":"Main","sr":"4x20m","rs":"90s","it":"무거움","pt":"45도, 발가락 밀기","v":""},{"id":"TR-007","n":"SA 케이블 로우 로테이션","ne":"SA Cable Row Rot","p":"Pull","t":"Transfer","tg":"Back","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10 each","rs":"60s","it":"60-70%","pt":"당기면서 흉추 회전","v":""},{"id":"TR-008","n":"덤벨 스텝업 드라이브","ne":"DB Step-up Drive","p":"Lunge","t":"Transfer","tg":"Quad","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"3x6 each","rs":"60s","it":"70-80%","pt":"앞발로 빠르게","v":"https://youtube.com/shorts/P9gOoqgHpEE"},{"id":"TR-009","n":"데드버그 로우","ne":"Dead Bug Row","p":"Pull","t":"Transfer","tg":"Core","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x10 each","rs":"60s","it":"체중 20-30%","pt":"몸 일직선(매우 중요)","v":"https://youtu.be/zYHZm9_HJsw"},{"id":"TR-010","n":"플로어 데드버그 프레스","ne":"Floor Dead Bug Press","p":"Push","t":"Transfer","tg":"Chest","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x8","rs":"60s","it":"체중 30-50%","pt":"견갑모으기, 코어 힘","v":"https://youtube.com/shorts/JUBxILwr3RU"},{"id":"TR-011","n":"닐링 케이블 로우","ne":"Kneeling Cable Row","p":"Pull","t":"Transfer","tg":"Back","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x12","rs":"60s","it":"체중 20-30%","pt":"닐링 코어+로우","v":"https://youtube.com/shorts/iBC4Xo1SiF0"},{"id":"TR-012","n":"덤벨 푸쉬업 & 로우","ne":"DB Push-up & Row","p":"Pull","t":"Transfer","tg":"Back","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"3x12 each","rs":"60s","it":"체중 15-30%","pt":"푸시업 후 로우, 골반 안정","v":"https://youtube.com/shorts/4E-tCquxn_4"},{"id":"TR-013","n":"바벨 스내치 그립 RDL","ne":"Snatch Grip RDL","p":"Hinge","t":"Transfer","tg":"Hamstring","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"90s","it":"1RM 70-80%","pt":"어깨 두배, 탄성있게","v":"https://youtu.be/5S8dfigc3iE"},{"id":"TR-014","n":"밴드 리시스티드 스프린트","ne":"Band Resisted Sprint","p":"Plyo","t":"Transfer","tg":"Quad","eq":"Band","sp":"Fast","sc":"Main","sr":"4x15m","rs":"120s","it":"체중+밴드","pt":"전경, 폭발적 드라이브","v":""},{"id":"TR-015","n":"하프닐링 케이블 프레스","ne":"HK Cable Press","p":"Push","t":"Transfer","tg":"Chest","eq":"Cable","sp":"Controlled","sc":"Main","sr":"3x10 each","rs":"60s","it":"60-70%","pt":"하프닐링 코어+프레스","v":""},{"id":"SC-001","n":"뎁스 점프","ne":"Depth Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Box","sp":"Fast","sc":"Main","sr":"3x5","rs":"150s","it":"체중","pt":"최소 접지, 즉시 최대 점프","v":""},{"id":"SC-002","n":"허들 점프","ne":"Hurdle Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Hurdle","sp":"Fast","sc":"Main","sr":"3x5","rs":"120s","it":"체중","pt":"연속, 착지 즉시 다음","v":""},{"id":"SC-003","n":"스케이터 점프","ne":"Skater Jump","p":"Plyo","t":"SSC","tg":"Hip","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x6 each","rs":"90s","it":"체중","pt":"측면+빠른 방향 전환","v":""},{"id":"SC-004","n":"앵클 홉","ne":"Ankle Hop Pogo","p":"Plyo","t":"SSC","tg":"Calf","eq":"Bodyweight","sp":"Fast","sc":"Warmup","sr":"2x10","rs":"60s","it":"체중","pt":"발목만, 무릎 최소","v":"https://youtube.com/shorts/xtSq12yoCcE"},{"id":"SC-005","n":"턱 점프","ne":"Tuck Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x6","rs":"120s","it":"체중","pt":"무릎 가슴으로, 소프트 착지","v":""},{"id":"SC-006","n":"싱글레그 박스 점프","ne":"SL Box Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Box","sp":"Fast","sc":"Main","sr":"4x5 each","rs":"120s","it":"체중","pt":"한발→안정 착지","v":"https://youtube.com/shorts/XAI71pCogF4"},{"id":"SC-007","n":"덤벨 싱글레그 박스 점프","ne":"DB SL Box Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"2x8 each","rs":"120s","it":"5-7kg","pt":"한발→안정 착지","v":"https://youtu.be/4iSbq47jBO0"},{"id":"SC-008","n":"플레이트 스케이터 점프","ne":"Plate Skater Jump","p":"Plyo","t":"SSC","tg":"Hip","eq":"Plate","sp":"Fast","sc":"Main","sr":"3x10","rs":"90s","it":"10-20kg","pt":"좌우 전환, 착지 컨트롤","v":"https://youtube.com/shorts/EhUF40vtegk"},{"id":"SC-009","n":"스플릿 점프","ne":"Split Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x8 each","rs":"75s","it":"체중","pt":"착지 즉시 폭발적 점프","v":"https://youtu.be/nN-fkSOL1ds"},{"id":"SC-010","n":"클랩 푸시업","ne":"Clap Push-up","p":"Push","t":"SSC","tg":"Chest","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"3x5","rs":"120s","it":"체중","pt":"최대 높이, 착지 흡수","v":""},{"id":"SC-011","n":"브로드 점프","ne":"Broad Jump Stick","p":"Plyo","t":"SSC","tg":"Quad","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"4x8","rs":"90s","it":"체중","pt":"뒷꿈치 들기, 무릎 평행","v":"https://youtube.com/shorts/Ja89wctAKdA"},{"id":"SC-012","n":"덤벨 스플릿 점프 스텝스루","ne":"DB Split Jump Step","p":"Plyo","t":"SSC","tg":"Quad","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x6 each","rs":"90s","it":"체중 15-30%","pt":"끊어서, 자세+빠른 점프","v":"https://youtube.com/shorts/l3zpYh46GBg"},{"id":"SC-013","n":"AEL 스쿼트 점프","ne":"AEL Squat Jump","p":"Plyo","t":"SSC","tg":"Quad","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x6 each","rs":"90s","it":"체중 20-30%","pt":"빠르게 내려갔다 올라가기","v":"https://youtu.be/04AlONx9bTM"},{"id":"SC-014","n":"닐링 점프","ne":"Kneeling Jump","p":"Plyo","t":"SSC","tg":"Hip","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"2x12","rs":"90s","it":"체중","pt":"폭발적 힙 익스텐션","v":"https://youtube.com/shorts/NICozKyEVjY"},{"id":"SC-015","n":"플라이오 스텝업","ne":"Plyo Step-up","p":"Plyo","t":"SSC","tg":"Quad","eq":"Box","sp":"Fast","sc":"Main","sr":"3x5 each","rs":"90s","it":"체중","pt":"다리 교대, 폭발적","v":""},{"id":"WU-001","n":"밴드 외회전+프레스","ne":"Band ER + Press","p":"Stabilize","t":"Warmup","tg":"Shoulder","eq":"Band","sp":"Controlled","sc":"Warmup","sr":"2x20","rs":"30s","it":"아주 가볍게","pt":"아주 천천히","v":"https://youtube.com/shorts/8WvS3wUPMk8"},{"id":"WU-002","n":"밴드 어깨 활성화","ne":"Band Shoulder Act","p":"Stabilize","t":"Warmup","tg":"Shoulder","eq":"Band","sp":"Controlled","sc":"Warmup","sr":"2x12 each","rs":"30s","it":"가볍게","pt":"각도별 활성화","v":"https://youtube.com/shorts/MDHUJR86A8I"},{"id":"WU-003","n":"암 스윙 드릴","ne":"Arm Swing Drill","p":"Mobilize","t":"Warmup","tg":"Shoulder","eq":"Bodyweight","sp":"Fast","sc":"Warmup","sr":"2x10s","rs":"30s","it":"체중","pt":"상체 회전 연동","v":"https://youtube.com/shorts/ZeLS3ASvMDU"},{"id":"WU-004","n":"하프닐링 코어 브레이싱","ne":"HK Core Bracing","p":"Stabilize","t":"Warmup","tg":"Core","eq":"Band","sp":"Controlled","sc":"Warmup","sr":"2x30s","rs":"30s","it":"체중","pt":"코어 단단히","v":"https://youtube.com/shorts/WziXrwOt6eQ"},{"id":"WU-005","n":"스캡션 레이즈","ne":"Scaption Raise","p":"Push","t":"Warmup","tg":"Shoulder","eq":"Dumbbell","sp":"Controlled","sc":"Warmup","sr":"5x20","rs":"30s","it":"아주 가볍게","pt":"견갑면 들어올리기","v":"https://youtube.com/shorts/TPXDhl9kTuI"},{"id":"WU-006","n":"프론 Y 레이즈","ne":"Prone Y Raise","p":"Pull","t":"Warmup","tg":"Shoulder","eq":"Dumbbell","sp":"Controlled","sc":"Warmup","sr":"4x15","rs":"30s","it":"아주 가볍게","pt":"엎드려 Y자","v":"https://youtube.com/shorts/qLN4BoglYv4"},{"id":"WU-007","n":"프론 스위머","ne":"Prone Swimmer","p":"Mobilize","t":"Warmup","tg":"Back","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x15","rs":"30s","it":"체중","pt":"엎드려 팔 원","v":"https://youtube.com/shorts/NrHBXIV4nls"},{"id":"WU-008","n":"프론 스노우 엔젤","ne":"Prone Snow Angel","p":"Mobilize","t":"Warmup","tg":"Back","eq":"Bodyweight","sp":"Controlled","sc":"Warmup","sr":"2x12","rs":"30s","it":"체중","pt":"엎드려 눈천사","v":"https://youtu.be/vSou6Vup5W8"},{"id":"WU-009","n":"힙 힌지 드릴","ne":"DB Hip Hinge Drill","p":"Hinge","t":"Warmup","tg":"Glute","eq":"Dumbbell","sp":"Controlled","sc":"Warmup","sr":"2x8","rs":"30s","it":"자극 느낄 정도","pt":"힙 힌지 활성화","v":"https://youtube.com/shorts/5qhy8-pX8Yw"},{"id":"WU-010","n":"고블릿 스쿼트 모빌리티","ne":"Goblet Squat Mob","p":"Squat","t":"Warmup","tg":"Hip","eq":"Dumbbell","sp":"Controlled","sc":"Warmup","sr":"2x20s","rs":"30s","it":"가볍게","pt":"좌우 체중 이동","v":"https://youtube.com/shorts/WJTQr5IZUgk"},{"id":"AD-001","n":"B 스탠스 힙 쓰러스트","ne":"B-Stance Hip Thrust","p":"Hinge","t":"Strength","tg":"Glute","eq":"Barbell","sp":"Controlled","sc":"Main","sr":"3x10","rs":"90s","it":"체중 이상","pt":"두 발 모두 힘쓰기","v":"https://youtube.com/shorts/3PL47HwfJ6k"},{"id":"AD-002","n":"덤벨 런지 드라이브","ne":"DB Lunge Drive","p":"Lunge","t":"Power","tg":"Quad","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"3x12","rs":"60s","it":"70-80%","pt":"하체→무릎 들기","v":"https://youtube.com/shorts/6vcsnby-RKg"},{"id":"AD-003","n":"덤벨 파워 로우","ne":"DB Power Row","p":"Pull","t":"Power","tg":"Back","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"3x8","rs":"60s","it":"8회 가능 무게","pt":"빠르게 당기기, 버티기","v":"https://youtube.com/shorts/w9TsaN1A_30"},{"id":"AD-004","n":"덤벨 클린 하이풀","ne":"DB Clean High Pull","p":"Pull","t":"Power","tg":"Full Body","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x8","rs":"60s","it":"중간무게","pt":"팔꿈치 위로 집중","v":"https://youtube.com/shorts/kPxws4dzhi0"},{"id":"AD-005","n":"인버티드 로우","ne":"Inverted Row","p":"Pull","t":"Strength","tg":"Back","eq":"Bodyweight","sp":"Controlled","sc":"Main","sr":"3x12","rs":"60s","it":"체중","pt":"견갑 수축","v":"https://youtube.com/shorts/vZy_Eu_Z0WA"},{"id":"AD-006","n":"와이드 마운틴 클라이머","ne":"Wide Mt Climber","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Fast","sc":"Accessory","sr":"4x20s","rs":"60s","it":"체중","pt":"넓은 보폭, 코어","v":"https://youtu.be/g4p-lCnfdNU"},{"id":"AD-007","n":"덤벨 워킹 런지","ne":"DB Walking Lunge","p":"Lunge","t":"Strength","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x20걸음","rs":"60s","it":"70-80%","pt":"보폭 일정, 상체 직립","v":"https://youtube.com/shorts/_VijHJe9-UU"},{"id":"AD-008","n":"싱글레그 스텝다운","ne":"SL Step-down","p":"Lunge","t":"Stability","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Accessory","sr":"3x12 each","rs":"60s","it":"무게 추가","pt":"천천히, 무릎 정렬","v":"https://youtube.com/shorts/IQIUv3f-qmc"},{"id":"AD-009","n":"덤벨 더블 스내치","ne":"DB Double Snatch","p":"Hinge","t":"Power","tg":"Full Body","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"4x12","rs":"60s","it":"15kg+","pt":"폭발적 힙→오버헤드","v":"https://youtube.com/shorts/Mw3n2HiB89k"},{"id":"AD-010","n":"덤벨 클린","ne":"DB Clean","p":"Hinge","t":"Power","tg":"Full Body","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"5x8","rs":"90s","it":"체중 20-30%","pt":"힙 드라이브 클린","v":"https://youtu.be/uCeNCZFk34c"},{"id":"AD-011","n":"세라토스 월 슬라이드","ne":"Serratus Wall Slide","p":"Stabilize","t":"Stability","tg":"Scapular","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"4x15","rs":"30s","it":"체중","pt":"벽에 팔, 견갑 전인","v":"https://youtube.com/shorts/IMRigdBilBg"},{"id":"AD-012","n":"월 드릴 스위치","ne":"Wall Drill Switch","p":"Plyo","t":"Power","tg":"Quad","eq":"Bodyweight","sp":"Fast","sc":"Main","sr":"4x8 왕복","rs":"60s","it":"체중","pt":"일직선, 뒷꿈치 들기","v":"https://youtube.com/shorts/0okNjOq6AB4"},{"id":"AD-013","n":"덤벨 클린 & 프레스","ne":"DB Clean & Press","p":"Hinge","t":"Power","tg":"Full Body","eq":"Dumbbell","sp":"Fast","sc":"Main","sr":"3x12","rs":"60s","it":"코어힘 들어갈 정도","pt":"클린→빠르게 프레스","v":"https://youtube.com/shorts/HGYMvywau_0"},{"id":"AD-014","n":"스위밍 크런치","ne":"Swimming Crunch","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"4x15 each","rs":"60s","it":"체중","pt":"대각선 교차, 코어","v":"https://youtube.com/shorts/vJAqL3WFWs0"},{"id":"AD-015","n":"덤벨 레터럴 런지","ne":"DB Lateral Lunge","p":"Lunge","t":"Strength","tg":"Hip","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x10 each","rs":"60s","it":"15-20kg","pt":"발목-무릎-엉덩이 일직선","v":"https://youtube.com/shorts/0QT37ft-q20"},{"id":"AD-016","n":"바벨 푸시 프레스","ne":"Barbell Push Press","p":"Push","t":"Power","tg":"Shoulder","eq":"Barbell","sp":"Fast","sc":"Main","sr":"4x(10/8/6/5)","rs":"90s","it":"피라미드","pt":"무게↑ 갯수↓","v":"https://youtube.com/shorts/Z3oL-wZmDIM"},{"id":"AD-017","n":"싱글암 덤벨 프레스","ne":"SA DB Press","p":"Push","t":"Strength","tg":"Chest","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x8 each","rs":"60s","it":"체중 20-30%","pt":"한쪽+코어 안정","v":"https://youtube.com/shorts/Cs2uNF-jW5s"},{"id":"AD-018","n":"싱글암 숄더프레스 런지","ne":"SA SP Lunge Stance","p":"Push","t":"Strength","tg":"Shoulder","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"2x10","rs":"60s","it":"체중 15-30%","pt":"런지 코어 활성","v":"https://youtube.com/shorts/Roe_glAcAN8"},{"id":"AD-019","n":"래터럴 스텝다운","ne":"Lateral Step-down","p":"Lunge","t":"Stability","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Accessory","sr":"3x12 each","rs":"60s","it":"20-25kg","pt":"정강이-무릎, 천천히","v":"https://youtu.be/l7mXgw_NtkQ"},{"id":"AD-020","n":"사이드 플랭크 오블리크 크런치","ne":"SP Oblique Crunch","p":"Stabilize","t":"Stability","tg":"Core","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x15 each","rs":"60s","it":"체중","pt":"사이드+크런치","v":"https://youtube.com/shorts/rDcXbcYee4w"},{"id":"AD-021","n":"싱글레그 카프레이즈","ne":"SL Calf Raise","p":"Push","t":"Hypertrophy","tg":"Calf","eq":"Plate","sp":"Controlled","sc":"Main","sr":"4x15 each","rs":"60s","it":"체중 30-50%","pt":"최대 ROM, 3초 홀드","v":"https://youtube.com/shorts/h0A83mYi1sA"},{"id":"AD-022","n":"하프닐링 로테이션","ne":"HK Rotation Plate","p":"Rotation","t":"Mobility","tg":"Core","eq":"Plate","sp":"Controlled","sc":"Warmup","sr":"2x12 each","rs":"30s","it":"가볍게","pt":"하프닐링 흉추 회전","v":"https://youtube.com/shorts/y4X2RE403eQ"},{"id":"AD-023","n":"덤벨 스플릿 스쿼트","ne":"DB Split Squat","p":"Lunge","t":"Strength","tg":"Quad","eq":"Dumbbell","sp":"Controlled","sc":"Main","sr":"4x10 each","rs":"60s","it":"양손합 체중45-55%","pt":"앞발 중심, 허리 펴기","v":"https://youtube.com/shorts/_HukgYk7lTw"},{"id":"AD-024","n":"싱글레그 햄스트링 브릿지","ne":"SL Ham Bridge","p":"Hinge","t":"Stability","tg":"Hamstring","eq":"Bodyweight","sp":"Controlled","sc":"Accessory","sr":"3x10 each","rs":"60s","it":"체중","pt":"싱글레그 햄스트링","v":"https://youtube.com/shorts/Cpc9qjU8tEY"},{"id":"AD-025","n":"덤벨 카프레이즈","ne":"DB Calf Raise","p":"Push","t":"Hypertrophy","tg":"Calf","eq":"Dumbbell","sp":"Steady","sc":"Main","sr":"3x20 each","rs":"30s","it":"체중 50%","pt":"양쪽 번갈아, 최대 ROM","v":"https://youtube.com/shorts/Bfl5du8ehao"}];
const LIBRARY = RAW_LIB.map(r => ({
  id:r.id, name:r.n, nameEn:r.ne, pattern:r.p, type:r.t, target:r.tg,
  equipment:r.eq, speed:r.sp, section:r.sc, setsReps:r.sr, rest:r.rs,
  intensity:r.it, point:r.pt, video:r.v
}));

// ─── RESPONSIVE HOOK ───
function useWindowSize() {
  const [size, setSize] = useState({w:window.innerWidth, h:window.innerHeight});
  useEffect(() => {
    const handle = () => setSize({w:window.innerWidth, h:window.innerHeight});
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return size;
}

// ─── THEME ───
const C = {
  bg:"#F5F6F8", bgCard:"#FFFFFF", bgInput:"#F0F2F5", bgHover:"#E8EBF0",
  border:"#DDE1E8",
  brand:"#1E3A5F", brandLight:"#2D5A8C", brandDark:"#132840",
  accent:"#E8A838", accentSoft:"#FFF4E0",
  text:"#1A2030", textMuted:"#5A6878", textDim:"#8A96A4",
  success:"#22A858", warning:"#E8A020", danger:"#D94040",
  white:"#FFFFFF",
};
const TC = {Power:"#D94040",Strength:"#22A858",Hypertrophy:"#2D7DD2",SSC:"#D07020",Stability:"#18A090",Mobility:"#C8A020",Transfer:"#7B5EA7",Warmup:"#5090C0"};
const ALL_EQUIP = ["Barbell","Dumbbell","Cable","Band","Machine","Bodyweight","MedBall","Kettlebell","Box","TrapBar","Plate","Sled","Hurdle"];

const DAY_CONCEPTS = [
  {id:"lower-power",label:"월 — 하체/파워",warmupTargets:["Hip","Glute","Calf","Quad"],mainTargets:["Quad","Hamstring","Glute","Hip","Calf","Full Body"],mainTypes:["Power","SSC"],mainPatterns:[]},
  {id:"upper-push",label:"화 — 상체/Push",warmupTargets:["Shoulder","Scapular","Chest"],mainTargets:["Chest","Shoulder","Arm","Core"],mainTypes:[],mainPatterns:["Push","Rotation"]},
  {id:"lower-hyp",label:"목 — 하체/근비대",warmupTargets:["Hip","Glute","Calf","Quad"],mainTargets:["Quad","Hamstring","Glute","Hip","Calf"],mainTypes:["Strength","Hypertrophy"],mainPatterns:[]},
  {id:"upper-pull",label:"금 — 상체/Pull",warmupTargets:["Shoulder","Scapular","Back"],mainTargets:["Back","Shoulder","Arm","Core","Scapular"],mainTypes:[],mainPatterns:["Pull","Rotation"]},
];
const WEEK_OPTIONS = [
  {value:1, label:"W1 — 고볼륨/저강도 (3-4set × 8-12rep)"},
  {value:2, label:"W2 — 중간 (3-4set × 6-10rep)"},
  {value:3, label:"W3 — 저볼륨/고강도 (4-5set × 3-6rep)"},
  {value:4, label:"W4 — Deload (2-3set × 8-10rep, 강도 60%)"},
];
const WEEK_MATRIX = {
  1:{main:[{type:"Hypertrophy",count:3},{type:"Strength",count:1},{type:"Power",count:1}],label:"W1 고볼륨/저강도"},
  2:{main:[{type:"Hypertrophy",count:2},{type:"Strength",count:2},{type:"Power",count:1}],label:"W2 중간"},
  3:{main:[{type:"Power",count:2},{type:"Strength",count:2},{type:"Hypertrophy",count:1}],label:"W3 저볼륨/고강도"},
  4:{main:[{type:"Hypertrophy",count:2},{type:"Strength",count:2},{type:"Power",count:1}],label:"W4 Deload"},
};
const getUpperTypes = (wk, cid) => {
  if (cid!=="upper-push"&&cid!=="upper-pull") return null;
  if (wk===4) return null;
  return wk%2===1?["Power"]:["Hypertrophy"];
};

// ─── ENGINE ───
function recommend(concept, weekNum, athleteEquip, lastExIds=[], counts={warmup:3,main:5,accessory:3}) {
  const eqS = new Set(athleteEquip);
  const hasEq = (ex) => ex.equipment.split(",").map(s=>s.trim()).every(e=>eqS.has(e));
  const mAny = (val, t) => val.split(",").map(s=>s.trim()).some(v=>t.includes(v));
  const wuP = LIBRARY.filter(e=>e.section==="Warmup"&&mAny(e.target,concept.warmupTargets)&&hasEq(e)).sort(()=>Math.random()-0.5);
  const mnP = LIBRARY.filter(e=>e.section==="Main"&&mAny(e.target,concept.mainTargets)&&hasEq(e)).map(e=>{
    let sc=0; const ut=getUpperTypes(weekNum,concept.id); const et=concept.mainTypes.length>0?concept.mainTypes:(ut||[]);
    if(et.length>0&&et.includes(e.type)) sc+=20; if(concept.mainPatterns.length>0&&mAny(e.pattern,concept.mainPatterns)) sc+=20;
    if(lastExIds.includes(e.id)) sc-=30; sc+=Math.random()*10; return{...e,_sc:sc};
  }).sort((a,b)=>b._sc-a._sc);
  const acP = LIBRARY.filter(e=>e.section==="Accessory"&&hasEq(e)).sort(()=>Math.random()-0.5);
  const wm=WEEK_MATRIX[weekNum]||WEEK_MATRIX[1]; let mSel=[]; const used=new Set();
  wm.main.forEach(sl=>{let n=sl.count; for(const ex of mnP){if(n<=0)break;if(used.has(ex.id))continue;if(ex.type===sl.type){mSel.push(ex);used.add(ex.id);n--;}} if(n>0)for(const ex of mnP){if(n<=0)break;if(used.has(ex.id))continue;mSel.push(ex);used.add(ex.id);n--;}});
  const tO={Power:0,SSC:0,Strength:1,Transfer:1,Hypertrophy:2}; mSel.sort((a,b)=>(tO[a.type]??1)-(tO[b.type]??1));
  const toE=(e)=>({id:e.id,name:e.name,nameEn:e.nameEn||"",type:e.type,pattern:e.pattern,target:e.target,equipment:e.equipment,speed:e.speed,sets:(e.setsReps||"3x10").split("x")[0]||"3",reps:(e.setsReps||"3x10").replace(/^[^x]*x/,"")||"10",rest:e.rest||"60s",intensity:e.intensity||"",point:e.point||"",video:e.video||""});
  return{warmup:wuP.slice(0,counts.warmup).map(toE),main:mSel.slice(0,counts.main).map(toE),accessory:acP.slice(0,counts.accessory).map(toE)};
}

function toKakao(ss,name,dayLabel,wk,date){
  let t=`📋 ${name} — ${date}\n${dayLabel} | Week ${wk}\n${"━".repeat(24)}\n\n`;
  const sec=(l,em,arr)=>{t+=`${em} ${l}\n\n`;arr.forEach((e,i)=>{t+=`${i+1}. ${e.name}${e.nameEn?` (${e.nameEn})`:""}`+"\n";t+=`   ${e.sets}x${e.reps} | 휴식 ${e.rest} | 강도: ${e.intensity}\n`;if(e.point)t+=`   📌 ${e.point}\n`;if(e.video)t+=`   🎬 ${e.video}\n`;t+="\n";});};
  sec("Warm-up","🔥",ss.warmup);sec("Main Training","💪",ss.main);sec("Accessory","🛡️",ss.accessory);return t;
}

function nextAthleteId(athletes){const nums=athletes.map(a=>{const m=a.id.match(/PD(\d+)/);return m?parseInt(m[1]):0;});return`PD${String((nums.length?Math.max(...nums):0)+1).padStart(4,"0")}`;}

// ─── RESPONSIVE CHART ───
const MiniChart = ({data,dates,color,label,max=10,invert=false}) => {
  const ref = useRef(null);
  const [cw, setCw] = useState(300);
  useEffect(()=>{
    if(!ref.current) return;
    const ro = new ResizeObserver(entries=>{for(const e of entries) setCw(e.contentRect.width);});
    ro.observe(ref.current); return ()=>ro.disconnect();
  },[]);
  if(!data||data.length<2) return <div style={{fontSize:11,color:C.textDim,padding:8}}>데이터 2개 이상 필요</div>;
  const w=Math.max(cw,200), h=90, pad=28, padR=12, padB=22;
  const plotW=w-pad-padR, plotH=h-pad-padB;
  const pw=plotW/Math.max(data.length-1,1);
  const pts=data.map((v,i)=>{const r=invert?(v/max):(1-v/max);return{x:pad+i*pw,y:pad/2+plotH*r,v};});
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD=pathD+` L${pts[pts.length-1].x.toFixed(1)},${pad/2+plotH} L${pts[0].x.toFixed(1)},${pad/2+plotH} Z`;
  const uid="c"+Math.random().toString(36).slice(2,8);
  return(
    <div ref={ref} style={{marginBottom:10,width:"100%"}}>
      <div style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:4}}>{label}</div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{background:C.bgInput,borderRadius:8,display:"block"}}>
        <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient></defs>
        {[0,max/2,max].map(v=>{const r=invert?(v/max):(1-v/max);const y=pad/2+plotH*r;return<g key={v}><line x1={pad} y1={y} x2={w-padR} y2={y} stroke={C.border} strokeWidth="0.5"/><text x={pad-5} y={y+3} fill={C.textDim} fontSize="8" textAnchor="end">{v}</text></g>;})}
        <path d={areaD} fill={`url(#${uid})`}/><path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill={C.white} stroke={color} strokeWidth="2"/>)}
        {dates&&dates.map((d,i)=>pts[i]?<text key={`d${i}`} x={pts[i].x} y={h-4} fill={C.textDim} fontSize="8" textAnchor="middle">{d}</text>:null)}
      </svg>
    </div>
  );
};

// ─── APP ───
export default function App(){
  const {w:winW} = useWindowSize();
  const isMobile = winW < 768;
  const isTablet = winW >= 768 && winW < 1024;

  const [page,setPage]=useState("session");
  const [menuOpen,setMenuOpen]=useState(false);
  const [athletes,setAthletes]=useState([]);
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [loadingAthletes,setLoadingAthletes]=useState(true);
  const showSave=(msg)=>{setSaveMsg(msg);setTimeout(()=>setSaveMsg(""),2500);};

  // ─── Google Sheets에서 선수 목록 로드 ───
  useEffect(()=>{
    setLoadingAthletes(true);
    readSheets('getAthletes')
      .then(data=>{
        const mapped=(data.data||[]).map(a=>({
          id:a.athleteCode, name:a.name, sport:a.sport, position:a.position,
          team:a.team||"", height:String(a.height||""), weight:String(a.weight||""),
          age:String(a.age||""), memo:a.memo||"", equipment:a.equipment||[]
        }));
        setAthletes(mapped);
        if(mapped.length>0) setCfg(c=>({...c,athleteId:mapped[0].id}));
      })
      .catch(err=>console.error('선수 로드 실패:',err))
      .finally(()=>setLoadingAthletes(false));
  },[]);

  // ─── Google Sheets에서 세션 기록 로드 ───
  useEffect(()=>{
    readSheets('getSessions')
      .then(data=>{
        const mapped=(data.data||[]).map(s=>({
          id:s.sessionId, athleteId:s.athleteCode, athleteName:s.athleteName,
          athleteSport:"", athletePosition:"",
          concept:s.dayConcept, weekNum:parseInt(String(s.week).replace(/\D/g,''))||1,
          date:s.date?String(s.date).substring(0,10):"",
          session:{
            warmup:s.exercises.filter(e=>e.section==="Warmup").map(e=>({id:e.exerciseId,name:e.exerciseName,nameEn:"",type:"",pattern:"",target:"",equipment:"",speed:"",sets:String(e.sets||""),reps:String(e.reps||""),rest:"",intensity:String(e.intensity||""),point:"",video:""})),
            main:s.exercises.filter(e=>e.section==="Main").map(e=>({id:e.exerciseId,name:e.exerciseName,nameEn:"",type:"",pattern:"",target:"",equipment:"",speed:"",sets:String(e.sets||""),reps:String(e.reps||""),rest:"",intensity:String(e.intensity||""),point:"",video:""})),
            accessory:s.exercises.filter(e=>e.section==="Accessory").map(e=>({id:e.exerciseId,name:e.exerciseName,nameEn:"",type:"",pattern:"",target:"",equipment:"",speed:"",sets:String(e.sets||""),reps:String(e.reps||""),rest:"",intensity:String(e.intensity||""),point:"",video:""})),
          },
          feedback:s.feedback&&s.feedback.rpe?{q1:Number(s.feedback.rpe)||5,q2:Number(s.feedback.fatigue)||5,q3:Number(s.feedback.speedPerception)||5,q4:Number(s.feedback.recoveryPrediction)||3,q5area:s.feedback.painArea||"",q5vas:Number(s.feedback.painVAS)||0}:null,
        }));
        setHistory(mapped);
      })
      .catch(err=>console.error('세션 로드 실패:',err));
  },[]);
  const [cfg,setCfg]=useState({athleteId:"",conceptId:"lower-power",weekNum:1,date:new Date().toISOString().split("T")[0]});
  const [session,setSession]=useState(null);
  const [kakao,setKakao]=useState("");
  const [copied,setCopied]=useState(false);
  const [counts,setCounts]=useState({warmup:3,main:5,accessory:3});
  const [addPoolSec,setAddPoolSec]=useState(null);
  const [addFilter,setAddFilter]=useState("");
  const [history,setHistory]=useState([]);
  const [feedbackFor,setFeedbackFor]=useState(null);
  const [feedback,setFeedback]=useState({q1:5,q2:5,q3:5,q4:3,q5area:"",q5vas:0});
  const [editAthlete,setEditAthlete]=useState(null);
  const [libFilter,setLibFilter]=useState({search:"",section:"all",type:"all"});
  const [histSearch,setHistSearch]=useState("");
  const [histExpanded,setHistExpanded]=useState(null);
  const [histDetail,setHistDetail]=useState(null);

  const athlete=athletes.find(a=>a.id===cfg.athleteId);
  const concept=DAY_CONCEPTS.find(c=>c.id===cfg.conceptId);
  const getAthlete=(id)=>athletes.find(a=>a.id===id);
  const lastExIds=history.length>0?[...(history[0].session?.warmup||[]),...(history[0].session?.main||[]),...(history[0].session?.accessory||[])].map(e=>e.id):[];

  const s = {
    card:{background:C.bgCard,borderRadius:12,border:`1px solid ${C.border}`,padding:isMobile?14:20,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"},
    inp:{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"},
    sel:{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",cursor:"pointer"},
    btn:(v)=>({padding:isMobile?"8px 14px":"9px 18px",borderRadius:8,border:v==="o"?`1px solid ${C.border}`:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:v==="p"?C.accent:v==="d"?`${C.danger}15`:v==="s"?`${C.success}15`:"transparent",color:v==="p"?C.white:v==="d"?C.danger:v==="s"?C.success:C.brand}),
    tag:(c)=>({display:"inline-block",padding:"2px 9px",borderRadius:12,fontSize:10,fontWeight:600,background:`${c}18`,color:c,marginRight:4}),
    lbl:{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,display:"block",letterSpacing:0.3},
  };

  const generate=useCallback(()=>{
    if(!athlete||!concept)return;
    const ss=recommend(concept,cfg.weekNum,athlete.equipment,lastExIds,counts);
    setSession(ss);setKakao(toKakao(ss,athlete.name||athlete.id,concept.label,cfg.weekNum,cfg.date));setAddPoolSec(null);
  },[cfg,athlete,concept,counts,lastExIds]);
  const updateKakao=(ss)=>{if(athlete&&concept)setKakao(toKakao(ss,athlete.name||athlete.id,concept.label,cfg.weekNum,cfg.date));};

  const swapEx=(sec,idx)=>{if(!session||!athlete)return;const curIds=new Set([...session.warmup,...session.main,...session.accessory].map(x=>x.id));const secMap={warmup:"Warmup",main:"Main",accessory:"Accessory"};const eqSet=new Set(athlete.equipment);const pool=LIBRARY.filter(e=>e.section===secMap[sec]&&!curIds.has(e.id)&&e.equipment.split(",").map(s=>s.trim()).every(eq=>eqSet.has(eq)));if(!pool.length)return;const pick=pool[Math.floor(Math.random()*pool.length)];const cp=JSON.parse(JSON.stringify(session));cp[sec][idx]={id:pick.id,name:pick.name,nameEn:pick.nameEn||"",type:pick.type,pattern:pick.pattern,target:pick.target,equipment:pick.equipment,speed:pick.speed,sets:(pick.setsReps||"3x10").split("x")[0]||"3",reps:(pick.setsReps||"3x10").replace(/^[^x]*x/,"")||"10",rest:pick.rest||"60s",intensity:pick.intensity||"",point:pick.point||"",video:pick.video||""};setSession(cp);updateKakao(cp);};
  const removeEx=(sec,idx)=>{const cp=JSON.parse(JSON.stringify(session));cp[sec].splice(idx,1);setSession(cp);updateKakao(cp);};
  const editField=(sec,idx,f,v)=>{const cp=JSON.parse(JSON.stringify(session));cp[sec][idx][f]=v;setSession(cp);updateKakao(cp);};
  const addEx=(sec,ex)=>{const cp=JSON.parse(JSON.stringify(session));cp[sec].push({id:ex.id,name:ex.name,nameEn:ex.nameEn||"",type:ex.type,pattern:ex.pattern,target:ex.target,equipment:ex.equipment,speed:ex.speed,sets:(ex.setsReps||"3x10").split("x")[0]||"3",reps:(ex.setsReps||"3x10").replace(/^[^x]*x/,"")||"10",rest:ex.rest||"60s",intensity:ex.intensity||"",point:ex.point||"",video:ex.video||""});setSession(cp);updateKakao(cp);setAddPoolSec(null);setAddFilter("");};
  const getAddPool=(sec)=>{const secMap={warmup:"Warmup",main:"Main",accessory:"Accessory"};const curIds=session?new Set([...session.warmup,...session.main,...session.accessory].map(x=>x.id)):new Set();const eqSet=new Set(athlete?.equipment||[]);return LIBRARY.filter(e=>e.section===secMap[sec]&&!curIds.has(e.id)&&e.equipment.split(",").map(s=>s.trim()).every(eq=>eqSet.has(eq)));};
  const saveSession=async()=>{if(!session||!athlete)return;
    setSaving(true);
    const histEntry={id:`S${Date.now()}`,athleteId:athlete.id,athleteName:athlete.name,athleteSport:athlete.sport,athletePosition:athlete.position,concept:concept.label,weekNum:cfg.weekNum,date:cfg.date,session:JSON.parse(JSON.stringify(session)),feedback:null};
    try{
      const result=await callSheets('saveSession',{
        athleteCode:athlete.id, athleteName:athlete.name, date:cfg.date,
        week:'W'+cfg.weekNum, dayConcept:concept.label,
        exercises:[...session.warmup.map(e=>({section:'Warmup',exerciseId:e.id,exerciseName:e.name,sets:e.sets,reps:e.reps,intensity:e.intensity,memo:''})),
          ...session.main.map(e=>({section:'Main',exerciseId:e.id,exerciseName:e.name,sets:e.sets,reps:e.reps,intensity:e.intensity,memo:''})),
          ...session.accessory.map(e=>({section:'Accessory',exerciseId:e.id,exerciseName:e.name,sets:e.sets,reps:e.reps,intensity:e.intensity,memo:''}))],
        feedback:{}
      });
      histEntry.id=result.sessionId||histEntry.id;
      setHistory(h=>[histEntry,...h]);setSession(null);setKakao("");
      showSave("✅ 세션 저장 완료 → Google Sheets");
    }catch(err){alert('세션 저장 실패: '+err.message);}
    finally{setSaving(false);}
  };
  const saveFeedback=async(hid)=>{
    setSaving(true);
    try{
      await callSheets('saveFeedback',{
        sessionId:hid, rpe:feedback.q1, fatigue:feedback.q2,
        speedPerception:feedback.q3, recoveryPrediction:feedback.q4,
        painArea:feedback.q5area, painVAS:feedback.q5vas
      });
      setHistory(h=>h.map(x=>x.id===hid?{...x,feedback:{...feedback}}:x));
      setFeedbackFor(null);setFeedback({q1:5,q2:5,q3:5,q4:3,q5area:"",q5vas:0});
      showSave("✅ 피드백 저장 완료 → Google Sheets");
    }catch(err){alert('피드백 저장 실패: '+err.message);}
    finally{setSaving(false);}
  };
  const saveAthlete=async(a)=>{
    setSaving(true);
    try{
      if(a.id){
        // 수정
        await callSheets('updateAthlete',{
          athleteCode:a.id, name:a.name, sport:a.sport, position:a.position,
          team:a.team, height:a.height, weight:a.weight, age:a.age,
          equipment:a.equipment, memo:a.memo
        });
        setAthletes(p=>{const n=[...p];const i=n.findIndex(x=>x.id===a.id);if(i>=0)n[i]=a;return n;});
        showSave("✅ 선수 수정 완료 → Google Sheets");
      }else{
        // 추가
        const result=await callSheets('addAthlete',{
          name:a.name, sport:a.sport, position:a.position,
          team:a.team, height:a.height, weight:a.weight, age:a.age,
          equipment:a.equipment, memo:a.memo
        });
        const newA={...a,id:result.athleteCode};
        setAthletes(p=>[...p,newA]);
        showSave("✅ 선수 등록 완료: "+result.athleteCode+" → Google Sheets");
      }
      setEditAthlete(null);
    }catch(err){alert('선수 저장 실패: '+err.message);}
    finally{setSaving(false);}
  };
  const copyText=()=>{navigator.clipboard?.writeText(kakao);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const fbCol=(v,th)=>v>=th[1]?C.danger:v>=th[0]?C.warning:C.success;
  const fmtDate=(d)=>{if(!d)return"";const p=d.split("-");return p.length>=3?`${parseInt(p[1])}/${parseInt(p[2])}`:d;};
  const navTo=(p)=>{setPage(p);setHistDetail(null);setMenuOpen(false);};

  // ─── EXERCISE ROW ───
  const ExRow=({ex,sec,idx})=>(
    <div style={{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:10,padding:isMobile?"10px":"11px 14px",marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600}}>{idx+1}. {ex.name}</span><span style={s.tag(TC[ex.type]||"#999")}>{ex.type}</span></div>
          {ex.nameEn&&!isMobile&&<div style={{fontSize:10,color:C.textDim,marginTop:1}}>{ex.nameEn}</div>}
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}><span onClick={()=>swapEx(sec,idx)} style={{cursor:"pointer",fontSize:13,color:C.textMuted}}>🔀</span><span onClick={()=>removeEx(sec,idx)} style={{cursor:"pointer",fontSize:13,color:C.textMuted}}>✕</span></div>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,color:C.textDim}}>세트</span><input style={{...s.inp,width:38,padding:"3px 6px",fontSize:11,textAlign:"center"}} value={ex.sets} onChange={e=>editField(sec,idx,"sets",e.target.value)}/></div>
        <span style={{color:C.textDim,fontSize:11}}>×</span>
        <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,color:C.textDim}}>랩</span><input style={{...s.inp,width:50,padding:"3px 6px",fontSize:11,textAlign:"center"}} value={ex.reps} onChange={e=>editField(sec,idx,"reps",e.target.value)}/></div>
        <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,color:C.textDim}}>휴식</span><input style={{...s.inp,width:48,padding:"3px 6px",fontSize:11,textAlign:"center"}} value={ex.rest} onChange={e=>editField(sec,idx,"rest",e.target.value)}/></div>
        <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,color:C.textDim}}>강도</span><input style={{...s.inp,width:72,padding:"3px 6px",fontSize:11}} value={ex.intensity} onChange={e=>editField(sec,idx,"intensity",e.target.value)}/></div>
        {ex.video&&<a href={ex.video} target="_blank" rel="noreferrer" style={{fontSize:10,color:C.brandLight,textDecoration:"none",fontWeight:600}}>🎬</a>}
      </div>
      {ex.point&&<div style={{fontSize:10,color:C.textDim,marginTop:4}}>📌 {ex.point}</div>}
    </div>
  );

  const SecBlock=({title,emoji,sec,exercises})=>(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:14,fontWeight:700,color:C.brand}}>{emoji} {title} ({exercises.length})</span>
        <span onClick={()=>setAddPoolSec(addPoolSec===sec?null:sec)} style={{...s.btn("o"),fontSize:11,padding:"4px 10px"}}>➕ 추가</span>
      </div>
      {exercises.map((ex,i)=><ExRow key={ex.id+i} ex={ex} sec={sec} idx={i}/>)}
      {addPoolSec===sec&&(
        <div style={{background:C.accentSoft,border:`1px solid ${C.accent}40`,borderRadius:10,padding:12,marginTop:6}}>
          <input style={{...s.inp,marginBottom:8}} placeholder="운동 검색..." value={addFilter} onChange={e=>setAddFilter(e.target.value)}/>
          <div style={{maxHeight:180,overflow:"auto"}}>{getAddPool(sec).filter(e=>!addFilter||e.name.includes(addFilter)||(e.nameEn||"").toLowerCase().includes(addFilter.toLowerCase())).slice(0,12).map(ex=>(
            <div key={ex.id} onClick={()=>addEx(sec,ex)} style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",borderRadius:6,cursor:"pointer",fontSize:12,color:C.text,marginBottom:2}} onMouseEnter={e=>e.currentTarget.style.background=C.bgHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{ex.name} <span style={{color:C.textDim}}>({ex.type})</span></span><span style={{color:C.accent,fontWeight:700}}>+</span>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );

  // Feedback UI helper
  const FbCircles=({field,max,colorFn})=>(
    <div style={{display:"flex",gap:isMobile?3:4,flexWrap:"wrap"}}>{Array.from({length:max},(_, i)=>i+1).map(n=>(
      <span key={n} onClick={()=>setFeedback(f=>({...f,[field]:n}))} style={{width:isMobile?24:26,height:isMobile?24:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,cursor:"pointer",background:feedback[field]===n?colorFn(n):C.bgInput,color:feedback[field]===n?C.white:C.textDim,border:`1px solid ${feedback[field]===n?"transparent":C.border}`}}>{n}</span>
    ))}</div>
  );

  const FeedbackForm=({hid})=>(
    <div style={{background:C.accentSoft,border:`1px solid ${C.accent}40`,borderRadius:10,padding:isMobile?12:16,marginTop:10}}>
      <div style={{fontSize:13,fontWeight:700,color:C.brand,marginBottom:12}}>📝 피드백 수집</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        <div><label style={s.lbl}>Q1. RPE (1~10) — 높을수록 힘듦</label><FbCircles field="q1" max={10} colorFn={n=>fbCol(n,[6,8])}/></div>
        <div><label style={s.lbl}>Q2. 피로도 (1~10) — 높을수록 피곤</label><FbCircles field="q2" max={10} colorFn={n=>fbCol(n,[5,8])}/></div>
        <div><label style={s.lbl}>Q3. 속도지각 (1~10) — 높을수록 빠름</label><FbCircles field="q3" max={10} colorFn={n=>n>=7?C.success:n>=4?C.warning:C.danger}/><div style={{fontSize:9,color:C.textDim,marginTop:2}}>1=매우느림 10=매우빠름</div></div>
        <div><label style={s.lbl}>Q4. 회복예측 (1~5) — 높을수록 어려움</label><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(n=>(<span key={n} onClick={()=>setFeedback(f=>({...f,q4:n}))} style={{width:36,height:26,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,cursor:"pointer",background:feedback.q4===n?fbCol(n,[3,4]):C.bgInput,color:feedback.q4===n?C.white:C.textDim,border:`1px solid ${feedback.q4===n?"transparent":C.border}`}}>{n}</span>))}</div><div style={{fontSize:9,color:C.textDim,marginTop:2}}>1=충분 5=어려움</div></div>
      </div>
      <div style={{marginTop:12}}><label style={s.lbl}>Q5. 통증</label><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
        <div><div style={{fontSize:10,color:C.textDim,marginBottom:4}}>부위</div><input style={s.inp} value={feedback.q5area} onChange={e=>setFeedback(f=>({...f,q5area:e.target.value}))} placeholder="예: 우측 어깨..."/></div>
        <div><div style={{fontSize:10,color:C.textDim,marginBottom:4}}>VAS (0~10)</div><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{[0,1,2,3,4,5,6,7,8,9,10].map(n=>(<span key={n} onClick={()=>setFeedback(f=>({...f,q5vas:n}))} style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,cursor:"pointer",background:feedback.q5vas===n?fbCol(n,[4,7]):C.bgInput,color:feedback.q5vas===n?C.white:C.textDim,border:`1px solid ${feedback.q5vas===n?"transparent":C.border}`}}>{n}</span>))}</div></div>
      </div></div>
      <div style={{display:"flex",gap:8,marginTop:14}}><button style={s.btn("p")} onClick={()=>saveFeedback(hid)}>💾 저장</button><button style={s.btn("o")} onClick={()=>setFeedbackFor(null)}>취소</button></div>
    </div>
  );

  // ═══ PAGES ═══
  const renderSession=()=>(
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:isMobile?18:20,fontWeight:800,margin:0,color:C.brand}}>📋 세션 생성</h2>
        <span style={{fontSize:12,color:C.textMuted,background:C.accentSoft,padding:"4px 12px",borderRadius:20,fontWeight:600}}>{WEEK_MATRIX[cfg.weekNum]?.label}</span>
      </div>
      <div style={s.card}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          <div><label style={s.lbl}>선수</label><select style={s.sel} value={cfg.athleteId} onChange={e=>{setCfg(c=>({...c,athleteId:e.target.value}));setSession(null);setKakao("");}}>
            {athletes.map(a=><option key={a.id} value={a.id}>{a.name} ({a.sport}/{a.position}) — {a.id}</option>)}
          </select></div>
          <div><label style={s.lbl}>요일 컨셉</label><select style={s.sel} value={cfg.conceptId} onChange={e=>setCfg(c=>({...c,conceptId:e.target.value}))}>
            {DAY_CONCEPTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
          </select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:10,marginTop:10}}>
          <div><label style={s.lbl}>Week (주기화)</label><select style={s.sel} value={cfg.weekNum} onChange={e=>setCfg(c=>({...c,weekNum:+e.target.value}))}>
            {WEEK_OPTIONS.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
          </select></div>
          <div><label style={s.lbl}>날짜</label><input type="date" style={s.inp} value={cfg.date} onChange={e=>setCfg(c=>({...c,date:e.target.value}))}/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:5,alignItems:"center",fontSize:12,color:C.textMuted}}>
            <span>WU</span><input style={{...s.inp,width:38,padding:"4px",textAlign:"center",fontSize:12}} type="number" min={0} max={10} value={counts.warmup} onChange={e=>setCounts(c=>({...c,warmup:+e.target.value}))}/>
            <span>Main</span><input style={{...s.inp,width:38,padding:"4px",textAlign:"center",fontSize:12}} type="number" min={0} max={10} value={counts.main} onChange={e=>setCounts(c=>({...c,main:+e.target.value}))}/>
            <span>Acc</span><input style={{...s.inp,width:38,padding:"4px",textAlign:"center",fontSize:12}} type="number" min={0} max={10} value={counts.accessory} onChange={e=>setCounts(c=>({...c,accessory:+e.target.value}))}/>
          </div>
          <button style={s.btn("p")} onClick={generate}>🎯 세션 생성</button>
        </div>
      </div>
      {session&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginTop:16}}>
          <div style={{...s.card,padding:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.brand,marginBottom:14}}>🛠 관리자 뷰 — {athlete?.name}</div>
            <SecBlock title="Warm-up" emoji="🔥" sec="warmup" exercises={session.warmup}/>
            <SecBlock title="Main Training" emoji="💪" sec="main" exercises={session.main}/>
            <SecBlock title="Accessory" emoji="🛡️" sec="accessory" exercises={session.accessory}/>
            <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}><button style={s.btn("s")} onClick={saveSession} disabled={saving}>{saving?"💾 저장 중...":"✅ 승인 & 저장"}</button><button style={s.btn("o")} onClick={generate}>🔄 재생성</button></div>
          </div>
          <div style={{...s.card,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:14,fontWeight:700,color:C.brand}}>📱 선수 전달</span>
              <button style={s.btn(copied?"s":"p")} onClick={copyText}>{copied?"✅ 복사됨":"📋 카톡 복사"}</button>
            </div>
            <textarea style={{background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,padding:14,color:C.text,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:isMobile?300:480,fontFamily:"monospace",lineHeight:1.7,whiteSpace:"pre-wrap"}} value={kakao} onChange={e=>setKakao(e.target.value)}/>
          </div>
        </div>
      )}
    </>
  );

  const renderAthletes=()=>(
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:isMobile?18:20,fontWeight:800,margin:0,color:C.brand}}>👤 선수 관리</h2>
        {!editAthlete&&<button style={s.btn("p")} onClick={()=>setEditAthlete({})}>➕ 새 선수</button>}
      </div>
      {editAthlete!==null&&(
        <div style={s.card}>
          <div style={{fontSize:14,fontWeight:700,color:C.brand,marginBottom:14}}>{editAthlete.id?"✏️ 수정":"➕ 새 선수"}{!editAthlete.id&&<span style={{fontSize:11,color:C.textDim,marginLeft:8}}>ID: {nextAthleteId(athletes)}</span>}</div>
          {(()=>{const [f,setF]=[editAthlete.id?editAthlete:{id:"",name:"",sport:"",position:"",team:"",height:"",weight:"",age:"",memo:"",equipment:["Barbell","Dumbbell","Cable","Band","Bodyweight"]},editAthlete.id?(v)=>setEditAthlete(v):(v)=>setEditAthlete(v)]; return null;})()}
        </div>
      )}
      {editAthlete!==null&&(()=>{
        const FormInner=()=>{
          const [f,setF]=useState(editAthlete.id?{...editAthlete}:{id:"",name:"",sport:"",position:"",team:"",height:"",weight:"",age:"",memo:"",equipment:["Barbell","Dumbbell","Cable","Band","Bodyweight"]});
          return(
            <div style={s.card}>
              <div style={{fontSize:14,fontWeight:700,color:C.brand,marginBottom:14}}>{editAthlete.id?"✏️ 수정":"➕ 새 선수"}{!editAthlete.id&&<span style={{fontSize:11,color:C.textDim,marginLeft:8}}>ID: {nextAthleteId(athletes)}</span>}</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10}}>
                <div><label style={s.lbl}>이름</label><input style={s.inp} value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} placeholder="홍길동"/></div>
                <div><label style={s.lbl}>종목</label><input style={s.inp} value={f.sport} onChange={e=>setF(x=>({...x,sport:e.target.value}))} placeholder="야구"/></div>
                <div><label style={s.lbl}>포지션</label><input style={s.inp} value={f.position} onChange={e=>setF(x=>({...x,position:e.target.value}))} placeholder="투수"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:10,marginTop:10}}>
                <div><label style={s.lbl}>소속팀</label><input style={s.inp} value={f.team} onChange={e=>setF(x=>({...x,team:e.target.value}))}/></div>
                <div><label style={s.lbl}>신장cm</label><input style={s.inp} value={f.height} onChange={e=>setF(x=>({...x,height:e.target.value}))}/></div>
                <div><label style={s.lbl}>체중kg</label><input style={s.inp} value={f.weight} onChange={e=>setF(x=>({...x,weight:e.target.value}))}/></div>
                <div><label style={s.lbl}>나이</label><input style={s.inp} value={f.age} onChange={e=>setF(x=>({...x,age:e.target.value}))}/></div>
              </div>
              <div style={{marginTop:10}}><label style={s.lbl}>메모</label><textarea style={{...s.inp,minHeight:60,resize:"vertical"}} value={f.memo} onChange={e=>setF(x=>({...x,memo:e.target.value}))}/></div>
              <div style={{marginTop:10}}><label style={s.lbl}>장비</label><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}>{ALL_EQUIP.map(eq=>(<span key={eq} onClick={()=>setF(x=>({...x,equipment:x.equipment.includes(eq)?x.equipment.filter(e=>e!==eq):[...x.equipment,eq]}))} style={{padding:"5px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontWeight:500,background:f.equipment.includes(eq)?`${C.success}15`:C.bgInput,color:f.equipment.includes(eq)?C.success:C.textDim,border:`1px solid ${f.equipment.includes(eq)?C.success+"40":C.border}`}}>{f.equipment.includes(eq)?"✓ ":""}{eq}</span>))}</div></div>
              <div style={{display:"flex",gap:8,marginTop:14}}><button style={s.btn("p")} onClick={()=>saveAthlete(f)}>💾 저장</button><button style={s.btn("o")} onClick={()=>setEditAthlete(null)}>취소</button></div>
            </div>
          );
        };
        return <FormInner key={editAthlete.id||"new"}/>;
      })()}
      {athletes.map(a=>(
        <div key={a.id} style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div><span style={{fontSize:17,fontWeight:700,color:C.brand}}>{a.name}</span><span style={{marginLeft:10,fontSize:12,color:C.textMuted}}>{a.sport} · {a.position}</span><span style={{marginLeft:8,fontSize:10,color:C.textDim,fontFamily:"monospace",background:C.bgInput,padding:"2px 6px",borderRadius:4}}>{a.id}</span></div>
            <div style={{display:"flex",gap:8}}><span onClick={()=>setEditAthlete(a)} style={{cursor:"pointer",fontSize:12,color:C.brandLight,fontWeight:600}}>수정</span><span onClick={async()=>{if(!confirm(a.name+' 선수를 삭제하시겠습니까?'))return;try{setSaving(true);await callSheets('deleteAthlete',{athleteCode:a.id});setAthletes(p=>p.filter(x=>x.id!==a.id));if(cfg.athleteId===a.id)setCfg(c=>({...c,athleteId:athletes.find(x=>x.id!==a.id)?.id||""}));showSave("✅ 선수 삭제 완료 → Google Sheets");}catch(err){alert('삭제 실패: '+err.message);}finally{setSaving(false);}}} style={{cursor:"pointer",fontSize:12,color:C.danger}}>삭제</span></div>
          </div>
          <div style={{fontSize:12,color:C.textMuted,marginTop:5}}>{a.height}cm · {a.weight}kg · {a.age}세{a.team?` · ${a.team}`:""}</div>
          {a.memo&&<div style={{fontSize:12,color:C.textDim,marginTop:4,lineHeight:1.6}}>{a.memo}</div>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>{a.equipment.map(eq=><span key={eq} style={{...s.tag(C.success),fontSize:9}}>{eq}</span>)}</div>
          <div style={{marginTop:8,fontSize:12,color:C.textMuted}}>총 세션: <b style={{color:C.brand}}>{history.filter(h=>h.athleteId===a.id).length}</b>회</div>
        </div>
      ))}
    </>
  );

  const renderLibrary=()=>{
    const fl=LIBRARY.filter(e=>{if(libFilter.section!=="all"&&e.section!==libFilter.section)return false;if(libFilter.type!=="all"&&e.type!==libFilter.type)return false;if(libFilter.search&&!e.name.includes(libFilter.search)&&!(e.nameEn||"").toLowerCase().includes(libFilter.search.toLowerCase())&&!e.id.toLowerCase().includes(libFilter.search.toLowerCase()))return false;return true;});
    return(<>
      <h2 style={{fontSize:isMobile?18:20,fontWeight:800,margin:"0 0 18px",color:C.brand}}>📚 라이브러리 <span style={{fontSize:14,fontWeight:400,color:C.textMuted}}>({fl.length}/{LIBRARY.length})</span></h2>
      <div style={{...s.card,padding:14}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input style={{...s.inp,width:isMobile?"100%":200}} placeholder="검색..." value={libFilter.search} onChange={e=>setLibFilter(f=>({...f,search:e.target.value}))}/>
        <select style={{...s.sel,width:isMobile?"48%":120}} value={libFilter.section} onChange={e=>setLibFilter(f=>({...f,section:e.target.value}))}><option value="all">전체 구간</option><option value="Warmup">Warmup</option><option value="Main">Main</option><option value="Accessory">Accessory</option></select>
        <select style={{...s.sel,width:isMobile?"48%":130}} value={libFilter.type} onChange={e=>setLibFilter(f=>({...f,type:e.target.value}))}><option value="all">전체 유형</option>{["Power","Strength","Hypertrophy","SSC","Stability","Mobility","Transfer","Warmup"].map(t=><option key={t} value={t}>{t}</option>)}</select>
      </div></div>
      <div style={{marginTop:12}}>{fl.map(ex=>(
        <div key={ex.id} style={{...s.card,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,color:C.textDim,fontFamily:"monospace"}}>{ex.id}</span><span style={{fontSize:13,fontWeight:500}}>{ex.name}</span><span style={s.tag(TC[ex.type]||"#999")}>{ex.type}</span><span style={{...s.tag(C.brandLight)}}>{ex.section}</span></div>
          {!isMobile&&<div style={{fontSize:10,color:C.textDim,marginTop:2}}>{ex.pattern} · {ex.target} · {ex.equipment}</div>}</div>
          {ex.video&&<a href={ex.video} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.brandLight,textDecoration:"none",fontWeight:600,flexShrink:0,marginLeft:8}}>🎬</a>}
        </div>
      ))}</div>
    </>);
  };

  const renderHistory=()=>{
    const grouped={};history.forEach(h=>{if(!grouped[h.athleteId])grouped[h.athleteId]=[];grouped[h.athleteId].push(h);});
    const athleteIds=Object.keys(grouped);
    const filteredIds=athleteIds.filter(id=>{if(!histSearch)return true;const a=getAthlete(id);const name=a?.name||grouped[id][0]?.athleteName||"";return name.includes(histSearch)||id.toLowerCase().includes(histSearch.toLowerCase())||(a?.sport||"").includes(histSearch);});

    if(histDetail){
      const sessions=grouped[histDetail]||[];const a=getAthlete(histDetail);
      const aName=a?.name||sessions[0]?.athleteName||histDetail;const aSport=a?.sport||sessions[0]?.athleteSport||"";const aPos=a?.position||sessions[0]?.athletePosition||"";
      const fbS=sessions.filter(s=>s.feedback).reverse();
      const rpeD=fbS.map(s=>s.feedback.q1);const fatD=fbS.map(s=>s.feedback.q2);const spdD=fbS.map(s=>s.feedback.q3);const recD=fbS.map(s=>s.feedback.q4);
      const vasD=fbS.filter(s=>s.feedback.q5vas>0).map(s=>s.feedback.q5vas);
      const fbDates=fbS.map(s=>fmtDate(s.date));const vasDates=fbS.filter(s=>s.feedback.q5vas>0).map(s=>fmtDate(s.date));
      return(<>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
          <span onClick={()=>setHistDetail(null)} style={{cursor:"pointer",fontSize:13,color:C.brandLight,fontWeight:600}}>← 목록</span>
          <div><span style={{fontSize:isMobile?18:22,fontWeight:800,color:C.brand}}>{aName}</span><span style={{marginLeft:10,fontSize:isMobile?12:14,color:C.textMuted}}>{aSport} · {aPos}</span>{!isMobile&&<span style={{marginLeft:8,fontSize:11,color:C.textDim,fontFamily:"monospace",background:C.bgInput,padding:"2px 8px",borderRadius:4}}>{histDetail}</span>}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:10,marginBottom:18}}>
          {[{l:"총 세션",v:`${sessions.length}`,c:C.brand},{l:"피드백",v:`${fbS.length}`,c:C.success},{l:"평균RPE",v:rpeD.length?(rpeD.reduce((a,b)=>a+b,0)/rpeD.length).toFixed(1):"—",c:rpeD.length?(rpeD.reduce((a,b)=>a+b,0)/rpeD.length)>=8?C.danger:C.success:C.textDim},{l:"평균피로",v:fatD.length?(fatD.reduce((a,b)=>a+b,0)/fatD.length).toFixed(1):"—",c:fatD.length?(fatD.reduce((a,b)=>a+b,0)/fatD.length)>=7?C.danger:C.success:C.textDim}].map((st,i)=>(
            <div key={i} style={{...s.card,padding:isMobile?12:16,textAlign:"center"}}><div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>{st.l}</div><div style={{fontSize:isMobile?22:26,fontWeight:800,color:st.c}}>{st.v}</div></div>
          ))}
        </div>
        {fbS.length>=2&&(<div style={s.card}><div style={{fontSize:14,fontWeight:700,color:C.brand,marginBottom:14}}>📈 컨디션 추이</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
            <MiniChart data={rpeD} dates={fbDates} color={C.danger} label="RPE — 높을수록 힘듦" max={10}/>
            <MiniChart data={fatD} dates={fbDates} color={C.warning} label="피로도 — 높을수록 피곤" max={10}/>
            <MiniChart data={spdD} dates={fbDates} color="#2D7DD2" label="속도지각 — 높을수록 빠름" max={10} invert={true}/>
            <MiniChart data={recD} dates={fbDates} color={C.success} label="회복예측 — 높을수록 어려움" max={5}/>
            {vasD.length>=2&&<MiniChart data={vasD} dates={vasDates} color="#D94040" label="통증 VAS" max={10}/>}
          </div>
        </div>)}
        <div style={{marginTop:14}}><div style={{fontSize:14,fontWeight:700,color:C.brand,marginBottom:12}}>📋 세션 목록</div>
          {sessions.map((h,i)=>(
            <div key={h.id} style={{...s.card,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
                <div><span style={{fontSize:14,fontWeight:700,color:C.accent}}>#{sessions.length-i}</span><span style={{marginLeft:10,fontSize:13,fontWeight:600}}>{h.date}</span><span style={{marginLeft:10,fontSize:12,color:C.textMuted}}>{h.concept} · W{h.weekNum}</span></div>
                {!h.feedback&&<button style={{...s.btn("o"),fontSize:11,padding:"4px 10px"}} onClick={()=>{setFeedbackFor(h.id);setFeedback({q1:5,q2:5,q3:5,q4:3,q5area:"",q5vas:0});}}>📝 피드백</button>}
              </div>
              <div style={{fontSize:12,color:C.textMuted,lineHeight:1.8}}>
                {["warmup","main","accessory"].map(sec=>(h.session[sec]?.length>0&&(<div key={sec} style={{marginBottom:2}}><span style={{color:C.brand,fontWeight:600}}>{sec==="warmup"?"🔥":sec==="main"?"💪":"🛡️"} </span>{h.session[sec].map(e=>e.name).join(", ")}</div>)))}
              </div>
              {h.feedback&&(<div style={{marginTop:8,padding:10,background:C.bgInput,borderRadius:8,border:`1px solid ${C.border}`}}><div style={{display:"flex",gap:14,fontSize:12,flexWrap:"wrap"}}>
                <span>RPE:<b style={{color:fbCol(h.feedback.q1,[6,8])}}>{h.feedback.q1}</b></span><span>피로:<b style={{color:fbCol(h.feedback.q2,[5,8])}}>{h.feedback.q2}</b></span><span>속도:<b style={{color:h.feedback.q3>=7?C.success:h.feedback.q3>=4?C.warning:C.danger}}>{h.feedback.q3}</b></span><span>회복:<b style={{color:fbCol(h.feedback.q4,[3,4])}}>{h.feedback.q4}</b></span>
                {h.feedback.q5area&&<span>🩹{h.feedback.q5area} VAS:<b style={{color:fbCol(h.feedback.q5vas,[4,7])}}>{h.feedback.q5vas}</b></span>}
              </div></div>)}
              {feedbackFor===h.id&&<FeedbackForm hid={h.id}/>}
            </div>
          ))}
        </div>
      </>);
    }
    return(<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:isMobile?18:20,fontWeight:800,margin:0,color:C.brand}}>📊 세션 기록</h2>
        <span style={{fontSize:12,color:C.textMuted}}>{history.length}세션 · {athleteIds.length}명</span>
      </div>
      <div style={{...s.card,padding:14,marginBottom:14}}><input style={{...s.inp,maxWidth:300}} placeholder="선수 이름/ID/종목 검색..." value={histSearch} onChange={e=>setHistSearch(e.target.value)}/></div>
      {history.length===0&&<div style={{...s.card,color:C.textMuted,textAlign:"center",padding:50}}>아직 저장된 세션이 없습니다</div>}
      {filteredIds.map(aid=>{
        const sessions=grouped[aid];const a=getAthlete(aid);const aName=a?.name||sessions[0]?.athleteName||aid;const aSport=a?.sport||"";const aPos=a?.position||"";const isExp=histExpanded===aid;const fbC=sessions.filter(s=>s.feedback).length;
        return(<div key={aid} style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setHistExpanded(isExp?null:aid)}>
            <div style={{flex:1,minWidth:0}}><span style={{fontSize:isMobile?15:17,fontWeight:700,color:C.brand}}>{aName}</span><span style={{marginLeft:8,fontSize:12,color:C.textMuted}}>{aSport}·{aPos}</span>{!isMobile&&<span style={{marginLeft:8,fontSize:10,color:C.textDim,fontFamily:"monospace",background:C.bgInput,padding:"2px 6px",borderRadius:4}}>{aid}</span>}</div>
            <div style={{display:"flex",alignItems:"center",gap:isMobile?8:14,flexShrink:0}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:isMobile?16:20,fontWeight:800,color:C.accent}}>{sessions.length}</div><div style={{fontSize:9,color:C.textDim}}>세션</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:isMobile?16:20,fontWeight:800,color:C.success}}>{fbC}</div><div style={{fontSize:9,color:C.textDim}}>피드백</div></div>
              <span style={{color:C.textDim,fontSize:12}}>{isExp?"▲":"▼"}</span>
            </div>
          </div>
          {isExp&&(<div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,color:C.textMuted}}>최근 세션</span>
              <span onClick={()=>setHistDetail(aid)} style={{fontSize:12,color:C.brandLight,cursor:"pointer",fontWeight:700}}>상세 보기 →</span>
            </div>
            {sessions.slice(0,3).map((h,i)=>(
              <div key={h.id} style={{background:C.bgInput,borderRadius:8,padding:"10px 12px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                <div><span style={{fontSize:13,fontWeight:700,color:C.accent}}>#{sessions.length-i}</span><span style={{marginLeft:8,fontSize:12}}>{h.date}</span><span style={{marginLeft:8,fontSize:11,color:C.textMuted}}>{h.concept}</span></div>
                {h.feedback?(<div style={{fontSize:11,color:C.textMuted}}>RPE<b style={{color:fbCol(h.feedback.q1,[6,8])}}>{h.feedback.q1}</b> 피로<b style={{color:fbCol(h.feedback.q2,[5,8])}}>{h.feedback.q2}</b></div>):(<span style={{fontSize:10,color:C.textDim}}>피드백없음</span>)}
              </div>
            ))}
            {sessions.length>3&&<div style={{fontSize:11,color:C.textDim,textAlign:"center",marginTop:4}}>+{sessions.length-3}개 더</div>}
          </div>)}
        </div>);
      })}
    </>);
  };

  // ═══ LAYOUT ═══
  const sideW = isMobile ? 0 : isTablet ? 180 : 220;
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      {/* Mobile top bar */}
      {isMobile&&(
        <div style={{background:C.brand,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
          <div style={{fontSize:16,fontWeight:800,color:C.white}}>Physical D</div>
          <span onClick={()=>setMenuOpen(!menuOpen)} style={{fontSize:20,cursor:"pointer",color:C.white}}>{menuOpen?"✕":"☰"}</span>
        </div>
      )}
      {/* Mobile menu overlay */}
      {isMobile&&menuOpen&&(
        <div style={{position:"fixed",top:48,left:0,right:0,bottom:0,background:C.brand+"F5",zIndex:99,padding:20}}>
          {[{id:"session",icon:"📋",label:"세션 생성"},{id:"athletes",icon:"👤",label:"선수 관리"},{id:"library",icon:"📚",label:"라이브러리"},{id:"history",icon:"📊",label:"세션 기록"}].map(n=>(
            <div key={n.id} onClick={()=>navTo(n.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:10,marginBottom:4,cursor:"pointer",background:page===n.id?"rgba(232,168,56,0.25)":"transparent",color:page===n.id?C.accent:C.white,fontWeight:page===n.id?700:400,fontSize:16}}><span>{n.icon}</span><span>{n.label}</span></div>
          ))}
        </div>
      )}
      <div style={{display:"flex"}}>
        {/* Desktop sidebar */}
        {!isMobile&&(
          <div style={{width:sideW,background:C.brand,display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
            <div style={{padding:"22px 18px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{fontSize:18,fontWeight:800,color:C.white,letterSpacing:-0.5}}>Physical D</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:3}}>Training System v1.0</div>
            </div>
            <div style={{padding:"14px 10px",flex:1}}>
              {[{id:"session",icon:"📋",label:"세션 생성"},{id:"athletes",icon:"👤",label:"선수 관리"},{id:"library",icon:"📚",label:"라이브러리"},{id:"history",icon:"📊",label:"세션 기록"}].map(n=>(
                <div key={n.id} onClick={()=>navTo(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",background:page===n.id?"rgba(232,168,56,0.2)":"transparent",color:page===n.id?C.accent:"rgba(255,255,255,0.55)",fontWeight:page===n.id?700:400,fontSize:isTablet?12:13}}><span>{n.icon}</span><span>{n.label}</span></div>
              ))}
            </div>
            <div style={{padding:"12px 18px",borderTop:"1px solid rgba(255,255,255,0.08)",fontSize:10,color:"rgba(255,255,255,0.3)"}}>{LIBRARY.length}개 운동 · {athletes.length}명{loadingAthletes?" · 로딩중...":""} · ☁️ Sheets 연동</div>
          </div>
        )}
        {/* Main content */}
        <div style={{flex:1,padding:isMobile?"16px":isTablet?"20px":"24px 28px",overflowY:"auto",minHeight:isMobile?"calc(100vh - 48px)":"100vh"}}>
          {page==="session"&&renderSession()}
          {page==="athletes"&&renderAthletes()}
          {page==="library"&&renderLibrary()}
          {page==="history"&&renderHistory()}
          {loadingAthletes&&athletes.length===0&&page!=="library"&&(
            <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:"30px 40px",boxShadow:"0 4px 20px rgba(0,0,0,0.1)",textAlign:"center",zIndex:200}}>
              <div style={{fontSize:24,marginBottom:10}}>⏳</div>
              <div style={{fontSize:14,color:C.brand,fontWeight:600}}>Google Sheets에서 데이터 불러오는 중...</div>
              <div style={{fontSize:11,color:C.textDim,marginTop:6}}>처음은 2~5초 걸릴 수 있어요</div>
            </div>
          )}
        </div>
      </div>
      {/* 저장 알림 토스트 */}
      {(saving||saveMsg)&&(
        <div style={{position:"fixed",bottom:20,right:20,padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:300,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",background:saving?C.brand:C.success,color:C.white,transition:"all 0.3s"}}>
          {saving?"💾 저장 중...":saveMsg}
        </div>
      )}
    </div>
  );
}

