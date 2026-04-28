(function () {
  "use strict";

  const STORAGE = {
    settings: "sudofy.settings.v1",
    stats: "sudofy.stats.v1",
    game: "sudofy.currentGame.v1"
  };

  const DIFFICULTIES = {
    easy: {
      label: "Easy",
      clues: 46,
      hints: 6,
      undoLimit: 70,
      mistakeLimit: 5,
      mistakePenalty: 5,
      hintPenalty: 10,
      checking: "strict",
      notesAssist: "full",
      targetTime: 480,
      xp: 90,
      coins: 24
    },
    medium: {
      label: "Medium",
      clues: 38,
      hints: 4,
      undoLimit: 55,
      mistakeLimit: 4,
      mistakePenalty: 8,
      hintPenalty: 15,
      checking: "strict",
      notesAssist: "basic",
      targetTime: 720,
      xp: 125,
      coins: 34
    },
    hard: {
      label: "Hard",
      clues: 31,
      hints: 3,
      undoLimit: 38,
      mistakeLimit: 3,
      mistakePenalty: 12,
      hintPenalty: 22,
      checking: "conflict",
      notesAssist: "light",
      targetTime: 1080,
      xp: 170,
      coins: 46
    },
    expert: {
      label: "Expert",
      clues: 26,
      hints: 2,
      undoLimit: 24,
      mistakeLimit: 2,
      mistakePenalty: 18,
      hintPenalty: 30,
      checking: "final",
      notesAssist: "off",
      targetTime: 1500,
      xp: 235,
      coins: 68
    }
  };

  const MODES = {
    classic: { label: "Classic", subtitle: "Balanced rules" },
    journey: { label: "Journey", subtitle: "Progressive path" },
    daily: { label: "Daily", subtitle: "Offline challenge" },
    zen: { label: "Zen", subtitle: "Relaxed play" },
    speed: { label: "Speed Run", subtitle: "Beat the clock" },
    survival: { label: "Survival", subtitle: "Few mistakes" },
    hardcore: { label: "Hardcore", subtitle: "No assists" },
    custom: { label: "Custom", subtitle: "Tuned rules" }
  };

  const PRELOADED_PUZZLES = [
    {
      puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
      solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    },
    {
      puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
      solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259"
    }
  ];

  const SHOP_ITEMS = [
    { id: "royal", name: "Royal Gold", cost: 0, a: "#ffd36c", b: "#68e8d2", text: "Default polished board finish." },
    { id: "jade", name: "Jade Focus", cost: 240, a: "#62e6a8", b: "#3bd6c9", text: "Cool green focus palette." },
    { id: "ember", name: "Ember Luxe", cost: 320, a: "#ffb15c", b: "#ff6d73", text: "Warm cinematic board lights." },
    { id: "violet", name: "Violet Prism", cost: 420, a: "#c4a2ff", b: "#65e4d6", text: "High-energy trophy skin." },
    { id: "mono", name: "Clarity Pro", cost: 0, a: "#ffffff", b: "#9ee9ff", text: "Achievement-only accessibility skin.", achievementOnly: true }
  ];

  const DEFAULT_SETTINGS = {
    theme: "dark",
    skin: "royal",
    sound: true,
    vibration: false,
    leftHand: false,
    accessibility: false,
    batterySaver: false,
    selectedMode: "classic",
    selectedDifficulty: "easy",
    custom: {
      clues: 36,
      hints: 4,
      mistakes: 4,
      undo: 45
    }
  };

  const DEFAULT_STATS = {
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    bestTime: null,
    bestTimeByDifficulty: { easy: null, medium: null, hard: null, expert: null },
    solveTimes: [],
    hintsUsed: 0,
    mistakesMade: 0,
    longestStreak: 0,
    currentStreak: 0,
    fastestNoHint: null,
    perfectGames: 0,
    dailyChallengeWins: 0,
    totalPlayTime: 0,
    xp: 0,
    coins: 160,
    themeTokens: 0,
    difficultyPlayed: { easy: 0, medium: 0, hard: 0, expert: 0 },
    difficultyWins: { easy: 0, medium: 0, hard: 0, expert: 0 },
    history: [],
    streakHistory: [],
    bestTimeProgress: [],
    unlockedSkins: ["royal"],
    claimedAchievements: [],
    dailyWins: {},
    lastDailyReward: null,
    dailyRewardStreak: 0,
    lastSpinDate: null,
    spinUsesToday: 0,
    journeyLevel: 1
  };

  const ACHIEVEMENTS = [
    { id: "first_win", title: "First Crown", desc: "Win your first Sudoku.", reward: { coins: 60, xp: 80 }, condition: s => s.totalWins >= 1 },
    { id: "perfect_focus", title: "Perfect Focus", desc: "Finish without mistakes.", reward: { coins: 90, xp: 120 }, condition: s => s.perfectGames >= 1 },
    { id: "no_hint", title: "Pure Logic", desc: "Record a no-hint solve.", reward: { coins: 90, xp: 110 }, condition: s => s.fastestNoHint !== null },
    { id: "speed_runner", title: "Speed Runner", desc: "Win a Speed Run puzzle.", reward: { coins: 110, xp: 150 }, condition: s => s.history.some(h => h.win && h.mode === "speed") },
    { id: "daily_devotee", title: "Daily Devotee", desc: "Win three daily challenges.", reward: { coins: 160, xp: 180 }, condition: s => s.dailyChallengeWins >= 3 },
    { id: "streak_master", title: "Streak Master", desc: "Reach a five-win streak.", reward: { coins: 180, xp: 220 }, condition: s => s.longestStreak >= 5 },
    { id: "expert_crown", title: "Expert Crown", desc: "Win on Expert difficulty.", reward: { coins: 220, xp: 280 }, condition: s => s.difficultyWins.expert >= 1 },
    { id: "journey_climber", title: "Journey Climber", desc: "Reach Journey level ten.", reward: { coins: 240, xp: 280 }, condition: s => s.journeyLevel >= 10 },
    { id: "hardcore_clear", title: "Hardcore Clear", desc: "Win in Hardcore mode.", reward: { coins: 260, xp: 340, skin: "mono" }, condition: s => s.history.some(h => h.win && h.mode === "hardcore") },
    { id: "collector", title: "Collector", desc: "Unlock three board skins.", reward: { coins: 300, xp: 360 }, condition: s => s.unlockedSkins.length >= 3 },
    { id: "survivalist", title: "Survivalist", desc: "Win a Survival puzzle.", reward: { coins: 140, xp: 180 }, condition: s => s.history.some(h => h.win && h.mode === "survival") },
    { id: "veteran", title: "Veteran Solver", desc: "Play twenty games.", reward: { coins: 260, xp: 420 }, condition: s => s.totalGamesPlayed >= 20 }
  ];

  const RANK_TITLES = [
    "Novice", "Apprentice", "Solver", "Strategist", "Sage", "Master",
    "Grandmaster", "Oracle", "Legend", "Mythic"
  ];

  const UNITS = buildUnits();
  const PEERS = buildPeers();

  let settings = mergeDefaults(DEFAULT_SETTINGS, readJson(STORAGE.settings, {}));
  let stats = mergeDefaults(DEFAULT_STATS, readJson(STORAGE.stats, {}));
  let selectedMode = settings.selectedMode;
  let selectedDifficulty = settings.selectedDifficulty;
  let game = null;
  let currentScreen = "home";
  let timerId = null;
  let lastSaveAt = 0;
  let audioContext = null;

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    game = loadSavedGame();
    if (game && !game.completed && !game.lost) {
      game.paused = true;
      game.pauseReason = "Saved puzzle ready";
    }
    applySettings();
    bindEvents();
    renderEverything();
    renderGame();
  }

  function cacheDom() {
    dom.root = document.documentElement;
    dom.body = document.body;
    dom.screens = Array.from(document.querySelectorAll(".screen"));
    dom.navButtons = Array.from(document.querySelectorAll("[data-nav]"));
    dom.bottomNavButtons = Array.from(document.querySelectorAll(".bottom-nav button"));
    dom.coinPill = document.getElementById("coinPill");
    dom.rankPill = document.getElementById("rankPill");
    dom.themeToggle = document.getElementById("themeToggle");
    dom.startGameBtn = document.getElementById("startGameBtn");
    dom.resumeGameBtn = document.getElementById("resumeGameBtn");
    dom.modeGrid = document.getElementById("modeGrid");
    dom.difficultyGrid = document.getElementById("difficultyGrid");
    dom.customPanel = document.getElementById("customPanel");
    dom.customClues = document.getElementById("customClues");
    dom.customHints = document.getElementById("customHints");
    dom.customMistakes = document.getElementById("customMistakes");
    dom.customUndo = document.getElementById("customUndo");
    dom.dailyStatus = document.getElementById("dailyStatus");
    dom.dailyRewardBtn = document.getElementById("dailyRewardBtn");
    dom.rewardTitle = document.getElementById("rewardTitle");
    dom.rewardCopy = document.getElementById("rewardCopy");
    dom.openSpinBtn = document.getElementById("openSpinBtn");
    dom.rankRing = document.getElementById("rankRing");
    dom.rankLevel = document.getElementById("rankLevel");
    dom.rankTitle = document.getElementById("rankTitle");
    dom.rankProgressText = document.getElementById("rankProgressText");
    dom.rankMeter = document.getElementById("rankMeter");
    dom.gameModeTitle = document.getElementById("gameModeTitle");
    dom.ruleList = document.getElementById("ruleList");
    dom.sudokuBoard = document.getElementById("sudokuBoard");
    dom.numberPad = document.getElementById("numberPad");
    dom.timerText = document.getElementById("timerText");
    dom.gameSubline = document.getElementById("gameSubline");
    dom.pauseBtn = document.getElementById("pauseBtn");
    dom.backHomeBtn = document.getElementById("backHomeBtn");
    dom.undoBtn = document.getElementById("undoBtn");
    dom.redoBtn = document.getElementById("redoBtn");
    dom.noteBtn = document.getElementById("noteBtn");
    dom.eraserBtn = document.getElementById("eraserBtn");
    dom.hintBtn = document.getElementById("hintBtn");
    dom.undoLeft = document.getElementById("undoLeft");
    dom.hintLeft = document.getElementById("hintLeft");
    dom.mistakeText = document.getElementById("mistakeText");
    dom.hintText = document.getElementById("hintText");
    dom.streakText = document.getElementById("streakText");
    dom.completionList = document.getElementById("completionList");
    dom.toastLayer = document.getElementById("toastLayer");
    dom.modalLayer = document.getElementById("modalLayer");
    dom.winRatePill = document.getElementById("winRatePill");
    dom.statGames = document.getElementById("statGames");
    dom.statWins = document.getElementById("statWins");
    dom.statBest = document.getElementById("statBest");
    dom.statAvg = document.getElementById("statAvg");
    dom.statNoHint = document.getElementById("statNoHint");
    dom.statPerfect = document.getElementById("statPerfect");
    dom.statDaily = document.getElementById("statDaily");
    dom.statPlayTime = document.getElementById("statPlayTime");
    dom.weeklyChart = document.getElementById("weeklyChart");
    dom.monthlyChart = document.getElementById("monthlyChart");
    dom.difficultyChart = document.getElementById("difficultyChart");
    dom.bestTimeChart = document.getElementById("bestTimeChart");
    dom.ratioDonut = document.getElementById("ratioDonut");
    dom.ratioLabel = document.getElementById("ratioLabel");
    dom.streakChart = document.getElementById("streakChart");
    dom.achievementGrid = document.getElementById("achievementGrid");
    dom.trophyPill = document.getElementById("trophyPill");
    dom.shopGrid = document.getElementById("shopGrid");
    dom.shopCoinPill = document.getElementById("shopCoinPill");
    dom.spinWheel = document.getElementById("spinWheel");
    dom.spinBtn = document.getElementById("spinBtn");
    dom.spinStatus = document.getElementById("spinStatus");
    dom.resetBtn = document.getElementById("resetBtn");
  }

  function bindEvents() {
    dom.navButtons.forEach(button => {
      button.addEventListener("click", () => goToScreen(button.dataset.nav));
    });

    dom.themeToggle.addEventListener("click", () => {
      settings.theme = settings.theme === "dark" ? "light" : "dark";
      saveSettings();
      applySettings();
      renderSettings();
      playTone("tap");
    });

    dom.startGameBtn.addEventListener("click", () => beginNewGame(selectedMode, selectedDifficulty));
    dom.resumeGameBtn.addEventListener("click", resumeSavedGame);
    dom.openSpinBtn.addEventListener("click", () => goToScreen("shop"));
    dom.dailyRewardBtn.addEventListener("click", claimDailyReward);
    dom.spinBtn.addEventListener("click", spinLuckyWheel);
    dom.backHomeBtn.addEventListener("click", () => goToScreen("home"));
    dom.pauseBtn.addEventListener("click", () => pauseGame("Manual pause", true));
    dom.undoBtn.addEventListener("click", undoMove);
    dom.redoBtn.addEventListener("click", redoMove);
    dom.noteBtn.addEventListener("click", toggleNotesMode);
    dom.eraserBtn.addEventListener("click", toggleEraserMode);
    dom.hintBtn.addEventListener("click", useHint);
    dom.resetBtn.addEventListener("click", showResetModal);

    dom.modeGrid.addEventListener("click", event => {
      const card = event.target.closest("[data-mode]");
      if (!card) return;
      selectedMode = card.dataset.mode;
      settings.selectedMode = selectedMode;
      saveSettings();
      renderHome();
      playTone("tap");
    });

    dom.difficultyGrid.addEventListener("click", event => {
      const card = event.target.closest("[data-difficulty]");
      if (!card) return;
      selectedDifficulty = card.dataset.difficulty;
      settings.selectedDifficulty = selectedDifficulty;
      saveSettings();
      renderHome();
      playTone("tap");
    });

    [dom.customClues, dom.customHints, dom.customMistakes, dom.customUndo].forEach(input => {
      input.addEventListener("input", () => {
        settings.custom = {
          clues: Number(dom.customClues.value),
          hints: Number(dom.customHints.value),
          mistakes: Number(dom.customMistakes.value),
          undo: Number(dom.customUndo.value)
        };
        saveSettings();
      });
    });

    dom.sudokuBoard.addEventListener("click", event => {
      const cell = event.target.closest(".cell");
      if (!cell) return;
      selectCell(Number(cell.dataset.index));
    });

    dom.numberPad.addEventListener("click", event => {
      const key = event.target.closest("[data-number]");
      if (!key) return;
      inputNumber(Number(key.dataset.number));
    });

    dom.modalLayer.addEventListener("click", event => {
      const action = event.target.closest("[data-modal-action]");
      if (!action) return;
      handleModalAction(action.dataset.modalAction);
    });

    document.querySelectorAll("[data-setting]").forEach(input => {
      input.addEventListener("change", () => updateSetting(input.dataset.setting, input.checked));
    });

    document.addEventListener("keydown", handleKeyboard);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (game && !game.completed && !game.lost && !game.paused) {
          pauseGame("Paused while inactive", false);
        }
      } else if (game && game.paused && currentScreen === "game") {
        showPauseModal(game.pauseReason || "Paused while inactive");
      }
    });

    window.addEventListener("beforeunload", () => {
      if (game && !game.completed && !game.lost) {
        tickTimer();
        saveCurrentGame();
      }
    });
  }

  function renderEverything() {
    renderHome();
    renderStats();
    renderAchievements();
    renderShop();
    renderSettings();
    updateTopStatus();
  }

  function goToScreen(screen) {
    if (screen === "game" && !game) {
      toast("Start a puzzle or resume a saved game first.");
      screen = "home";
    }

    if (game && !game.completed && !game.lost && screen !== "game" && !game.paused) {
      pauseGame("Paused from navigation", false);
    }

    currentScreen = screen;
    dom.screens.forEach(section => {
      section.classList.toggle("active", section.dataset.screen === screen);
    });
    dom.bottomNavButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.nav === screen);
    });

    if (screen === "game") {
      renderGame();
      if (game && game.paused) {
        showPauseModal(game.pauseReason || "Paused");
      } else {
        startTimer();
      }
    } else {
      stopTimer();
      closeModal();
    }

    if (screen === "stats") renderStats();
    if (screen === "trophies") renderAchievements();
    if (screen === "shop") renderShop();
    if (screen === "settings") renderSettings();
  }

  function beginNewGame(mode, difficulty) {
    closeModal();
    stopTimer();
    selectedMode = mode;
    selectedDifficulty = difficulty;
    settings.selectedMode = mode;
    settings.selectedDifficulty = difficulty;
    saveSettings();

    const built = createPuzzle(mode, difficulty);
    const rules = buildRules(mode, difficulty);
    game = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      mode,
      difficulty,
      rules,
      seed: built.seed,
      dateKey: localDateKey(),
      puzzle: built.puzzle,
      solution: built.solution,
      board: built.puzzle.slice(),
      locked: built.puzzle.map(Boolean),
      notes: Array.from({ length: 81 }, () => []),
      selected: built.puzzle.findIndex(value => value === 0),
      notesMode: false,
      eraserMode: false,
      mistakes: 0,
      hints: 0,
      elapsed: 0,
      undo: [],
      redo: [],
      undoUses: 0,
      paused: false,
      pauseReason: "",
      completed: false,
      lost: false,
      countedPlayed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastTick: Date.now()
    };

    stats.totalGamesPlayed += 1;
    stats.difficultyPlayed[difficulty] = (stats.difficultyPlayed[difficulty] || 0) + 1;
    trimStats();
    saveStats();
    saveCurrentGame();
    goToScreen("game");
    startTimer();
    toast(`${MODES[mode].label} ${DIFFICULTIES[difficulty].label} started.`);
    playTone("start");
  }

  function resumeSavedGame() {
    if (!game || game.completed || game.lost) {
      toast("No saved puzzle is waiting.");
      return;
    }
    game.paused = false;
    game.pauseReason = "";
    game.lastTick = Date.now();
    saveCurrentGame();
    goToScreen("game");
    startTimer();
    toast("Puzzle resumed.");
  }

  function createPuzzle(mode, difficulty) {
    const rules = buildRules(mode, difficulty);
    const seed = getPuzzleSeed(mode, difficulty);
    const rng = seededRandom(seed);
    let pair;

    if (PRELOADED_PUZZLES.length && rng() > 0.18) {
      const base = PRELOADED_PUZZLES[Math.floor(rng() * PRELOADED_PUZZLES.length)];
      pair = transformPuzzlePair(base, rng);
      pair.puzzle = tunePuzzleClues(pair.puzzle, pair.solution, rules.clues, rng);
    } else {
      const solution = generateSolvedGrid(rng).join("");
      pair = {
        solution,
        puzzle: carvePuzzle(solution, rules.clues, rng)
      };
    }

    return {
      seed,
      puzzle: toGridArray(pair.puzzle),
      solution: toGridArray(pair.solution)
    };
  }

  function getPuzzleSeed(mode, difficulty) {
    if (mode === "daily") return `daily:${localDateKey()}:${difficulty}`;
    if (mode === "journey") return `journey:${stats.journeyLevel}:${difficulty}:${Date.now()}`;
    return `${mode}:${difficulty}:${Date.now()}:${Math.random()}`;
  }

  function buildRules(mode, difficulty) {
    const base = { ...DIFFICULTIES[difficulty] };
    const rules = {
      ...base,
      mode,
      difficulty,
      allowNotes: true,
      speedLimit: null
    };

    if (mode === "journey") {
      const extraDepth = Math.min(7, Math.floor(stats.journeyLevel / 3));
      rules.clues = clamp(rules.clues - extraDepth, 24, 52);
      rules.xp += 20 + stats.journeyLevel * 2;
      rules.coins += 8;
    }

    if (mode === "daily") {
      rules.xp += 35;
      rules.coins += 18;
      rules.hints = Math.max(1, rules.hints - 1);
    }

    if (mode === "zen") {
      rules.mistakeLimit = null;
      rules.hints += 2;
      rules.undoLimit += 25;
      rules.mistakePenalty = 0;
      rules.hintPenalty = 0;
      rules.targetTime += 420;
      rules.xp = Math.round(rules.xp * .78);
    }

    if (mode === "speed") {
      rules.speedLimit = Math.round(rules.targetTime * .62);
      rules.mistakePenalty += 18;
      rules.hintPenalty += 22;
      rules.xp += 55;
      rules.coins += 16;
      rules.hints = Math.max(1, rules.hints - 1);
    }

    if (mode === "survival") {
      rules.mistakeLimit = Math.min(rules.mistakeLimit || 3, 2);
      rules.hints = Math.max(1, rules.hints - 1);
      rules.undoLimit = Math.max(8, rules.undoLimit - 22);
      rules.xp += 45;
      rules.coins += 18;
    }

    if (mode === "hardcore") {
      rules.clues = clamp(rules.clues - 2, 24, 48);
      rules.hints = 0;
      rules.undoLimit = 0;
      rules.mistakeLimit = 1;
      rules.checking = "final";
      rules.notesAssist = "off";
      rules.allowNotes = false;
      rules.xp += 95;
      rules.coins += 34;
    }

    if (mode === "custom") {
      rules.clues = clamp(settings.custom.clues, 24, 52);
      rules.hints = clamp(settings.custom.hints, 0, 9);
      rules.mistakeLimit = clamp(settings.custom.mistakes, 1, 9);
      rules.undoLimit = clamp(settings.custom.undo, 0, 90);
      rules.checking = "strict";
      rules.notesAssist = "basic";
      rules.xp = 110 + (52 - rules.clues) * 4;
      rules.coins = 30 + Math.floor((52 - rules.clues) * 1.6);
    }

    rules.clues = clamp(rules.clues, 24, 56);
    rules.hints = clamp(rules.hints, 0, 9);
    rules.undoLimit = clamp(rules.undoLimit, 0, 99);
    return rules;
  }

  function selectCell(index) {
    if (!game) return;
    game.selected = index;
    renderBoard();
    renderKeypad();
    playTone("tap");
  }

  function inputNumber(number) {
    if (!canInteract()) return;
    if (game.selected === null || game.selected === undefined) {
      toast("Select a cell first.");
      return;
    }
    const index = game.selected;
    if (game.locked[index]) {
      toast("Original cells are locked.");
      buzz(18);
      return;
    }

    if (game.eraserMode) {
      eraseCell(index);
      return;
    }

    if (game.notesMode) {
      toggleNote(index, number);
      return;
    }

    setCellValue(index, number, { source: "input" });
  }

  function setCellValue(index, value, options = {}) {
    if (!game || game.locked[index]) return;
    const previousValue = game.board[index];
    const previousNotes = game.notes[index].slice();
    if (previousValue === value && previousNotes.length === 0) return;

    pushMove({
      type: "cell",
      index,
      prevValue: previousValue,
      nextValue: value,
      prevNotes: previousNotes,
      nextNotes: []
    });

    game.board[index] = value;
    game.notes[index] = [];

    if (value === game.solution[index]) {
      applyNotesAssist(index, value);
      playTone(options.source === "hint" ? "hint" : "correct");
    } else if (shouldCountMistake(index, value)) {
      registerMistake(index);
    } else {
      playTone("tap");
    }

    if (options.source === "hint") {
      game.hints += 1;
      stats.hintsUsed += 1;
      addPenalty(game.rules.hintPenalty);
    }

    afterBoardChange();
  }

  function toggleNote(index, number) {
    if (!game || !game.rules.allowNotes) {
      toast("Notes are disabled in this mode.");
      return;
    }
    if (game.locked[index] || game.board[index]) return;

    if (game.rules.notesAssist === "full" && !isVisibleCandidate(index, number)) {
      toast("That note conflicts with the visible board.");
      buzz(16);
      return;
    }

    const previousNotes = game.notes[index].slice();
    const next = previousNotes.includes(number)
      ? previousNotes.filter(value => value !== number)
      : previousNotes.concat(number).sort((a, b) => a - b);

    pushMove({
      type: "note",
      index,
      prevValue: 0,
      nextValue: 0,
      prevNotes: previousNotes,
      nextNotes: next
    });

    game.notes[index] = next;
    playTone("note");
    afterBoardChange(false);
  }

  function eraseCell(index) {
    if (!game || game.locked[index]) return;
    const previousValue = game.board[index];
    const previousNotes = game.notes[index].slice();
    if (!previousValue && previousNotes.length === 0) return;

    pushMove({
      type: "erase",
      index,
      prevValue: previousValue,
      nextValue: 0,
      prevNotes: previousNotes,
      nextNotes: []
    });

    game.board[index] = 0;
    game.notes[index] = [];
    playTone("erase");
    afterBoardChange(false);
  }

  function pushMove(move) {
    if (!game) return;
    game.undo.push(move);
    if (game.undo.length > 120) game.undo.shift();
    game.redo = [];
  }

  function undoMove() {
    if (!canInteract()) return;
    if (game.rules.undoLimit <= 0) {
      toast("Undo is disabled in this mode.");
      return;
    }
    if (game.undoUses >= game.rules.undoLimit) {
      toast("Undo limit reached.");
      return;
    }
    const move = game.undo.pop();
    if (!move) {
      toast("Nothing to undo.");
      return;
    }
    applyMove(move, "prev");
    game.redo.push(move);
    game.undoUses += 1;
    playTone("tap");
    afterBoardChange(false);
  }

  function redoMove() {
    if (!canInteract()) return;
    const move = game.redo.pop();
    if (!move) {
      toast("Nothing to redo.");
      return;
    }
    applyMove(move, "next");
    game.undo.push(move);
    playTone("tap");
    afterBoardChange(false);
  }

  function applyMove(move, direction) {
    const valueKey = direction === "prev" ? "prevValue" : "nextValue";
    const notesKey = direction === "prev" ? "prevNotes" : "nextNotes";
    game.board[move.index] = move[valueKey];
    game.notes[move.index] = move[notesKey].slice();
    game.selected = move.index;
  }

  function toggleNotesMode() {
    if (!canInteract()) return;
    if (!game.rules.allowNotes) {
      toast("Notes are disabled in Hardcore.");
      return;
    }
    game.notesMode = !game.notesMode;
    if (game.notesMode) game.eraserMode = false;
    renderGameControls();
    playTone("tap");
  }

  function toggleEraserMode() {
    if (!canInteract()) return;
    game.eraserMode = !game.eraserMode;
    if (game.eraserMode) game.notesMode = false;
    renderGameControls();
    playTone("tap");
  }

  function useHint() {
    if (!canInteract()) return;
    if (game.hints >= game.rules.hints) {
      toast("No hints left.");
      buzz(24);
      return;
    }

    let index = game.selected;
    const selectedCanUse = index !== null &&
      !game.locked[index] &&
      game.board[index] !== game.solution[index];

    if (!selectedCanUse) {
      index = game.board.findIndex((value, i) => !game.locked[i] && value !== game.solution[i]);
    }

    if (index < 0) {
      toast("The board is already solved.");
      return;
    }

    setCellValue(index, game.solution[index], { source: "hint" });
    game.selected = index;
    toast(`Hint placed at row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}.`);
  }

  function afterBoardChange(checkWin = true) {
    if (!game) return;
    game.updatedAt = Date.now();
    renderGame();
    saveCurrentGameDebounced();
    if (checkWin) checkCompletion();
  }

  function shouldCountMistake(index, value) {
    if (!value) return false;
    if (game.rules.checking === "strict") return value !== game.solution[index];
    if (game.rules.checking === "conflict") return hasVisibleConflict(index, value);
    return false;
  }

  function registerMistake(index) {
    game.mistakes += 1;
    stats.mistakesMade += 1;
    addPenalty(game.rules.mistakePenalty);
    saveStats();
    buzz(34);
    playTone("mistake");

    const limit = game.rules.mistakeLimit;
    if (limit && game.mistakes >= limit) {
      renderGame();
      finishGame(false, "Mistake limit reached");
    } else {
      toast(`Mistake penalty: +${game.rules.mistakePenalty}s`);
    }
  }

  function addPenalty(seconds) {
    if (!seconds || !game) return;
    game.elapsed += seconds;
    renderTimer();
  }

  function checkCompletion() {
    if (!game || game.completed || game.lost) return;
    const filled = game.board.every(Boolean);
    const solved = game.board.every((value, index) => value === game.solution[index]);
    if (solved) {
      finishGame(true, "Solved");
      return;
    }

    if (filled && !solved) {
      if (game.rules.checking === "final") {
        registerMistake(game.board.findIndex((value, index) => value !== game.solution[index]));
      }
      toast("The board is full, but at least one cell is off.");
    }
  }

  function finishGame(won, reason) {
    if (!game || game.completed || game.lost || game.finishing) return;
    game.finishing = true;
    syncElapsed();
    stopTimer();

    if (won) {
      game.completed = true;
    } else {
      game.lost = true;
    }

    const stars = won ? computeStars() : 0;
    const streakBefore = stats.currentStreak;
    const streakAfter = won ? streakBefore + 1 : 0;
    const streakBonus = won ? Math.min(80, streakAfter * 8) : 0;
    const xpEarned = won ? game.rules.xp + stars * 25 + streakBonus : Math.round(game.rules.xp * .12);
    const coinsEarned = won ? game.rules.coins + stars * 9 + Math.floor(streakBonus / 3) : 4;

    stats.totalPlayTime += game.elapsed;

    if (won) {
      stats.totalWins += 1;
      stats.difficultyWins[game.difficulty] = (stats.difficultyWins[game.difficulty] || 0) + 1;
      stats.solveTimes.push(game.elapsed);
      stats.bestTime = bestValue(stats.bestTime, game.elapsed);
      stats.bestTimeByDifficulty[game.difficulty] = bestValue(stats.bestTimeByDifficulty[game.difficulty], game.elapsed);
      stats.currentStreak = streakAfter;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      stats.coins += coinsEarned;
      stats.xp += xpEarned;

      if (game.hints === 0) stats.fastestNoHint = bestValue(stats.fastestNoHint, game.elapsed);
      if (game.hints === 0 && game.mistakes === 0) stats.perfectGames += 1;
      if (game.mode === "journey") stats.journeyLevel += 1;
      if (game.mode === "daily" && !stats.dailyWins[game.dateKey]) {
        stats.dailyWins[game.dateKey] = true;
        stats.dailyChallengeWins += 1;
      }
      stats.bestTimeProgress.push({ date: localDateKey(), time: game.elapsed, difficulty: game.difficulty });
    } else {
      stats.totalLosses += 1;
      stats.currentStreak = 0;
    }

    stats.streakHistory.push({ date: localDateKey(), streak: stats.currentStreak });
    stats.history.push({
      date: localDateKey(),
      timestamp: Date.now(),
      win: won,
      mode: game.mode,
      difficulty: game.difficulty,
      time: game.elapsed,
      hints: game.hints,
      mistakes: game.mistakes,
      stars
    });

    trimStats();
    saveStats();
    clearSavedGame();
    renderEverything();
    renderGame();
    showResultModal(won, reason, stars, xpEarned, coinsEarned, streakBonus);
    playTone(won ? "win" : "mistake");
  }

  function computeStars() {
    let stars = 1;
    if (game.mistakes <= 1) stars += 1;
    if (game.hints === 0 && game.elapsed <= game.rules.targetTime) stars += 1;
    return clamp(stars, 1, 3);
  }

  function renderGame() {
    if (!dom.sudokuBoard) return;
    if (!game) {
      dom.sudokuBoard.innerHTML = "";
      dom.numberPad.innerHTML = "";
      return;
    }
    renderGameHeader();
    renderRules();
    renderBoard();
    renderKeypad();
    renderGameControls();
    renderCompletionList();
    renderTimer();
  }

  function renderGameHeader() {
    const mode = MODES[game.mode].label;
    const difficulty = DIFFICULTIES[game.difficulty].label;
    dom.gameModeTitle.textContent = `${mode} ${difficulty}`;
    dom.gameSubline.textContent = `${difficulty} ${mode}`;
    dom.mistakeText.textContent = game.rules.mistakeLimit
      ? `${game.mistakes} / ${game.rules.mistakeLimit}`
      : `${game.mistakes} / No limit`;
    dom.hintText.textContent = `${game.hints} / ${game.rules.hints}`;
    dom.streakText.textContent = String(stats.currentStreak);
  }

  function renderRules() {
    const rules = game.rules;
    const rows = [
      ["Hints", `${rules.hints}`],
      ["Undo", `${Math.max(0, rules.undoLimit - game.undoUses)}`],
      ["Mistakes", `${rules.mistakeLimit || "No limit"}`],
      ["Checking", ruleCheckingLabel(rules.checking)],
      ["Notes", rules.allowNotes ? notesAssistLabel(rules.notesAssist) : "Disabled"],
      ["Penalty", `+${rules.mistakePenalty}s / +${rules.hintPenalty}s`]
    ];
    if (rules.speedLimit) rows.push(["Limit", formatTime(rules.speedLimit)]);

    dom.ruleList.innerHTML = rows.map(([label, value]) => (
      `<div class="rule-chip"><span>${label}</span><strong>${value}</strong></div>`
    )).join("");
  }

  function renderBoard() {
    if (!game) return;
    const selected = game.selected;
    const selectedValue = selected !== null && selected !== undefined ? game.board[selected] : 0;
    const peers = selected !== null && selected !== undefined ? PEERS[selected] : new Set();
    const conflicts = getConflictCells();
    const counts = getNumberCounts();

    dom.sudokuBoard.innerHTML = game.board.map((value, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      const classList = ["cell"];
      if (col === 2 || col === 5) classList.push("block-right");
      if (row === 2 || row === 5) classList.push("block-bottom");
      if (game.locked[index]) classList.push("locked");
      if (index === selected) classList.push("selected");
      if (peers.has(index)) classList.push("peer");
      if (value && selectedValue && value === selectedValue) classList.push("same");
      if (conflicts.has(index)) classList.push("conflict");
      if (value && game.rules.checking === "strict" && value !== game.solution[index]) classList.push("wrong");
      if (value && counts[value] >= 9 && !conflicts.has(index)) classList.push("complete");

      const content = value ? String(value) : renderNotes(game.notes[index]);
      const lockedText = game.locked[index] ? " original" : "";
      return `<button class="${classList.join(" ")}" data-index="${index}" role="gridcell" aria-label="Row ${row + 1} column ${col + 1}${lockedText}">${content}</button>`;
    }).join("");
  }

  function renderNotes(notes) {
    const values = new Set(notes);
    let html = '<span class="notes-grid">';
    for (let number = 1; number <= 9; number += 1) {
      html += `<span>${values.has(number) ? number : ""}</span>`;
    }
    html += "</span>";
    return html;
  }

  function renderKeypad() {
    if (!game) return;
    const counts = getNumberCounts();
    let html = "";
    for (let number = 1; number <= 9; number += 1) {
      const count = counts[number] || 0;
      const fill = clamp(count / 9 * 100, 0, 100);
      const complete = count >= 9;
      html += `<button class="number-key ${complete ? "complete" : ""}" data-number="${number}" style="--fill: ${fill}%">
        <span>${number}</span><small>${count}/9</small>
      </button>`;
    }
    dom.numberPad.innerHTML = html;
  }

  function renderGameControls() {
    if (!game) return;
    const undoLeft = Math.max(0, game.rules.undoLimit - game.undoUses);
    const hintLeft = Math.max(0, game.rules.hints - game.hints);
    dom.undoLeft.textContent = String(undoLeft);
    dom.hintLeft.textContent = String(hintLeft);
    dom.undoBtn.disabled = !game.undo.length || undoLeft <= 0 || game.paused || game.completed || game.lost;
    dom.redoBtn.disabled = !game.redo.length || game.paused || game.completed || game.lost;
    dom.hintBtn.disabled = hintLeft <= 0 || game.paused || game.completed || game.lost;
    dom.noteBtn.disabled = !game.rules.allowNotes || game.paused || game.completed || game.lost;
    dom.eraserBtn.disabled = game.paused || game.completed || game.lost;
    dom.noteBtn.classList.toggle("active", game.notesMode);
    dom.eraserBtn.classList.toggle("active", game.eraserMode);
  }

  function renderCompletionList() {
    if (!game) return;
    const counts = getNumberCounts();
    dom.completionList.innerHTML = Array.from({ length: 9 }, (_, i) => {
      const number = i + 1;
      const count = counts[number] || 0;
      const percent = clamp(count / 9 * 100, 0, 100);
      return `<div class="completion-row">
        <strong>${number}</strong>
        <span class="completion-bar"><span style="width: ${percent}%"></span></span>
        <small>${count}/9</small>
      </div>`;
    }).join("");
  }

  function renderTimer() {
    if (!game) {
      dom.timerText.textContent = "00:00";
      return;
    }
    let text = formatTime(game.elapsed);
    if (game.rules.speedLimit) {
      const left = Math.max(0, game.rules.speedLimit - game.elapsed);
      text = `${formatTime(left)} left`;
      if (left <= 0 && !game.completed && !game.lost && !game.finishing) finishGame(false, "Time expired");
    }
    dom.timerText.textContent = text;
  }

  function getNumberCounts() {
    const counts = {};
    for (const value of game.board) {
      if (value) counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  function getConflictCells() {
    const conflicts = new Set();
    for (const unit of UNITS) {
      const seen = new Map();
      for (const index of unit) {
        const value = game.board[index];
        if (!value) continue;
        if (!seen.has(value)) seen.set(value, []);
        seen.get(value).push(index);
      }
      seen.forEach(indices => {
        if (indices.length > 1) indices.forEach(index => conflicts.add(index));
      });
    }
    return conflicts;
  }

  function hasVisibleConflict(index, value) {
    for (const peer of PEERS[index]) {
      if (game.board[peer] === value) return true;
    }
    return false;
  }

  function isVisibleCandidate(index, value) {
    return !hasVisibleConflict(index, value);
  }

  function applyNotesAssist(index, value) {
    if (!game || !value || game.rules.notesAssist === "off") return;
    const peers = Array.from(PEERS[index]);
    const sameBox = getBoxIndex(index);
    const assistedPeers = game.rules.notesAssist === "basic"
      ? peers.filter(peer => getBoxIndex(peer) === sameBox)
      : peers;

    assistedPeers.forEach(peer => {
      if (game.notes[peer].includes(value)) {
        game.notes[peer] = game.notes[peer].filter(note => note !== value);
      }
    });
  }

  function canInteract() {
    return Boolean(
      game &&
      currentScreen === "game" &&
      !game.paused &&
      !game.completed &&
      !game.lost &&
      dom.modalLayer.classList.contains("hidden")
    );
  }

  function startTimer() {
    stopTimer();
    if (!game || game.paused || game.completed || game.lost) return;
    game.lastTick = Date.now();
    timerId = window.setInterval(tickTimer, 1000);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function tickTimer() {
    if (!game || game.paused || game.completed || game.lost) return;
    syncElapsed();
    renderTimer();
    if (Date.now() - lastSaveAt > 4000) saveCurrentGame();
  }

  function syncElapsed() {
    if (!game || game.paused || game.completed || game.lost) return;
    const now = Date.now();
    const delta = Math.floor((now - game.lastTick) / 1000);
    if (delta > 0) {
      game.elapsed += delta;
      game.lastTick += delta * 1000;
    }
  }

  function pauseGame(reason, showModal) {
    if (!game || game.completed || game.lost || game.paused) return;
    syncElapsed();
    renderTimer();
    if (game.completed || game.lost) return;
    stopTimer();
    game.paused = true;
    game.pauseReason = reason;
    saveCurrentGame();
    renderGameControls();
    if (showModal) showPauseModal(reason);
  }

  function resumeGameFromPause() {
    if (!game || game.completed || game.lost) return;
    game.paused = false;
    game.pauseReason = "";
    game.lastTick = Date.now();
    closeModal();
    saveCurrentGame();
    renderGame();
    startTimer();
    playTone("start");
  }

  function showPauseModal(reason) {
    showModal(`
      <div class="modal-card">
        <span class="paused-badge">Paused</span>
        <h2>Game on hold</h2>
        <p>${reason || "Your puzzle is safely paused."}</p>
        <div class="modal-actions">
          <button class="primary-action" data-modal-action="resume">Resume</button>
          <button class="secondary-action" data-modal-action="home">Home</button>
        </div>
      </div>
    `);
  }

  function showResultModal(won, reason, stars, xpEarned, coinsEarned, streakBonus) {
    const title = won ? "Puzzle Complete" : "Run Ended";
    const copy = won ? "Clean finish. Your stats, coins, XP, and streak were updated." : reason;
    const starHtml = Array.from({ length: 3 }, (_, i) => `<span class="star ${i < stars ? "filled" : ""}"></span>`).join("");
    const nextAction = game.mode === "daily" ? "nextClassic" : "next";

    showModal(`
      <div class="modal-card">
        <span class="eyebrow">${won ? "Victory screen" : "Result screen"}</span>
        <h2>${title}</h2>
        <p>${copy}</p>
        <div class="star-row">${starHtml}</div>
        <div class="result-grid">
          <div class="result-chip"><span>Time</span><strong>${formatTime(game.elapsed)}</strong></div>
          <div class="result-chip"><span>Mistakes</span><strong>${game.mistakes}</strong></div>
          <div class="result-chip"><span>Hints</span><strong>${game.hints}</strong></div>
          <div class="result-chip"><span>Difficulty</span><strong>${DIFFICULTIES[game.difficulty].label}</strong></div>
          <div class="result-chip"><span>XP</span><strong>${xpEarned}</strong></div>
          <div class="result-chip"><span>Coins</span><strong>${coinsEarned}</strong></div>
          <div class="result-chip"><span>Streak Bonus</span><strong>${streakBonus}</strong></div>
          <div class="result-chip"><span>Mode</span><strong>${MODES[game.mode].label}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="secondary-action" data-modal-action="replay">Replay</button>
          <button class="primary-action" data-modal-action="${nextAction}">Next Puzzle</button>
        </div>
      </div>
    `);
  }

  function showResetModal() {
    showModal(`
      <div class="modal-card">
        <span class="eyebrow">Reset progress</span>
        <h2>Clear local data?</h2>
        <p>This removes saved games, stats, coins, skins, trophies, rewards, and settings from this device.</p>
        <div class="modal-actions">
          <button class="secondary-action" data-modal-action="close">Cancel</button>
          <button class="danger-action" data-modal-action="reset">Reset</button>
        </div>
      </div>
    `);
  }

  function showModal(html) {
    dom.modalLayer.innerHTML = html;
    dom.modalLayer.classList.remove("hidden");
  }

  function closeModal() {
    dom.modalLayer.classList.add("hidden");
    dom.modalLayer.innerHTML = "";
  }

  function handleModalAction(action) {
    if (action === "resume") resumeGameFromPause();
    if (action === "home") {
      closeModal();
      goToScreen("home");
    }
    if (action === "close") closeModal();
    if (action === "reset") resetProgress();
    if (action === "replay") {
      const mode = game ? game.mode : selectedMode;
      const difficulty = game ? game.difficulty : selectedDifficulty;
      beginNewGame(mode, difficulty);
    }
    if (action === "next") {
      const mode = game ? game.mode : selectedMode;
      const difficulty = game ? game.difficulty : selectedDifficulty;
      beginNewGame(mode, difficulty);
    }
    if (action === "nextClassic") {
      beginNewGame("classic", game ? game.difficulty : selectedDifficulty);
    }
  }

  function handleKeyboard(event) {
    if (!game || currentScreen !== "game") return;
    if (!dom.modalLayer.classList.contains("hidden")) {
      if (event.key === "Escape" && game.paused) resumeGameFromPause();
      return;
    }

    if (event.key >= "1" && event.key <= "9") {
      event.preventDefault();
      inputNumber(Number(event.key));
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      if (canInteract() && game.selected !== null) eraseCell(game.selected);
    } else if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      toggleNotesMode();
    } else if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      useHint();
    } else if (event.key === "Escape" || event.key === " ") {
      event.preventDefault();
      if (game.paused) resumeGameFromPause();
      else pauseGame("Manual pause", true);
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      moveSelection(event.key);
    }
  }

  function moveSelection(key) {
    if (!game) return;
    let index = game.selected === null || game.selected === undefined ? 0 : game.selected;
    const row = Math.floor(index / 9);
    const col = index % 9;
    if (key === "ArrowUp") index = ((row + 8) % 9) * 9 + col;
    if (key === "ArrowDown") index = ((row + 1) % 9) * 9 + col;
    if (key === "ArrowLeft") index = row * 9 + ((col + 8) % 9);
    if (key === "ArrowRight") index = row * 9 + ((col + 1) % 9);
    selectCell(index);
  }

  function renderHome() {
    dom.modeGrid.querySelectorAll("[data-mode]").forEach(card => {
      card.classList.toggle("active", card.dataset.mode === selectedMode);
    });
    dom.difficultyGrid.querySelectorAll("[data-difficulty]").forEach(card => {
      card.classList.toggle("active", card.dataset.difficulty === selectedDifficulty);
    });
    dom.customPanel.classList.toggle("hidden", selectedMode !== "custom");
    dom.customClues.value = settings.custom.clues;
    dom.customHints.value = settings.custom.hints;
    dom.customMistakes.value = settings.custom.mistakes;
    dom.customUndo.value = settings.custom.undo;
    dom.resumeGameBtn.disabled = !(game && !game.completed && !game.lost);

    const today = localDateKey();
    dom.dailyStatus.textContent = stats.dailyWins[today] ? "Daily complete" : "Daily ready";
    const rewardReady = stats.lastDailyReward !== today;
    dom.dailyRewardBtn.disabled = !rewardReady;
    dom.rewardTitle.textContent = rewardReady ? "Claim focus bonus" : "Reward claimed";
    dom.rewardCopy.textContent = rewardReady
      ? `Streak ${stats.dailyRewardStreak || 0}. Today adds coins and XP.`
      : "Come back tomorrow for the next daily reward.";
    renderRank();
    updateTopStatus();
  }

  function renderRank() {
    const rank = getRank(stats.xp);
    dom.rankLevel.textContent = String(rank.level);
    dom.rankTitle.textContent = rank.title;
    dom.rankProgressText.textContent = `${rank.remaining} XP to next rank`;
    dom.rankMeter.style.width = `${rank.progress}%`;
    dom.rankRing.style.setProperty("--progress", `${rank.progress * 3.6}deg`);
  }

  function updateTopStatus() {
    const rank = getRank(stats.xp);
    dom.coinPill.textContent = `${stats.coins} coins`;
    dom.rankPill.textContent = `Rank ${rank.level}`;
    if (dom.shopCoinPill) {
      const tokenText = stats.themeTokens ? ` + ${stats.themeTokens} token${stats.themeTokens === 1 ? "" : "s"}` : "";
      dom.shopCoinPill.textContent = `${stats.coins} coins${tokenText}`;
    }
  }

  function renderStats() {
    const played = Math.max(1, stats.totalGamesPlayed);
    const winRate = Math.round(stats.totalWins / played * 100);
    const avg = stats.solveTimes.length
      ? Math.round(stats.solveTimes.reduce((sum, value) => sum + value, 0) / stats.solveTimes.length)
      : null;

    dom.winRatePill.textContent = `${winRate}% win rate`;
    dom.statGames.textContent = String(stats.totalGamesPlayed);
    dom.statWins.textContent = String(stats.totalWins);
    dom.statBest.textContent = stats.bestTime ? formatTime(stats.bestTime) : "--";
    dom.statAvg.textContent = avg ? formatTime(avg) : "--";
    dom.statNoHint.textContent = stats.fastestNoHint ? formatTime(stats.fastestNoHint) : "--";
    dom.statPerfect.textContent = String(stats.perfectGames);
    dom.statDaily.textContent = String(stats.dailyChallengeWins);
    dom.statPlayTime.textContent = stats.totalPlayTime ? formatLongTime(stats.totalPlayTime) : "--";

    renderWeeklyChart();
    renderMonthlyChart();
    renderDifficultyChart();
    renderBestTimeChart();
    renderRatioChart(winRate);
    renderStreakChart();
  }

  function renderWeeklyChart() {
    const keys = dateKeys(7);
    const values = keys.map(key => stats.history.filter(item => item.date === key && item.win).length);
    const max = Math.max(1, ...values);
    dom.weeklyChart.innerHTML = values.map((value, index) => {
      const height = Math.max(8, value / max * 100);
      return `<div class="bar" style="height: ${height}%"><span>${weekdayLabel(keys[index])}</span></div>`;
    }).join("");
  }

  function renderMonthlyChart() {
    const keys = dateKeys(30);
    const values = keys.map(key => stats.history.filter(item => item.date === key && item.win).length);
    const max = Math.max(1, ...values);
    dom.monthlyChart.innerHTML = values.map(value => {
      const height = Math.max(5, value / max * 100);
      return `<span class="micro-bar" style="height: ${height}%"></span>`;
    }).join("");
  }

  function renderDifficultyChart() {
    dom.difficultyChart.innerHTML = Object.keys(DIFFICULTIES).map(key => {
      const played = stats.difficultyPlayed[key] || 0;
      const wins = stats.difficultyWins[key] || 0;
      const pct = played ? Math.round(wins / played * 100) : 0;
      return `<div class="difficulty-row">
        <span>${DIFFICULTIES[key].label}</span>
        <span class="difficulty-track"><span style="width: ${pct}%"></span></span>
        <strong>${pct}%</strong>
      </div>`;
    }).join("");
  }

  function renderBestTimeChart() {
    const items = stats.bestTimeProgress.slice(-12);
    if (!items.length) {
      dom.bestTimeChart.innerHTML = '<svg viewBox="0 0 300 170" role="img" aria-label="No best time data"><text x="24" y="90" fill="currentColor">No wins yet</text></svg>';
      return;
    }
    const values = items.map(item => item.time);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => {
      const x = items.length === 1 ? 150 : 18 + index * (264 / (items.length - 1));
      const y = 142 - ((max - value) / range) * 112;
      return `${x},${y}`;
    }).join(" ");

    dom.bestTimeChart.innerHTML = `
      <svg viewBox="0 0 300 170" role="img" aria-label="Best time progress">
        <path d="M18 142 H282" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
        <polyline fill="none" stroke="var(--skin-a)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="${points}"/>
        ${points.split(" ").map(point => {
          const [x, y] = point.split(",");
          return `<circle cx="${x}" cy="${y}" r="5" fill="var(--skin-b)"/>`;
        }).join("")}
      </svg>`;
  }

  function renderRatioChart(winRate) {
    dom.ratioDonut.style.setProperty("--ratio", `${winRate * 3.6}deg`);
    dom.ratioLabel.textContent = `${winRate}%`;
  }

  function renderStreakChart() {
    const items = stats.streakHistory.slice(-10);
    const values = items.length ? items.map(item => item.streak) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(1, ...values);
    dom.streakChart.innerHTML = values.map((value, index) => {
      const height = Math.max(8, value / max * 100);
      return `<div class="bar" style="height: ${height}%"><span>${index + 1}</span></div>`;
    }).join("");
  }

  function renderAchievements() {
    let unlockedCount = 0;
    dom.achievementGrid.innerHTML = ACHIEVEMENTS.map((achievement, index) => {
      const unlocked = achievement.condition(stats);
      const claimed = stats.claimedAchievements.includes(achievement.id);
      if (unlocked) unlockedCount += 1;
      const rewardText = rewardLabel(achievement.reward);
      const buttonText = claimed ? "Claimed" : unlocked ? "Claim Reward" : "Locked";
      return `<article class="achievement-card ${unlocked ? "" : "locked"}">
        <div>
          <div class="achievement-medal">${index + 1}</div>
          <h3>${achievement.title}</h3>
          <p>${achievement.desc}</p>
        </div>
        <small>${rewardText}</small>
        <button data-achievement="${achievement.id}" ${!unlocked || claimed ? "disabled" : ""}>${buttonText}</button>
      </article>`;
    }).join("");
    dom.trophyPill.textContent = `${unlockedCount} unlocked`;

    dom.achievementGrid.querySelectorAll("[data-achievement]").forEach(button => {
      button.addEventListener("click", () => claimAchievement(button.dataset.achievement));
    });
  }

  function claimAchievement(id) {
    const achievement = ACHIEVEMENTS.find(item => item.id === id);
    if (!achievement || !achievement.condition(stats) || stats.claimedAchievements.includes(id)) return;
    stats.claimedAchievements.push(id);
    applyReward(achievement.reward);
    saveStats();
    renderEverything();
    toast(`${achievement.title} reward claimed.`);
    playTone("win");
  }

  function renderShop() {
    updateTopStatus();
    resetSpinIfNeeded();
    const today = localDateKey();
    const freeUsed = stats.lastSpinDate === today && stats.spinUsesToday > 0;
    dom.spinStatus.textContent = freeUsed ? "Extra spins cost 50 coins today." : "One free spin daily.";

    dom.shopGrid.innerHTML = SHOP_ITEMS.map(item => {
      const unlocked = stats.unlockedSkins.includes(item.id);
      const active = settings.skin === item.id;
      const hidden = item.achievementOnly && !unlocked;
      if (hidden) return "";
      const canUseToken = !unlocked && !item.achievementOnly && stats.themeTokens > 0;
      const button = active ? "Active" : unlocked ? "Use" : canUseToken ? "Use Token" : `Buy ${item.cost}`;
      return `<article class="shop-card">
        <div class="skin-preview" style="--preview-a: ${item.a}; --preview-b: ${item.b}"></div>
        <h3>${item.name}</h3>
        <small>${item.text}</small>
        <button data-shop="${item.id}" ${active ? "disabled" : ""}>${button}</button>
      </article>`;
    }).join("");

    dom.shopGrid.querySelectorAll("[data-shop]").forEach(button => {
      button.addEventListener("click", () => buyOrUseSkin(button.dataset.shop));
    });
  }

  function buyOrUseSkin(id) {
    const item = SHOP_ITEMS.find(entry => entry.id === id);
    if (!item) return;
    const unlocked = stats.unlockedSkins.includes(id);
    if (!unlocked) {
      if (!item.achievementOnly && stats.themeTokens > 0) {
        stats.themeTokens -= 1;
      } else if (stats.coins < item.cost) {
        toast("Not enough coins.");
        buzz(22);
        return;
      } else {
        stats.coins -= item.cost;
      }
      stats.unlockedSkins.push(id);
      toast(`${item.name} unlocked.`);
    }
    settings.skin = id;
    saveSettings();
    saveStats();
    applySettings();
    renderEverything();
    playTone("win");
  }

  function claimDailyReward() {
    const today = localDateKey();
    if (stats.lastDailyReward === today) {
      toast("Daily reward already claimed.");
      return;
    }
    const previous = stats.lastDailyReward;
    const dayGap = previous ? daysBetween(previous, today) : 1;
    stats.dailyRewardStreak = dayGap === 1 ? stats.dailyRewardStreak + 1 : 1;
    stats.lastDailyReward = today;
    const coins = 45 + Math.min(75, stats.dailyRewardStreak * 8);
    const xp = 60 + Math.min(140, stats.dailyRewardStreak * 12);
    applyReward({ coins, xp });
    saveStats();
    renderEverything();
    toast(`Daily reward: ${coins} coins and ${xp} XP.`);
    playTone("win");
  }

  function spinLuckyWheel() {
    resetSpinIfNeeded();
    const today = localDateKey();
    const freeSpin = stats.lastSpinDate !== today || stats.spinUsesToday === 0;
    if (!freeSpin) {
      if (stats.coins < 50) {
        toast("Extra spins cost 50 coins.");
        return;
      }
      stats.coins -= 50;
    }

    stats.lastSpinDate = today;
    stats.spinUsesToday += 1;
    const rng = seededRandom(`${Date.now()}:${Math.random()}`);
    const outcomes = [
      { label: "40 coins", reward: { coins: 40 } },
      { label: "90 XP", reward: { xp: 90 } },
      { label: "90 coins", reward: { coins: 90 } },
      { label: "Theme token", reward: { themeTokens: 1 } },
      { label: "160 XP", reward: { xp: 160 } },
      { label: "140 coins", reward: { coins: 140 } }
    ];
    const outcome = outcomes[Math.floor(rng() * outcomes.length)];
    const rotation = 900 + Math.floor(rng() * 720);
    const current = Number(dom.spinWheel.dataset.rotation || 0);
    dom.spinWheel.dataset.rotation = String(current + rotation);
    dom.spinWheel.style.transform = `rotate(${current + rotation}deg)`;
    dom.spinBtn.disabled = true;
    saveStats();

    window.setTimeout(() => {
      applyReward(outcome.reward);
      saveStats();
      dom.spinBtn.disabled = false;
      renderEverything();
      toast(`Lucky spin won ${outcome.label}.`);
      playTone("win");
    }, 1350);
  }

  function resetSpinIfNeeded() {
    const today = localDateKey();
    if (stats.lastSpinDate && stats.lastSpinDate !== today) {
      stats.spinUsesToday = 0;
      saveStats();
    }
  }

  function applyReward(reward) {
    if (reward.coins) stats.coins += reward.coins;
    if (reward.xp) stats.xp += reward.xp;
    if (reward.themeTokens) stats.themeTokens += reward.themeTokens;
    if (reward.skin && !stats.unlockedSkins.includes(reward.skin)) stats.unlockedSkins.push(reward.skin);
  }

  function renderSettings() {
    document.querySelectorAll("[data-setting]").forEach(input => {
      const key = input.dataset.setting;
      if (key === "darkMode") input.checked = settings.theme === "dark";
      else input.checked = Boolean(settings[key]);
    });
  }

  function updateSetting(key, checked) {
    if (key === "darkMode") settings.theme = checked ? "dark" : "light";
    else settings[key] = checked;
    saveSettings();
    applySettings();
    renderEverything();
    playTone("tap");
  }

  function applySettings() {
    dom.root.dataset.theme = settings.theme;
    dom.root.dataset.skin = settings.skin || "royal";
    dom.body.classList.toggle("left-hand", Boolean(settings.leftHand));
    dom.body.classList.toggle("accessibility", Boolean(settings.accessibility));
    dom.body.classList.toggle("battery-saver", Boolean(settings.batterySaver));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", settings.theme === "dark" ? "#0b0d18" : "#f4efe6");
  }

  function resetProgress() {
    stopTimer();
    localStorage.removeItem(STORAGE.settings);
    localStorage.removeItem(STORAGE.stats);
    localStorage.removeItem(STORAGE.game);
    settings = mergeDefaults(DEFAULT_SETTINGS, {});
    stats = mergeDefaults(DEFAULT_STATS, {});
    selectedMode = settings.selectedMode;
    selectedDifficulty = settings.selectedDifficulty;
    game = null;
    closeModal();
    applySettings();
    renderEverything();
    renderGame();
    goToScreen("home");
    toast("Progress reset.");
  }

  function saveCurrentGameDebounced() {
    if (Date.now() - lastSaveAt > 700) saveCurrentGame();
  }

  function saveCurrentGame() {
    if (!game || game.completed || game.lost) {
      clearSavedGame();
      return;
    }
    game.updatedAt = Date.now();
    lastSaveAt = Date.now();
    writeJson(STORAGE.game, game);
  }

  function loadSavedGame() {
    const saved = readJson(STORAGE.game, null);
    if (!saved || !Array.isArray(saved.board) || saved.board.length !== 81) return null;
    const rules = buildRules(saved.mode || "classic", saved.difficulty || "easy");
    return {
      ...saved,
      rules,
      notes: Array.from({ length: 81 }, (_, index) => saved.notes && Array.isArray(saved.notes[index]) ? saved.notes[index] : []),
      undo: Array.isArray(saved.undo) ? saved.undo : [],
      redo: Array.isArray(saved.redo) ? saved.redo : [],
      selected: Number.isInteger(saved.selected) ? saved.selected : saved.board.findIndex(value => value === 0),
      lastTick: Date.now()
    };
  }

  function clearSavedGame() {
    localStorage.removeItem(STORAGE.game);
  }

  function saveStats() {
    trimStats();
    writeJson(STORAGE.stats, stats);
  }

  function saveSettings() {
    writeJson(STORAGE.settings, settings);
  }

  function trimStats() {
    stats.history = stats.history.slice(-420);
    stats.solveTimes = stats.solveTimes.slice(-160);
    stats.streakHistory = stats.streakHistory.slice(-120);
    stats.bestTimeProgress = stats.bestTimeProgress.slice(-120);
  }

  function transformPuzzlePair(base, rng) {
    const digitOrder = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    const digitMap = {};
    digitOrder.forEach((value, index) => {
      digitMap[String(index + 1)] = String(value);
    });

    const rowOrder = bandedOrder(rng);
    const colOrder = bandedOrder(rng);

    const transform = grid => {
      let output = "";
      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          const char = grid[rowOrder[row] * 9 + colOrder[col]];
          output += char === "0" || char === "." ? "0" : digitMap[char];
        }
      }
      return output;
    };

    return {
      puzzle: transform(base.puzzle),
      solution: transform(base.solution)
    };
  }

  function tunePuzzleClues(puzzle, solution, clueTarget, rng) {
    const cells = puzzle.split("");
    let clues = cells.filter(char => char !== "0").length;
    if (clues > clueTarget) {
      const filled = shuffle(cells.map((char, index) => char !== "0" ? index : null).filter(index => index !== null), rng);
      while (clues > clueTarget && filled.length) {
        cells[filled.pop()] = "0";
        clues -= 1;
      }
    }
    if (clues < clueTarget) {
      const empty = shuffle(cells.map((char, index) => char === "0" ? index : null).filter(index => index !== null), rng);
      while (clues < clueTarget && empty.length) {
        const index = empty.pop();
        cells[index] = solution[index];
        clues += 1;
      }
    }
    return cells.join("");
  }

  function carvePuzzle(solution, clueTarget, rng) {
    const cells = solution.split("");
    const indices = shuffle(Array.from({ length: 81 }, (_, index) => index), rng);
    let clues = 81;
    while (clues > clueTarget && indices.length) {
      const index = indices.pop();
      cells[index] = "0";
      clues -= 1;
    }
    return cells.join("");
  }

  function generateSolvedGrid(rng) {
    const pattern = (row, col) => (row * 3 + Math.floor(row / 3) + col) % 9;
    const rows = bandedOrder(rng);
    const cols = bandedOrder(rng);
    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    const grid = [];
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        grid.push(numbers[pattern(rows[row], cols[col])]);
      }
    }
    return grid;
  }

  function bandedOrder(rng) {
    const bands = shuffle([0, 1, 2], rng);
    const output = [];
    bands.forEach(band => {
      shuffle([0, 1, 2], rng).forEach(offset => output.push(band * 3 + offset));
    });
    return output;
  }

  function toGridArray(grid) {
    return grid.split("").map(char => Number(char) || 0);
  }

  function buildUnits() {
    const units = [];
    for (let row = 0; row < 9; row += 1) {
      units.push(Array.from({ length: 9 }, (_, col) => row * 9 + col));
    }
    for (let col = 0; col < 9; col += 1) {
      units.push(Array.from({ length: 9 }, (_, row) => row * 9 + col));
    }
    for (let boxRow = 0; boxRow < 3; boxRow += 1) {
      for (let boxCol = 0; boxCol < 3; boxCol += 1) {
        const unit = [];
        for (let row = 0; row < 3; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            unit.push((boxRow * 3 + row) * 9 + (boxCol * 3 + col));
          }
        }
        units.push(unit);
      }
    }
    return units;
  }

  function buildPeers() {
    return Array.from({ length: 81 }, (_, index) => {
      const peers = new Set();
      const row = Math.floor(index / 9);
      const col = index % 9;
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 9; i += 1) {
        peers.add(row * 9 + i);
        peers.add(i * 9 + col);
      }
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          peers.add((boxRow + r) * 9 + (boxCol + c));
        }
      }
      peers.delete(index);
      return peers;
    });
  }

  function getBoxIndex(index) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  function ruleCheckingLabel(value) {
    if (value === "strict") return "Instant";
    if (value === "conflict") return "Conflict";
    return "Final";
  }

  function notesAssistLabel(value) {
    if (value === "full") return "Full assist";
    if (value === "basic") return "Box assist";
    if (value === "light") return "Manual";
    return "Off";
  }

  function rewardLabel(reward) {
    const parts = [];
    if (reward.coins) parts.push(`${reward.coins} coins`);
    if (reward.xp) parts.push(`${reward.xp} XP`);
    if (reward.skin) parts.push("skin unlock");
    return parts.join(" + ");
  }

  function getRank(xp) {
    const level = Math.floor(xp / 500) + 1;
    const floor = (level - 1) * 500;
    const next = level * 500;
    const progress = Math.round((xp - floor) / (next - floor) * 100);
    const title = RANK_TITLES[Math.min(RANK_TITLES.length - 1, Math.floor((level - 1) / 2))];
    return {
      level,
      title,
      progress,
      remaining: Math.max(0, next - xp)
    };
  }

  function bestValue(current, candidate) {
    if (current === null || current === undefined) return candidate;
    return Math.min(current, candidate);
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
  }

  function formatLongTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function dateKeys(days) {
    const keys = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      keys.push(localDateKey(date));
    }
    return keys;
  }

  function weekdayLabel(key) {
    const date = parseDateKey(key);
    return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
  }

  function daysBetween(startKey, endKey) {
    const start = parseDateKey(startKey);
    const end = parseDateKey(endKey);
    return Math.round((end - start) / 86400000);
  }

  function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function shuffle(array, rng) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function seededRandom(seed) {
    let value = hashString(seed);
    return function () {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(input) {
    const text = String(input);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mergeDefaults(defaults, value) {
    if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults.slice();
    if (!defaults || typeof defaults !== "object") {
      return value === undefined || value === null ? defaults : value;
    }
    const output = { ...defaults };
    if (!value || typeof value !== "object") return output;
    Object.keys(defaults).forEach(key => {
      output[key] = mergeDefaults(defaults[key], value[key]);
    });
    Object.keys(value).forEach(key => {
      if (!(key in output)) output[key] = value[key];
    });
    return output;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      toast("Storage is full. Progress may not save.");
    }
  }

  function toast(message) {
    if (!dom.toastLayer) return;
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    dom.toastLayer.appendChild(node);
    window.setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      window.setTimeout(() => node.remove(), 220);
    }, 2400);
  }

  function playTone(type) {
    if (!settings.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext = audioContext || new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const frequencies = {
        tap: 420,
        note: 520,
        correct: 680,
        hint: 760,
        erase: 310,
        mistake: 150,
        start: 540,
        win: 880
      };
      oscillator.frequency.value = frequencies[type] || 420;
      oscillator.type = type === "mistake" ? "sawtooth" : "sine";
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(type === "win" ? 0.09 : 0.045, audioContext.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + (type === "win" ? 0.22 : 0.08));
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + (type === "win" ? 0.24 : 0.09));
    } catch (error) {
      settings.sound = false;
      saveSettings();
    }
  }

  function buzz(ms) {
    if (settings.vibration && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }
})();
