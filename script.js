// Arayüz Elementleri
const startScreen = document.getElementById("start-screen");
const songSelectionScreen = document.getElementById("song-selection-screen");
const helpModal = document.getElementById("help-modal");
const gameOverScreen = document.getElementById("game-over-screen");
const nameModal = document.getElementById("name-modal");

const singlePlayerBtn = document.getElementById("single-player-btn");
const twoPlayerBtn = document.getElementById("two-player-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");
const helpBtn = document.getElementById("help-btn");
const closeHelpBtn = document.getElementById("close-help");

const retryBtn = document.getElementById("retry-btn");
const nextSongBtn = document.getElementById("next-song-btn");
const menuBtn = document.getElementById("menu-btn");
const bgMusic = document.getElementById("gameMusic");

const p1NameInput = document.getElementById("p1-name-input");
const p2NameInput = document.getElementById("p2-name-input");
const p2NameBox = document.getElementById("p2-name-box");
const startWithNamesBtn = document.getElementById("start-with-names-btn");

const pauseMenu = document.getElementById("pause-menu");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const pauseMenuBtn = document.getElementById("pause-menu-btn");

// Oyun Ayarları
let isGameRunning = false;
let isTwoPlayerMode = false;
let animationId = null;
let countdownAnimationId = null;
let players = [];

let playerNames = {
    p1: "Oyuncu 1",
    p2: "Oyuncu 2"
};

const lanes = [55, 165, 275, 385];
const colors = ["#ff6600", "#00f3ff", "#ffcc00", "#b700ff"];
const hitLineY = 600;

const keyMap = {
    z: { pIndex: 0, lane: 0 },
    x: { pIndex: 0, lane: 1 },
    c: { pIndex: 0, lane: 2 },
    v: { pIndex: 0, lane: 3 },
    u: { pIndex: 1, lane: 0 },
    ı: { pIndex: 1, lane: 1 },
    i: { pIndex: 1, lane: 1 },
    o: { pIndex: 1, lane: 2 },
    p: { pIndex: 1, lane: 3 }
};

const laneLabelsP1 = ["Z", "X", "C", "V"];
const laneLabelsP2 = ["U", "I", "O", "P"];

const songDatabase = {
    easy: { file: "assets/kolay.wav", bpm: 105, offset: 0.5, speed: 4, bombChance: 0.05 },
    medium: { file: "assets/orta.wav", bpm: 146, offset: 0.5, speed: 6, bombChance: 0.12 },
    hard: { file: "assets/zor.wav", bpm: 170, offset: 0.5, speed: 8, bombChance: 0.20 }
};

let unlockedLevels = { easy: true, medium: false, hard: false };
let currentLevelId = "easy";

let currentBPM = 120;
let currentOffset = 0;
let currentSpeed = 6;
let currentBombChance = 0;
let beatInterval = 0;
let nextBeatIndex = 0;
let fallTime = 0;

const pauseBtn = document.getElementById("pause-btn");
let isPaused = false;

class Player {
    constructor(id, canvasId, scoreId, comboId, healthId, labels) {
        this.id = id;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = 440;
        this.canvas.height = 700;

        this.scoreEl = document.getElementById(scoreId);
        this.comboEl = document.getElementById(comboId);
        this.healthEl = document.getElementById(healthId);

        this.labels = labels;
        this.resetStats();
    }

    resetStats() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = 100;
        this.notes = [];
        this.floatingTexts = [];
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

        this.floatingTexts.push({
            x: rx,
            y: ry,
            text,
            color: colorRGB,
            alpha: 1
        });
    }
}

// Menü
helpBtn.addEventListener("click", () => helpModal.classList.remove("hidden"));
closeHelpBtn.addEventListener("click", () => helpModal.classList.add("hidden"));

singlePlayerBtn.addEventListener("click", () => {
    isTwoPlayerMode = false;

    p2NameBox.classList.add("hidden");

    p1NameInput.value = "";
    p2NameInput.value = "";

    nameModal.classList.remove("hidden");
});

twoPlayerBtn.addEventListener("click", () => {
    isTwoPlayerMode = true;

    p2NameBox.classList.remove("hidden");

    p1NameInput.value = "";
    p2NameInput.value = "";

    nameModal.classList.remove("hidden");
});

startWithNamesBtn.addEventListener("click", () => {
    playerNames.p1 = p1NameInput.value.trim() || "Oyuncu 1";
    playerNames.p2 = p2NameInput.value.trim() || "Oyuncu 2";

    document.querySelector(".side-panel .game-title").innerHTML = `
        <span style="
            color:white;
            text-shadow:
                0 0 8px rgba(255,255,255,0.7),
                0 0 18px rgba(0,243,255,0.9),
                0 0 35px rgba(0,243,255,0.7);
        ">
            ${playerNames.p1}
        </span>
    `;

    document.querySelector("#p2-stats-panel .game-title").innerHTML = `
    <span style="
        display:block;
        text-align:left;
        color:white;
        text-shadow:
            0 0 8px rgba(255,255,255,0.7),
            0 0 18px rgba(255,0,85,0.9),
            0 0 35px rgba(255,0,85,0.7);
    ">
        ${playerNames.p2}
    </span>
`;

    if (isTwoPlayerMode) {
        document.querySelector(".p2-element").classList.remove("hidden");
        document.getElementById("p2-stats-panel").classList.remove("hidden");
        document.getElementById("leaderboard-panel").classList.add("hidden");
    } else {
        document.querySelector(".p2-element").classList.add("hidden");
        document.getElementById("p2-stats-panel").classList.add("hidden");
        document.getElementById("leaderboard-panel").classList.remove("hidden");
    }

    nameModal.classList.add("hidden");
    startScreen.classList.add("hidden");
    songSelectionScreen.classList.remove("hidden");
});

backToMenuBtn.addEventListener("click", () => {
    songSelectionScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
});

document.querySelectorAll(".song-card").forEach(card => {
    card.addEventListener("click", () => {
        const level = card.getAttribute("data-level");
        if (!unlockedLevels[level]) return;

        currentLevelId = level;
        songSelectionScreen.classList.add("hidden");

        const songData = songDatabase[level];

        bgMusic.src = songData.file;
        bgMusic.load();

        currentBPM = songData.bpm;
        currentOffset = songData.offset;
        currentSpeed = songData.speed;
        currentBombChance = songData.bombChance;

        beatInterval = 60 / currentBPM;
        fallTime = (650 / currentSpeed) / 60;

        startGame();
    });
});

function stopAllAnimations() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (countdownAnimationId) {
        cancelAnimationFrame(countdownAnimationId);
        countdownAnimationId = null;
    }
}

function startGame() {
    stopAllAnimations();

    isGameRunning = false;
    isPaused = false;
    pauseBtn.classList.remove("hidden");
    pauseBtn.innerText = "⏸ Duraklat";
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.5;

    players = [
        new Player(1, "gameCanvasP1", "p1-score", "p1-combo", "p1-health", laneLabelsP1)
    ];

    if (isTwoPlayerMode) {
        players.push(
            new Player(2, "gameCanvasP2", "p2-score", "p2-combo", "p2-health", laneLabelsP2)
        );
    }

    nextBeatIndex = 0;

    while (currentOffset + nextBeatIndex * beatInterval - fallTime < 0) {
        nextBeatIndex++;
    }

    startCountdown(() => {
        isGameRunning = true;

        const playPromise = bgMusic.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => console.log("Müzik hatası:", error));
        }

        gameLoop();
    });
}

function startCountdown(callback) {
    const startTime = performance.now();
    const durationPerNumber = 1000;

    function drawCountdownBase(p) {
        p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);

        p.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        p.ctx.fillRect(0, 0, p.canvas.width, p.canvas.height);

        p.ctx.lineWidth = 1;

        for (let i = 1; i < 4; i++) {
            p.ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            p.ctx.beginPath();
            p.ctx.moveTo(i * 110, 0);
            p.ctx.lineTo(i * 110, p.canvas.height);
            p.ctx.stroke();
        }
    }

    function getCountdownMessage(count) {
        if (count === 3) {
            return "HOŞ GELDİN";
        }

        if (count === 2) {
            return isTwoPlayerMode
                ? `${playerNames.p1} vs ${playerNames.p2}`
                : playerNames.p1.toUpperCase();
        }

        return "HAZIR OL!";
    }

    function drawCountdownFrame(now) {
        const elapsed = now - startTime;
        const currentIndex = Math.floor(elapsed / durationPerNumber);
        const progress = (elapsed % durationPerNumber) / durationPerNumber;
        const count = 3 - currentIndex;

        if (count <= 0) {
            countdownAnimationId = null;
            callback();
            return;
        }

        players.forEach(p => {
            drawCountdownBase(p);

            const centerX = p.canvas.width / 2;
            const centerY = p.canvas.height / 2 - 45;

            const scale = 0.55 + Math.sin(progress * Math.PI) * 0.28;
            const alpha = 1 - progress * 0.12;

            p.ctx.save();

            p.ctx.globalAlpha = alpha;
            p.ctx.translate(centerX, centerY);
            p.ctx.scale(scale, scale);

            p.ctx.font = "italic 900 145px Impact";
            p.ctx.textAlign = "center";
            p.ctx.textBaseline = "middle";

            p.ctx.lineWidth = 7;
            p.ctx.strokeStyle = "#ffffff";
            p.ctx.shadowBlur = 32;
            p.ctx.shadowColor = "#b700ff";
            p.ctx.strokeText(count, 0, 0);

            const gradient = p.ctx.createLinearGradient(0, -80, 0, 80);

            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(0.5, "#dca8ff");
            gradient.addColorStop(1, "#8b00ff");

            p.ctx.fillStyle = gradient;
            p.ctx.fillText(count, 0, 0);

            p.ctx.restore();

            p.ctx.save();

            p.ctx.globalAlpha = 0.9;
            p.ctx.font = "italic 900 24px Impact";
            p.ctx.textAlign = "center";
            p.ctx.fillStyle = "#dca8ff";
            p.ctx.shadowBlur = 18;
            p.ctx.shadowColor = "#b700ff";

            p.ctx.fillText(getCountdownMessage(count), centerX, centerY + 115);

            p.ctx.restore();
        });

        countdownAnimationId = requestAnimationFrame(drawCountdownFrame);
    }

    countdownAnimationId = requestAnimationFrame(drawCountdownFrame);
}

function endGame(isSuccess) {
    isGameRunning = false;
    bgMusic.pause();
    stopAllAnimations();

    const endTitle = document.getElementById("end-title");
    const spStats = document.getElementById("sp-end-stats");
    const tpStats = document.getElementById("tp-end-stats");

    if (isTwoPlayerMode) {
        spStats.classList.add("hidden");
        tpStats.classList.remove("hidden");

        document.getElementById("p1-final-score").innerText = players[0].score;
        document.getElementById("p2-final-score").innerText = players[1].score;

        if (players[0].score > players[1].score) {
            endTitle.innerText = `${playerNames.p1} KAZANDI!`;
            endTitle.style.color = "#00f3ff";
        } else if (players[1].score > players[0].score) {
            endTitle.innerText = `${playerNames.p2} KAZANDI!`;
            endTitle.style.color = "#ff0055";
        } else {
            endTitle.innerText = "BERABERE!";
            endTitle.style.color = "#ffcc00";
        }

        nextSongBtn.classList.add("hidden");
    } else {
        spStats.classList.remove("hidden");
        tpStats.classList.add("hidden");

        document.getElementById("final-score").innerText = players[0].score;
        document.getElementById("final-max-combo").innerText = players[0].maxCombo;

        if (isSuccess) {
            endTitle.innerText = "TEBRİKLER! ŞARKIYI BİTİRDİN";
            endTitle.style.color = "#00ff00";

            if (currentLevelId === "easy") {
                unlockedLevels.medium = true;
                document.querySelector(".medium-song").classList.remove("locked");
                nextSongBtn.classList.remove("hidden");
            } else if (currentLevelId === "medium") {
                unlockedLevels.hard = true;
                document.querySelector(".hard-song").classList.remove("locked");
                nextSongBtn.classList.remove("hidden");
            } else {
                nextSongBtn.classList.add("hidden");
            }
        } else {
            endTitle.innerText = "OYUN BİTTİ";
            endTitle.style.color = "#ff0055";
            nextSongBtn.classList.add("hidden");
        }
    }
    pauseBtn.classList.add("hidden");
    isPaused = false;

    gameOverScreen.classList.remove("hidden");
}

retryBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    startGame();
});

menuBtn.addEventListener("click", () => {
    isGameRunning = false;
    isPaused = false;

    bgMusic.pause();
    bgMusic.currentTime = 0;

    stopAllAnimations();

    pauseBtn.classList.add("hidden");

    gameOverScreen.classList.add("hidden");
    songSelectionScreen.classList.remove("hidden");
});

nextSongBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");

    const nextLevel = currentLevelId === "easy" ? "medium" : "hard";

    currentLevelId = nextLevel;

    const songData = songDatabase[nextLevel];

    bgMusic.src = songData.file;
    bgMusic.load();

    currentBPM = songData.bpm;
    currentOffset = songData.offset;
    currentSpeed = songData.speed;
    currentBombChance = songData.bombChance;

    beatInterval = 60 / currentBPM;
    fallTime = (650 / currentSpeed) / 60;

    startGame();
});

function gameLoop() {
    if (!isGameRunning) return;
    if (isPaused) return;

    const targetBeatTime = currentOffset + nextBeatIndex * beatInterval;
    const spawnTime = targetBeatTime - fallTime;

    if (bgMusic.currentTime >= spawnTime && bgMusic.currentTime > 0) {
        const randomLane = Math.floor(Math.random() * 4);
        const isBomb = Math.random() < currentBombChance;

        const noteData = {
            x: lanes[randomLane],
            y: -50,
            color: isBomb ? "#ff003c" : colors[randomLane],
            lane: randomLane,
            isMissed: false,
            type: isBomb ? "bomb" : "normal"
        };

        players.forEach(p => p.notes.push({ ...noteData }));
        nextBeatIndex++;
    }

    players.forEach(p => {
        if (p.isDead) {
            p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
            p.ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
            p.ctx.font = "italic 900 60px Impact";
            p.ctx.textAlign = "center";
            p.ctx.fillText("ELENDİN", p.canvas.width / 2, p.canvas.height / 2);
            return;
        }

        p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);

        p.ctx.lineWidth = 1;

        for (let i = 1; i < 4; i++) {
            p.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            p.ctx.beginPath();
            p.ctx.moveTo(i * 110, 0);
            p.ctx.lineTo(i * 110, p.canvas.height);
            p.ctx.stroke();
        }

        p.ctx.shadowBlur = 20;
        p.ctx.shadowColor = "#ffffff";
        p.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        p.ctx.fillRect(0, hitLineY - 5, p.canvas.width, 10);
        p.ctx.shadowBlur = 0;

        for (let i = 0; i < 4; i++) {
            p.ctx.beginPath();
            p.ctx.arc(lanes[i], hitLineY, 25, 0, Math.PI * 2);

            if (p.keysPressed[i]) {
                p.ctx.fillStyle = colors[i];
                p.ctx.shadowBlur = 30;
                p.ctx.shadowColor = colors[i];
                p.ctx.fill();
            } else {
                p.ctx.strokeStyle = colors[i];
                p.ctx.lineWidth = 4;
                p.ctx.shadowBlur = 15;
                p.ctx.shadowColor = colors[i];
                p.ctx.stroke();
            }

            p.ctx.shadowBlur = 0;
            p.ctx.closePath();

            p.ctx.fillStyle = "white";
            p.ctx.font = "bold 20px Arial";
            p.ctx.textAlign = "center";
            p.ctx.textBaseline = "middle";
            p.ctx.fillText(p.labels[i], lanes[i], hitLineY);
        }

        for (let i = 0; i < p.notes.length; i++) {
            const note = p.notes[i];

            note.y += currentSpeed;

            if (note.type === "normal" && note.y > hitLineY + 40 && !note.isMissed) {
                note.isMissed = true;
                note.color = "#ff3333";
                p.combo = 0;
                p.health -= 10;
                p.updateUI();
                p.createFloatingText("-10", "255, 51, 51");

                if (p.health <= 0) p.isDead = true;
            }

            let drawX = note.x;

            if (note.type === "normal") {
                if (note.isMissed) {
                    drawX += (Math.random() - 0.5) * 10;
                    p.ctx.shadowBlur = 20;
                    p.ctx.shadowColor = "#ff0000";
                } else {
                    p.ctx.shadowBlur = 15;
                    p.ctx.shadowColor = note.color;
                }

                p.ctx.beginPath();
                p.ctx.arc(drawX, note.y, 20, 0, Math.PI * 2);
                p.ctx.fillStyle = "rgba(0,0,0,0.8)";
                p.ctx.fill();

                p.ctx.strokeStyle = note.color;
                p.ctx.lineWidth = 5;
                p.ctx.stroke();

                p.ctx.beginPath();
                p.ctx.arc(drawX, note.y, 8, 0, Math.PI * 2);
                p.ctx.fillStyle = note.color;
                p.ctx.fill();
            } else {
                p.ctx.shadowBlur = 15;
                p.ctx.shadowColor = "#ff0000";

                p.ctx.beginPath();
                p.ctx.arc(drawX, note.y, 20, 0, Math.PI * 2);
                p.ctx.fillStyle = "#111";
                p.ctx.fill();

                p.ctx.strokeStyle = "#ff003c";
                p.ctx.lineWidth = 4;
                p.ctx.stroke();

                p.ctx.fillStyle = "#ff003c";
                p.ctx.font = "bold 22px Arial";
                p.ctx.textAlign = "center";
                p.ctx.textBaseline = "middle";
                p.ctx.fillText("X", drawX, note.y);
            }

            p.ctx.shadowBlur = 0;

            if (note.y > p.canvas.height + 50) {
                p.notes.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < p.floatingTexts.length; i++) {
            const ft = p.floatingTexts[i];

            ft.y -= 2;
            ft.alpha -= 0.02;

            p.ctx.fillStyle = `rgba(${ft.color}, ${ft.alpha})`;
            p.ctx.font = "italic 900 45px Impact, sans-serif";
            p.ctx.textAlign = "center";
            p.ctx.shadowBlur = 15;
            p.ctx.shadowColor = `rgba(${ft.color}, ${ft.alpha})`;
            p.ctx.fillText(ft.text, ft.x, ft.y);

            p.ctx.lineWidth = 2;
            p.ctx.strokeStyle = `rgba(0, 0, 0, ${ft.alpha})`;
            p.ctx.strokeText(ft.text, ft.x, ft.y);
            p.ctx.shadowBlur = 0;

            if (ft.alpha <= 0) {
                p.floatingTexts.splice(i, 1);
                i--;
            }
        }
    });

    if (players.every(p => p.isDead)) {
        endGame(false);
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", event => {
    if (!isGameRunning) return;

    const mapping = keyMap[event.key.toLowerCase()];

    if (!mapping) return;
    if (!isTwoPlayerMode && mapping.pIndex === 1) return;

    const p = players[mapping.pIndex];

    if (!p || p.isDead) return;

    p.keysPressed[mapping.lane] = true;

    for (let i = 0; i < p.notes.length; i++) {
        const note = p.notes[i];

        if (note.lane === mapping.lane && !note.isMissed) {
            const distance = Math.abs(note.y - hitLineY);

            if (distance < 50) {
                if (note.type === "normal") {
                    p.combo++;

                    if (p.combo > p.maxCombo) {
                        p.maxCombo = p.combo;
                    }

                    p.score += 100 * p.combo;
                    p.updateUI();
                } else {
                    p.health -= 20;
                    p.combo = 0;
                    p.updateUI();

                    p.canvas.classList.remove("shake-effect");
                    void p.canvas.offsetWidth;
                    p.canvas.classList.add("shake-effect");

                    p.createFloatingText("-20", "255, 0, 60");

                    if (p.health <= 0) {
                        p.isDead = true;
                    }
                }

                p.notes.splice(i, 1);
                break;
            }
        }
    }
});

document.addEventListener("keyup", event => {
    const mapping = keyMap[event.key.toLowerCase()];

    if (!mapping) return;
    if (!isTwoPlayerMode && mapping.pIndex === 1) return;

    const p = players[mapping.pIndex];

    if (!p || p.isDead) return;

    p.keysPressed[mapping.lane] = false;
});

bgMusic.addEventListener("ended", () => {
    if (isGameRunning) {
        endGame(true);
    }
});

pauseBtn.addEventListener("click", () => {
    if (!isGameRunning) return;

    isPaused = true;
    bgMusic.pause();
    cancelAnimationFrame(animationId);

    pauseBtn.classList.add("hidden");
    pauseMenu.classList.remove("hidden");
});
resumeBtn.addEventListener("click", () => {
    if (!isGameRunning) return;

    isPaused = false;
    pauseMenu.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    pauseBtn.innerText = "⏸ Duraklat";

    bgMusic.play();
    gameLoop();
});

restartBtn.addEventListener("click", () => {
    pauseMenu.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    startGame();
});

pauseMenuBtn.addEventListener("click", () => {
    isGameRunning = false;
    isPaused = false;

    bgMusic.pause();
    bgMusic.currentTime = 0;
    stopAllAnimations();

    pauseMenu.classList.add("hidden");
    pauseBtn.classList.add("hidden");
    songSelectionScreen.classList.remove("hidden");
});