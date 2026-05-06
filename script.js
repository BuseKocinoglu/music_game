// Arayüz Elementleri
const startScreen = document.getElementById("start-screen");
const songSelectionScreen = document.getElementById("song-selection-screen");
const helpModal = document.getElementById("help-modal");
const gameOverScreen = document.getElementById("game-over-screen");

const singlePlayerBtn = document.getElementById("single-player-btn");
const twoPlayerBtn = document.getElementById("two-player-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const helpBtn = document.getElementById("help-btn");
const closeHelpBtn = document.getElementById("close-help");

const retryBtn = document.getElementById("retry-btn");
const nextSongBtn = document.getElementById("next-song-btn");
const menuBtn = document.getElementById("menu-btn");
const bgMusic = document.getElementById("gameMusic");

// Oyun Ayarları
let isGameRunning = false;
let isTwoPlayerMode = false;
let animationId;
let players = [];

const lanes = [55, 165, 275, 385];
const colors = ["#ff6600", "#00f3ff", "#ffcc00", "#b700ff"]; // Neon Turuncu dahil
const hitLineY = 600;

// Yeni Tuş Haritası (Z,X,C,V ve U,I,O,P)
const keyMap = {
    'z': { pIndex: 0, lane: 0 }, 'x': { pIndex: 0, lane: 1 }, 'c': { pIndex: 0, lane: 2 }, 'v': { pIndex: 0, lane: 3 },
    'u': { pIndex: 1, lane: 0 }, 'ı': { pIndex: 1, lane: 1 }, 'i': { pIndex: 1, lane: 1 }, // TR ve EN klavye i harfi
    'o': { pIndex: 1, lane: 2 }, 'p': { pIndex: 1, lane: 3 }
};

const laneLabelsP1 = ['Z', 'X', 'C', 'V'];
const laneLabelsP2 = ['U', 'I', 'O', 'P'];

const songDatabase = {
    easy: { file: "assets/kolay.wav", bpm: 105, offset: 0.5, speed: 4, bombChance: 0.05 },
    medium: { file: "assets/orta.wav", bpm: 146, offset: 0.5, speed: 6, bombChance: 0.12 },
    hard: { file: "assets/zor.wav", bpm: 170, offset: 0.5, speed: 8, bombChance: 0.20 }
};

let unlockedLevels = { easy: true, medium: false, hard: false };
let currentLevelId = 'easy';

let currentBPM = 120, currentOffset = 0, currentSpeed = 6, currentBombChance = 0;
let beatInterval = 0, nextBeatIndex = 0, fallTime = 0;

// OYUNCU SINIFI (Player Class) - Çok oyuncuyu kolayca yönetmek için
class Player {
    constructor(id, canvasId, scoreId, comboId, healthId, labels) {
        this.id = id;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 440; this.canvas.height = 700;

        this.scoreEl = document.getElementById(scoreId);
        this.comboEl = document.getElementById(comboId);
        this.healthEl = document.getElementById(healthId);

        this.labels = labels;
        this.resetStats();
    }

    resetStats() {
        this.score = 0; this.combo = 0; this.maxCombo = 0; this.health = 100;
        this.notes = []; this.floatingTexts = [];
        this.keysPressed = { 0: false, 1: false, 2: false, 3: false };
        this.isDead = false;
        this.updateUI();
    }

    updateUI() {
        this.scoreEl.innerText = this.score;
        this.comboEl.innerText = this.combo;
        this.healthEl.innerText = this.health;
    }

    createFloatingText(text, colorRGB) {
        const rx = 100 + Math.random() * 240;
        const ry = 300 + Math.random() * 200;
        this.floatingTexts.push({ x: rx, y: ry, text: text, color: colorRGB, alpha: 1.0 });
    }
}

// Menü ve Mod Seçimleri
helpBtn.addEventListener("click", () => helpModal.classList.remove("hidden"));
closeHelpBtn.addEventListener("click", () => helpModal.classList.add("hidden"));

singlePlayerBtn.addEventListener("click", () => {
    isTwoPlayerMode = false;
    document.querySelector('.p2-element').classList.add("hidden");
    document.getElementById("p2-stats-panel").classList.add("hidden");
    document.getElementById("leaderboard-panel").classList.remove("hidden");

    startScreen.classList.add("hidden");
    songSelectionScreen.classList.remove("hidden");
});

twoPlayerBtn.addEventListener("click", () => {
    isTwoPlayerMode = true;
    document.querySelector('.p2-element').classList.remove("hidden");
    document.getElementById("p2-stats-panel").classList.remove("hidden");
    document.getElementById("leaderboard-panel").classList.add("hidden");

    startScreen.classList.add("hidden");
    songSelectionScreen.classList.remove("hidden");
});

backToMenuBtn.addEventListener("click", () => {
    songSelectionScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

const songCards = document.querySelectorAll(".song-card");
songCards.forEach(card => {
    card.addEventListener("click", () => {
        const level = card.getAttribute("data-level");
        if (!unlockedLevels[level]) return;

        currentLevelId = level;
        songSelectionScreen.classList.add("hidden");

        const songData = songDatabase[level];
        bgMusic.src = songData.file;
        bgMusic.load();

        currentBPM = songData.bpm; currentOffset = songData.offset;
        currentSpeed = songData.speed; currentBombChance = songData.bombChance;

        beatInterval = 60 / currentBPM;
        fallTime = (650 / currentSpeed) / 60;

        startGame();
    });
});

function startGame() {
    isGameRunning = true;

    // Oyuncuları Yarat/Sıfırla
    players = [new Player(1, "gameCanvasP1", "p1-score", "p1-combo", "p1-health", laneLabelsP1)];
    if (isTwoPlayerMode) {
        players.push(new Player(2, "gameCanvasP2", "p2-score", "p2-combo", "p2-health", laneLabelsP2));
    }

    nextBeatIndex = 0;
    while (currentOffset + (nextBeatIndex * beatInterval) - fallTime < 0) { nextBeatIndex++; }

    bgMusic.currentTime = 0; bgMusic.volume = 0.5;
    let playPromise = bgMusic.play();
    if (playPromise !== undefined) { playPromise.catch(error => console.log("Müzik hatası:", error)); }

    gameLoop();
}

function endGame(isSuccess) {
    isGameRunning = false;
    bgMusic.pause();
    cancelAnimationFrame(animationId);

    const endTitle = document.getElementById("end-title");
    const spStats = document.getElementById("sp-end-stats");
    const tpStats = document.getElementById("tp-end-stats");

    if (isTwoPlayerMode) {
        spStats.classList.add("hidden");
        tpStats.classList.remove("hidden");
        document.getElementById("p1-final-score").innerText = players[0].score;
        document.getElementById("p2-final-score").innerText = players[1].score;

        if (players[0].score > players[1].score) {
            endTitle.innerText = "OYUNCU 1 KAZANDI!"; endTitle.style.color = "#00f3ff";
        } else if (players[1].score > players[0].score) {
            endTitle.innerText = "OYUNCU 2 KAZANDI!"; endTitle.style.color = "#ff0055";
        } else {
            endTitle.innerText = "BERABERE!"; endTitle.style.color = "#ffcc00";
        }
        nextSongBtn.classList.add('hidden'); // İki kişilikte hikaye ilerlemez
    } else {
        spStats.classList.remove("hidden");
        tpStats.classList.add("hidden");
        document.getElementById("final-score").innerText = players[0].score;
        document.getElementById("final-max-combo").innerText = players[0].maxCombo;

        if (isSuccess) {
            endTitle.innerText = "TEBRİKLER! ŞARKIYI BİTİRDİN"; endTitle.style.color = "#00ff00";
            if (currentLevelId === 'easy') { unlockedLevels.medium = true; document.querySelector('.medium-song').classList.remove('locked'); nextSongBtn.classList.remove('hidden'); }
            else if (currentLevelId === 'medium') { unlockedLevels.hard = true; document.querySelector('.hard-song').classList.remove('locked'); nextSongBtn.classList.remove('hidden'); }
            else { nextSongBtn.classList.add('hidden'); }
        } else {
            endTitle.innerText = "OYUN BİTTİ"; endTitle.style.color = "#ff0055";
            nextSongBtn.classList.add('hidden');
        }
    }

    gameOverScreen.classList.remove("hidden");
}

retryBtn.addEventListener("click", () => { gameOverScreen.classList.add("hidden"); startGame(); });
menuBtn.addEventListener("click", () => { gameOverScreen.classList.add("hidden"); songSelectionScreen.classList.remove("hidden"); });
nextSongBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    let nextLevel = currentLevelId === 'easy' ? 'medium' : 'hard';
    currentLevelId = nextLevel;
    const songData = songDatabase[nextLevel];
    bgMusic.src = songData.file; bgMusic.load();
    currentBPM = songData.bpm; currentOffset = songData.offset; currentSpeed = songData.speed; currentBombChance = songData.bombChance;
    beatInterval = 60 / currentBPM; fallTime = (650 / currentSpeed) / 60;
    startGame();
});

// ANA DÖNGÜ (Her Oyuncu İçin Ayrı Ayrı Çizim Yapar)
function gameLoop() {
    if (!isGameRunning) return;

    // Nota Üretimi (Tüm oyuncular için aynı notaları üret)
    let targetBeatTime = currentOffset + (nextBeatIndex * beatInterval);
    let spawnTime = targetBeatTime - fallTime;

    if (bgMusic.currentTime >= spawnTime && bgMusic.currentTime > 0) {
        let randomLane = Math.floor(Math.random() * 4);
        let isBomb = Math.random() < currentBombChance;

        let noteData = { x: lanes[randomLane], y: -50, color: isBomb ? "#ff003c" : colors[randomLane], lane: randomLane, isMissed: false, type: isBomb ? 'bomb' : 'normal' };

        players.forEach(p => p.notes.push({ ...noteData })); // Kopyalayarak her oyuncuya ver
        nextBeatIndex++;
    }

    // Her Oyuncuyu Çiz ve Güncelle
    players.forEach(p => {
        if (p.isDead) {
            // Ölen oyuncunun ekranına ELENDİN yazısı bas
            p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
            p.ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            p.ctx.font = "italic 900 60px Impact";
            p.ctx.textAlign = "center";
            p.ctx.fillText("ELENDİN", p.canvas.width / 2, p.canvas.height / 2);
            return; // Çizimi durdur
        }

        p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);

        // Şerit Çizgileri
        p.ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            p.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            p.ctx.beginPath(); p.ctx.moveTo(i * 110, 0); p.ctx.lineTo(i * 110, p.canvas.height); p.ctx.stroke();
        }

        // Vuruş Çizgisi
        p.ctx.shadowBlur = 20; p.ctx.shadowColor = "#ffffff"; p.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        p.ctx.fillRect(0, hitLineY - 5, p.canvas.width, 10); p.ctx.shadowBlur = 0;

        // Hedef Halkaları ve Harfler
        for (let i = 0; i < 4; i++) {
            p.ctx.beginPath(); p.ctx.arc(lanes[i], hitLineY, 25, 0, Math.PI * 2);
            if (p.keysPressed[i]) {
                p.ctx.fillStyle = colors[i]; p.ctx.shadowBlur = 30; p.ctx.shadowColor = colors[i]; p.ctx.fill();
            } else {
                p.ctx.strokeStyle = colors[i]; p.ctx.lineWidth = 4; p.ctx.shadowBlur = 15; p.ctx.shadowColor = colors[i]; p.ctx.stroke();
            }
            p.ctx.shadowBlur = 0; p.ctx.closePath();
            p.ctx.fillStyle = "white"; p.ctx.font = "bold 20px Arial"; p.ctx.textAlign = "center"; p.ctx.textBaseline = "middle";
            p.ctx.fillText(p.labels[i], lanes[i], hitLineY);
        }

        // Notaları Güncelle ve Çiz
        for (let i = 0; i < p.notes.length; i++) {
            let note = p.notes[i];
            note.y += currentSpeed;

            // Kaçırılma Kontrolü (Sadece Normal Notalar)
            if (note.type === 'normal' && note.y > hitLineY + 40 && !note.isMissed) {
                note.isMissed = true; note.color = "#ff3333";
                p.combo = 0; p.health -= 10; p.updateUI();
                p.createFloatingText("-10", "255, 51, 51");
                if (p.health <= 0) p.isDead = true;
            }

            let drawX = note.x;
            if (note.type === 'normal') {
                if (note.isMissed) { drawX += (Math.random() - 0.5) * 10; p.ctx.shadowBlur = 20; p.ctx.shadowColor = "#ff0000"; }
                else { p.ctx.shadowBlur = 15; p.ctx.shadowColor = note.color; }
                p.ctx.beginPath(); p.ctx.arc(drawX, note.y, 20, 0, Math.PI * 2); p.ctx.fillStyle = "rgba(0,0,0,0.8)"; p.ctx.fill();
                p.ctx.strokeStyle = note.color; p.ctx.lineWidth = 5; p.ctx.stroke();
                p.ctx.beginPath(); p.ctx.arc(drawX, note.y, 8, 0, Math.PI * 2); p.ctx.fillStyle = note.color; p.ctx.fill();
            }
            else if (note.type === 'bomb') {
                p.ctx.shadowBlur = 15; p.ctx.shadowColor = "#ff0000";
                p.ctx.beginPath(); p.ctx.arc(drawX, note.y, 20, 0, Math.PI * 2); p.ctx.fillStyle = "#111"; p.ctx.fill();
                p.ctx.strokeStyle = "#ff003c"; p.ctx.lineWidth = 4; p.ctx.stroke();
                p.ctx.fillStyle = "#ff003c"; p.ctx.font = "bold 22px Arial"; p.ctx.textAlign = "center"; p.ctx.textBaseline = "middle"; p.ctx.fillText("X", drawX, note.y);
            }
            p.ctx.shadowBlur = 0;
            if (note.y > p.canvas.height + 50) { p.notes.splice(i, 1); i--; }
        }

        // Uçuşan Yazılar
        for (let i = 0; i < p.floatingTexts.length; i++) {
            let ft = p.floatingTexts[i];
            ft.y -= 2; ft.alpha -= 0.02;
            p.ctx.fillStyle = `rgba(${ft.color}, ${ft.alpha})`; p.ctx.font = "italic 900 45px Impact, sans-serif"; p.ctx.textAlign = "center";
            p.ctx.shadowBlur = 15; p.ctx.shadowColor = `rgba(${ft.color}, ${ft.alpha})`; p.ctx.fillText(ft.text, ft.x, ft.y);
            p.ctx.lineWidth = 2; p.ctx.strokeStyle = `rgba(0, 0, 0, ${ft.alpha})`; p.ctx.strokeText(ft.text, ft.x, ft.y); p.ctx.shadowBlur = 0;
            if (ft.alpha <= 0) { p.floatingTexts.splice(i, 1); i--; }
        }
    });

    // İki oyuncu da ölürse oyunu doğrudan bitir
    if (players.every(p => p.isDead)) {
        endGame(false);
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

// KLAVYE KONTROLLERİ
document.addEventListener("keydown", (event) => {
    if (!isGameRunning) return;
    const mapping = keyMap[event.key.toLowerCase()];
    if (!mapping) return;

    const pIndex = mapping.pIndex;
    if (!isTwoPlayerMode && pIndex === 1) return; // Tek kişilik modda P2 tuşları iptal

    let p = players[pIndex];
    if (p.isDead) return;

    p.keysPressed[mapping.lane] = true;

    for (let i = 0; i < p.notes.length; i++) {
        let note = p.notes[i];
        if (note.lane === mapping.lane && !note.isMissed) {
            let distance = Math.abs(note.y - hitLineY);
            if (distance < 50) {
                if (note.type === 'normal') {
                    p.combo++; if (p.combo > p.maxCombo) p.maxCombo = p.combo;
                    p.score += 100 * p.combo; p.updateUI();
                }
                else if (note.type === 'bomb') {
                    p.health -= 20; p.combo = 0; p.updateUI();

                    p.canvas.classList.remove('shake-effect');
                    void p.canvas.offsetWidth;
                    p.canvas.classList.add('shake-effect');
                    p.createFloatingText("-20", "255, 0, 60");

                    if (p.health <= 0) p.isDead = true;
                }
                p.notes.splice(i, 1);
                break;
            }
        }
    }
});

document.addEventListener("keyup", (event) => {
    const mapping = keyMap[event.key.toLowerCase()];
    if (mapping) {
        if (!isTwoPlayerMode && mapping.pIndex === 1) return;
        if (!players[mapping.pIndex].isDead) players[mapping.pIndex].keysPressed[mapping.lane] = false;
    }
});

bgMusic.addEventListener('ended', () => { if (isGameRunning) endGame(true); });