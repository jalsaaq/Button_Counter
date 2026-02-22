const STORAGE = "pixel_button_counter_board_v1";

const screenStart   = document.getElementById("screenStart");
const screenGame    = document.getElementById("screenGame");

const nameInput     = document.getElementById("nameInput");
const startBtn      = document.getElementById("startBtn");

const backTopBtn    = document.getElementById("backTopBtn");

const playBtn       = document.getElementById("playBtn");
const powerBtn      = document.getElementById("powerBtn");
const powerIcon     = document.getElementById("powerIcon");

const egg           = document.getElementById("egg");

const timeText      = document.getElementById("timeText");
const bigTimer      = document.getElementById("bigTimer");
const clickText     = document.getElementById("clickText");
const bestText      = document.getElementById("bestText");

const leaderPanel   = document.getElementById("leaderPanel");
const leaderGame    = document.getElementById("leaderGame");

const trophyWrap    = document.getElementById("trophyWrap");
const heartStageImg = document.getElementById("heartStage");

let state = {
  player: "",
  clicks: 0,
  running: false,
  timeLeftMs: 10000,
  tickId: null,
  stageId: null,
  bestGlobal: 0
};

/* ---------- Pixel Egg (NO PHOTOS) ---------- */
function eggSvg(stage){
  const crack = (stage >= 1) ? `
    <rect x="26" y="28" width="2" height="2" fill="#5c4a35"/>
    <rect x="28" y="30" width="2" height="2" fill="#5c4a35"/>
    <rect x="30" y="32" width="2" height="2" fill="#5c4a35"/>
    <rect x="32" y="34" width="2" height="2" fill="#5c4a35"/>
  ` : "";

  const crack2 = (stage >= 2) ? `
    <rect x="20" y="36" width="2" height="2" fill="#5c4a35"/>
    <rect x="22" y="38" width="2" height="2" fill="#5c4a35"/>
    <rect x="24" y="40" width="2" height="2" fill="#5c4a35"/>
    <rect x="26" y="42" width="2" height="2" fill="#5c4a35"/>
  ` : "";

  const chips = (stage >= 3) ? `
    <rect x="14" y="52" width="4" height="2" fill="#e9d7b8"/>
    <rect x="44" y="50" width="4" height="2" fill="#e9d7b8"/>
    <rect x="10" y="46" width="2" height="2" fill="#c8b089"/>
    <rect x="50" y="44" width="2" height="2" fill="#c8b089"/>
  ` : "";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" shape-rendering="crispEdges">
    <rect x="18" y="58" width="28" height="4" fill="rgba(0,0,0,0.18)"/>
    <path d="M32 8 C42 8, 50 18, 50 30 C50 48, 42 56, 32 56 C22 56, 14 48, 14 30 C14 18, 22 8, 32 8 Z"
          fill="#f2e6d1" stroke="#2b1b10" stroke-width="2"/>

    <rect x="22" y="16" width="2" height="2" fill="#ffffff"/>
    <rect x="24" y="14" width="2" height="2" fill="#ffffff"/>

    <rect x="18" y="38" width="2" height="2" fill="#e0caa6"/>
    <rect x="20" y="42" width="2" height="2" fill="#e0caa6"/>
    <rect x="22" y="46" width="2" height="2" fill="#e0caa6"/>

    ${crack}
    ${crack2}
    ${chips}
  </svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function setEggStage(stage){
  egg.style.backgroundImage = `url("${eggSvg(stage)}")`;
  egg.style.backgroundRepeat = "no-repeat";
  egg.style.backgroundPosition = "center";
  egg.style.backgroundSize = "100% 100%";
}

function crackFromClicks(clicks){
  if (clicks < 10) return 0;
  if (clicks < 20) return 1;
  if (clicks < 30) return 2;
  return 3;
}

/* ---------- Leaderboard ---------- */
function readBoard(){
  try { return JSON.parse(localStorage.getItem(STORAGE)) || []; }
  catch { return []; }
}

function writeBoard(board){
  localStorage.setItem(STORAGE, JSON.stringify(board));
}

function computeGlobalBest(board){
  return board.reduce((m, r) => Math.max(m, r.best || 0), 0);
}

function upsertScore(board, player, score){
  const i = board.findIndex(x => x.player === player);
  if (i >= 0) board[i].best = Math.max(board[i].best, score);
  else board.push({ player, best: score });

  board.sort((a,b)=> (b.best||0) - (a.best||0));
  return board;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function renderBoard(){
  const boardAll = readBoard();
  const top = boardAll.slice(0, 5);

  leaderGame.innerHTML = top.length
    ? top.map((r, idx) => `<li>${idx+1}. <b>${escapeHtml(r.player)}</b> - ${r.best}</li>`).join("")
    : `<li><b>NO SCORES</b></li>`;

  state.bestGlobal = computeGlobalBest(boardAll);
  bestText.textContent = String(state.bestGlobal);
}

/* ---------- UI ---------- */
function show(which){
  if (which === "start"){
    screenStart.classList.remove("hidden");
    screenGame.classList.add("hidden");
  } else {
    screenStart.classList.add("hidden");
    screenGame.classList.remove("hidden");
  }
}

function setHud(){
  const t = Math.max(0, state.timeLeftMs) / 1000;
  timeText.textContent = t.toFixed(1);
  bigTimer.textContent = String(Math.ceil(t));
  clickText.textContent = String(state.clicks);
  bestText.textContent = String(state.bestGlobal);
}

function clearTimers(){
  clearInterval(state.tickId);
  clearInterval(state.stageId);
  state.tickId = null;
  state.stageId = null;
}

function setPower(isOn){
  powerIcon.src = isOn ? "./assets/on.png" : "./assets/off.png";
}

/* ---------- Game ---------- */
function resetGameUI(){
  state.clicks = 0;
  state.timeLeftMs = 10000;

  setEggStage(0);
  heartStageImg.src = "./assets/1.png";

  trophyWrap.classList.add("hidden");
  leaderPanel.classList.add("hidden"); // hide during play

  setHud();
}

function startRound(){
  clearTimers();
  renderBoard();

  state.running = true;
  setPower(true);

  resetGameUI();

  // heart stage 1..5 each 2 seconds
  let stage = 1;
  heartStageImg.src = `./assets/${stage}.png`;
  state.stageId = setInterval(() => {
    stage += 1;
    if (stage <= 5) heartStageImg.src = `./assets/${stage}.png`;
  }, 2000);

  // timer
  state.tickId = setInterval(() => {
    state.timeLeftMs -= 100;
    setHud();
    if (state.timeLeftMs <= 0) endRound();
  }, 100);
}

function endRound(){
  if (!state.running) return;

  clearTimers();
  state.running = false;

  state.timeLeftMs = 0;
  setHud();
  setPower(false);

  const beforeBest = state.bestGlobal;

  const board = upsertScore(readBoard(), state.player, state.clicks);
  writeBoard(board);
  renderBoard();

  // show leaderboard ONLY after end
  leaderPanel.classList.remove("hidden");

  // trophy ONLY if new global record
  if (state.clicks > beforeBest) {
  trophyWrap.classList.remove("hidden");
  // ensure centered trophy does not push layout
  trophyWrap.style.position = "absolute";
  trophyWrap.style.left = "50%";
  trophyWrap.style.transform = "translateX(-50%)";
}
}

/* ---------- Events ---------- */
startBtn.addEventListener("click", () => {
  const name = (nameInput.value || "").trim();
  if (!name) return;

  state.player = name;
  show("game");

  renderBoard();
  setPower(false);
  resetGameUI();
});

backTopBtn.addEventListener("click", () => {
  clearTimers();
  state.running = false;
  setPower(false);
  show("start");
});

/* PLAY starts the game */
playBtn.addEventListener("click", () => {
  if (!state.player) return;
  if (!state.running) startRound();
});

/* Power ends early (toggle stop) */
powerBtn.addEventListener("click", () => {
  if (!state.player) return;
  if (state.running) endRound();
  else startRound();
});

/* Egg click */
egg.addEventListener("click", () => {
  if (!state.running) return;

  state.clicks += 1;
  clickText.textContent = String(state.clicks);

  setEggStage(crackFromClicks(state.clicks));

  egg.classList.remove("crack-pop");
  void egg.offsetWidth;
  egg.classList.add("crack-pop");
});

/* init */
renderBoard();
setPower(false);
setEggStage(0);
setHud();