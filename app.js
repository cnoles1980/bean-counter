const STORAGE_KEY = "coffee-saved-state-v1";

const achievements = [
  { id: "first", icon: "1", title: "First Skip", detail: "Pass on 1 coffee run.", unlocked: (s) => s.cups >= 1 },
  { id: "five", icon: "5", title: "Counting Beans", detail: "Pass on 5 coffee runs.", unlocked: (s) => s.cups >= 5 },
  { id: "ten", icon: "10", title: "Line Skipper", detail: "Skip 10 coffee runs.", unlocked: (s) => s.cups >= 10 },
  { id: "gross25", icon: "$", title: "Latte Tax Cut", detail: "Avoid $25 in café tabs.", unlocked: (s) => s.gross >= 25 },
  { id: "net50", icon: "$", title: "Pocketed $50", detail: "Keep $50 after home costs.", unlocked: (s) => s.net >= 50 },
  { id: "net100", icon: "$", title: "Home Brew Wins", detail: "Keep $100 after home costs.", unlocked: (s) => s.net >= 100 },
  { id: "streak3", icon: "3", title: "New Ritual", detail: "Log runs on 3 days in a row.", unlocked: (s) => s.streak >= 3 },
  { id: "home20", icon: "H", title: "Home Barista", detail: "Make 20 home brews count.", unlocked: (s) => s.cups >= 20 },
  { id: "machineHalf", icon: "50", title: "Halfway to Crema", detail: "Pay off 50% of the machine.", unlocked: (s) => s.machineCost > 0 && s.machinePercent >= 50 },
  { id: "machinePaid", icon: "100", title: "Machine Paid", detail: "Cover the machine with skipped runs.", unlocked: (s) => s.machineCost > 0 && s.machinePercent >= 100 },
  { id: "badge6", icon: "*", title: "Trophy Shelf", detail: "Unlock 6 achievements.", unlocked: (s) => s.otherUnlockedCount >= 6 },
  { id: "net250", icon: "$", title: "Bean Bank", detail: "Keep $250 after home costs.", unlocked: (s) => s.net >= 250 },
];

const state = loadState();
const nodes = {
  form: document.querySelector("#entryForm"),
  shopPrice: document.querySelector("#shopPrice"),
  homeCost: document.querySelector("#homeCost"),
  machineCost: document.querySelector("#machineCost"),
  addTwoButton: document.querySelector("#addTwoButton"),
  undoButton: document.querySelector("#undoButton"),
  resetButton: document.querySelector("#resetButton"),
  exportButton: document.querySelector("#exportButton"),
  importFile: document.querySelector("#importFile"),
  downloadButton: document.querySelector("#downloadButton"),
  shareButton: document.querySelector("#shareButton"),
  toast: document.querySelector("#toast"),
};

nodes.shopPrice.value = state.settings.shopPrice.toFixed(2);
nodes.homeCost.value = state.settings.homeCost.toFixed(2);
nodes.machineCost.value = state.settings.machineCost.toFixed(2);

nodes.form.addEventListener("submit", (event) => {
  event.preventDefault();
  addCups(1);
});

nodes.addTwoButton.addEventListener("click", () => addCups(2));
nodes.undoButton.addEventListener("click", undoLastCup);
nodes.resetButton.addEventListener("click", resetTracker);
nodes.exportButton.addEventListener("click", exportBackup);
nodes.importFile.addEventListener("change", importBackup);
nodes.downloadButton.addEventListener("click", downloadBragShot);
nodes.shareButton.addEventListener("click", shareBragText);
nodes.shopPrice.addEventListener("change", saveSettingsFromInputs);
nodes.homeCost.addEventListener("change", saveSettingsFromInputs);
nodes.machineCost.addEventListener("change", saveSettingsFromInputs);

render();

function loadState() {
  const fallback = createDefaultState();

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(stored, fallback);
  } catch {
    return fallback;
  }
}

function createDefaultState() {
  return {
    settings: {
      shopPrice: 6.5,
      homeCost: 0.75,
      machineCost: 650,
    },
    entries: [],
  };
}

function normalizeState(source, fallback = createDefaultState()) {
  if (!source || !Array.isArray(source.entries)) return fallback;
  return {
    settings: {
      shopPrice: cleanMoney(source.settings?.shopPrice, fallback.settings.shopPrice),
      homeCost: cleanMoney(source.settings?.homeCost, fallback.settings.homeCost),
      machineCost: cleanMoney(source.settings?.machineCost, fallback.settings.machineCost),
    },
    entries: source.entries
      .map((entry) => ({
        id: typeof entry.id === "string" && entry.id ? entry.id : crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        date: typeof entry.date === "string" && !Number.isNaN(Date.parse(entry.date)) ? entry.date : new Date().toISOString(),
        shopPrice: cleanMoney(entry.shopPrice, Number.NaN),
        homeCost: cleanMoney(entry.homeCost, Number.NaN),
      }))
      .filter((entry) => Number.isFinite(entry.shopPrice) && Number.isFinite(entry.homeCost)),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSettingsFromInputs() {
  state.settings.shopPrice = cleanMoney(nodes.shopPrice.value, 0);
  state.settings.homeCost = cleanMoney(nodes.homeCost.value, 0);
  state.settings.machineCost = cleanMoney(nodes.machineCost.value, 0);
  nodes.shopPrice.value = state.settings.shopPrice.toFixed(2);
  nodes.homeCost.value = state.settings.homeCost.toFixed(2);
  nodes.machineCost.value = state.settings.machineCost.toFixed(2);
  saveState();
  render();
}

function addCups(count) {
  saveSettingsFromInputs();
  const now = new Date().toISOString();
  for (let index = 0; index < count; index += 1) {
    state.entries.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`,
      date: now,
      shopPrice: state.settings.shopPrice,
      homeCost: state.settings.homeCost,
    });
  }
  saveState();
  render();
  showToast(count === 1 ? "Coffee run logged." : "Two coffee runs logged.");
}

function undoLastCup() {
  if (!state.entries.length) {
    showToast("Nothing to undo yet.");
    return;
  }
  state.entries.pop();
  saveState();
  render();
  showToast("Last coffee run removed.");
}

function resetTracker() {
  if (!state.entries.length) {
    showToast("Tracker is already empty.");
    return;
  }
  const confirmed = window.confirm("Reset all logged coffee runs? Your cost settings will stay.");
  if (!confirmed) return;
  state.entries = [];
  saveState();
  render();
  showToast("Tracker reset.");
}

function exportBackup() {
  saveSettingsFromInputs();
  const backup = {
    app: "Bean Counter",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bean-counter-backup-${toDateKey(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Backup exported.");
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const importedState = normalizeState(parsed.state || parsed);
    const confirmed = window.confirm("Import this backup? It will replace the coffee runs currently saved in this browser.");
    if (!confirmed) return;

    state.settings = importedState.settings;
    state.entries = importedState.entries;
    nodes.shopPrice.value = state.settings.shopPrice.toFixed(2);
    nodes.homeCost.value = state.settings.homeCost.toFixed(2);
    nodes.machineCost.value = state.settings.machineCost.toFixed(2);
    saveState();
    render();
    showToast("Backup imported.");
  } catch {
    showToast("That backup file could not be imported.");
  }
}

function summarize() {
  const gross = state.entries.reduce((sum, entry) => sum + entry.shopPrice, 0);
  const home = state.entries.reduce((sum, entry) => sum + entry.homeCost, 0);
  const cups = state.entries.length;
  const net = gross - home;
  const streak = calculateStreak(state.entries);
  const machineCost = state.settings.machineCost;
  const machinePercent = machineCost > 0 ? Math.max(0, Math.min(100, (net / machineCost) * 100)) : 0;
  const machineRemaining = Math.max(0, machineCost - net);
  const averageNet = cups ? net / cups : Math.max(0, state.settings.shopPrice - state.settings.homeCost);
  const machineRunsLeft = machineCost > 0 && averageNet > 0 ? Math.ceil(machineRemaining / averageNet) : 0;
  const base = { gross, home, net, cups, streak, machineCost, machinePercent, machineRemaining, averageNet, machineRunsLeft };
  const otherUnlockedCount = achievements.filter((achievement) => achievement.id !== "badge6" && achievement.unlocked({ ...base, otherUnlockedCount: 0 })).length;
  const withCount = { ...base, otherUnlockedCount };
  const unlocked = achievements.filter((achievement) => achievement.unlocked(withCount));
  return {
    ...withCount,
    unlocked,
    unlockedCount: unlocked.length,
    displayAverageNet: cups ? net / cups : 0,
  };
}

function render() {
  const summary = summarize();
  const unlockedIds = new Set(summary.unlocked.map((achievement) => achievement.id));
  const nextAchievement = achievements.find(
    (achievement) => !unlockedIds.has(achievement.id) && (summary.machineCost > 0 || !achievement.id.startsWith("machine")),
  );
  const progress = getProgress(summary, nextAchievement);
  const today = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date());

  setText("#netTotal", formatMoney(summary.net));
  setText("#coffeeSkippedTotal", summary.cups.toString());
  setText("#cupCount", `${summary.cups} coffee ${plural(summary.cups, "run")} skipped`);
  setText("#streakCount", `${summary.streak} ${plural(summary.streak, "day")} streak`);
  setText("#grossTotal", formatMoney(summary.gross));
  setText("#homeTotal", formatMoney(summary.home));
  setText("#averageNet", formatMoney(summary.displayAverageNet));
  setText("#achievementCount", `${summary.unlocked.length}/${achievements.length}`);
  setText("#progressCopy", progress.copy);
  setText("#bragDate", today);
  setText("#bragValue", formatMoney(summary.net));
  setText("#bragLine", `${summary.cups} ${plural(summary.cups, "coffee")} skipped`);
  setText("#bragGross", `${formatMoney(summary.gross)} avoided`);
  setText("#bragBadges", `${summary.unlocked.length} ${plural(summary.unlocked.length, "badge")}`);
  setText("#machinePercent", `${Math.round(summary.machinePercent)}%`);
  setText("#machineRemaining", formatMoney(summary.machineRemaining));
  setText("#machineRunsLeft", summary.machineRunsLeft.toString());
  setText("#machineProgressCopy", getMachineProgressCopy(summary));
  document.querySelector("#progressFill").style.width = `${progress.percent}%`;
  document.querySelector("#machineProgressFill").style.width = `${summary.machinePercent}%`;

  document.querySelector("#achievementGrid").innerHTML = achievements
    .map((achievement) => {
      const unlocked = unlockedIds.has(achievement.id);
      return `
        <article class="achievement-card ${unlocked ? "unlocked" : "locked"}">
          <div class="medal" aria-hidden="true">${unlocked ? achievement.icon : "?"}</div>
          <div>
            <strong>${achievement.title}</strong>
            <span>${achievement.detail}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function getProgress(summary, nextAchievement) {
  if (!nextAchievement) {
    return { percent: 100, copy: "Full shelf unlocked." };
  }

  const rules = {
    first: [summary.cups, 1, "First Skip"],
    five: [summary.cups, 5, "Counting Beans"],
    ten: [summary.cups, 10, "Line Skipper"],
    gross25: [summary.gross, 25, "Latte Tax Cut"],
    net50: [summary.net, 50, "Pocketed $50"],
    net100: [summary.net, 100, "Home Brew Wins"],
    streak3: [summary.streak, 3, "New Ritual"],
    home20: [summary.cups, 20, "Home Barista"],
    machineHalf: [summary.machinePercent, 50, "Halfway to Crema"],
    machinePaid: [summary.machinePercent, 100, "Machine Paid"],
    badge6: [summary.otherUnlockedCount, 6, "Trophy Shelf"],
    net250: [summary.net, 250, "Bean Bank"],
  };
  const [current, target, label] = rules[nextAchievement.id];
  return {
    percent: Math.max(0, Math.min(100, (current / target) * 100)),
    copy: `${formatCompact(current)} / ${formatCompact(target)} toward ${label}`,
  };
}

function getMachineProgressCopy(summary) {
  if (summary.machineCost <= 0) return "Add your machine cost to track payoff";
  if (summary.machineRemaining <= 0) return "Machine paid off by skipped coffee runs";
  if (summary.machineRunsLeft <= 0) return `${formatMoney(summary.machineRemaining)} left`;
  return `${formatMoney(summary.machineRemaining)} left, about ${summary.machineRunsLeft} ${plural(summary.machineRunsLeft, "run")} to go`;
}

function calculateStreak(entries) {
  const days = new Set(entries.map((entry) => entry.date.slice(0, 10)));
  let cursor = new Date();
  let streak = 0;

  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function downloadBragShot() {
  const summary = summarize();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  const palette = {
    cream: "rgb(248, 244, 225)",
    tan: "rgb(175, 143, 111)",
    coffee: "rgb(116, 81, 45)",
    espresso: "rgb(84, 51, 16)",
    paper: "rgb(255, 252, 238)",
  };

  ctx.fillStyle = palette.cream;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawReceiptPattern(ctx, palette);
  ctx.fillStyle = palette.paper;
  roundRect(ctx, 86, 92, 908, 896, 34);
  ctx.fill();
  ctx.strokeStyle = "rgba(84, 51, 16, 0.22)";
  ctx.lineWidth = 4;
  ctx.stroke();

  drawLogoMark(ctx, 140, 142, 118, palette);

  ctx.fillStyle = palette.espresso;
  ctx.font = "800 58px Arial";
  ctx.fillText("Bean Counter", 286, 176);

  ctx.fillStyle = palette.coffee;
  ctx.font = "800 34px Arial";
  ctx.fillText("net savings", 286, 230);

  ctx.font = "700 172px Georgia";
  ctx.fillStyle = palette.espresso;
  ctx.fillText(formatMoney(summary.net), 138, 450);

  ctx.fillStyle = palette.coffee;
  ctx.font = "800 48px Arial";
  ctx.fillText(`${summary.cups} coffees skipped`, 138, 548);

  drawPill(ctx, 138, 648, `${formatMoney(summary.gross)} café tab avoided`, palette);
  drawPill(ctx, 138, 738, `${summary.unlocked.length}/${achievements.length} badges unlocked`, palette);
  drawPill(ctx, 138, 828, `${summary.streak} ${plural(summary.streak, "day")} streak`, palette);
  drawBeans(ctx, 796, 696, palette);

  ctx.fillStyle = palette.tan;
  ctx.font = "800 34px Arial";
  ctx.fillText(new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date()), 138, 930);

  const link = document.createElement("a");
  link.download = "bean-counter-share-receipt.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("Share PNG saved.");
}

async function shareBragText() {
  const summary = summarize();
  const text = `Bean Counter: ${summary.cups} coffees skipped, ${formatMoney(summary.net)} net savings.`;

  if (navigator.share) {
    try {
      await navigator.share({ title: "Bean Counter", text });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  await navigator.clipboard.writeText(text);
  showToast("Share text copied.");
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawPill(ctx, x, y, text, palette) {
  ctx.fillStyle = "rgba(175, 143, 111, 0.22)";
  roundRect(ctx, x, y - 48, 540, 70, 35);
  ctx.fill();
  ctx.fillStyle = palette.espresso;
  ctx.font = "800 34px Arial";
  ctx.fillText(text, x + 30, y - 4);
}

function drawReceiptPattern(ctx, palette) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = palette.tan;
  for (let y = 52; y < 1080; y += 132) {
    for (let x = 44; x < 1080; x += 188) {
      ctx.beginPath();
      ctx.ellipse(x, y, 24, 12, -0.72, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawLogoMark(ctx, x, y, size, palette) {
  const center = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = palette.cream;
  roundRect(ctx, 0, 0, size, size, 24);
  ctx.fill();
  ctx.strokeStyle = palette.espresso;
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.strokeStyle = palette.espresso;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(22, 30);
  ctx.lineTo(size - 22, 30);
  ctx.stroke();

  [34, center, size - 34].forEach((beadX, index) => {
    ctx.fillStyle = index === 1 ? palette.coffee : palette.tan;
    ctx.beginPath();
    ctx.arc(beadX, 30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = palette.paper;
  ctx.strokeStyle = palette.espresso;
  ctx.lineWidth = 7;
  roundRect(ctx, 28, 46, 52, 42, 12);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(84, 65, 14, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.fillStyle = palette.espresso;
  ctx.font = "700 42px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("$", 54, 83);
  ctx.restore();
}

function drawBeans(ctx, x, y, palette) {
  ctx.save();
  ctx.translate(x, y);
  [
    [0, 0, -0.65],
    [62, 48, 0.58],
    [16, 108, -0.12],
  ].forEach(([beanX, beanY, angle]) => {
    ctx.save();
    ctx.translate(beanX, beanY);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(116, 81, 45, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.coffee;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.bezierCurveTo(8, -6, -8, 7, 6, 18);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function setText(selector, text) {
  document.querySelector(selector).textContent = text;
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

function formatCompact(value) {
  if (value >= 10 || Number.isInteger(value)) return Math.floor(value).toString();
  return value.toFixed(2);
}

function cleanMoney(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function plural(count, word) {
  return count === 1 ? word : `${word}s`;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => nodes.toast.classList.remove("show"), 2200);
}
