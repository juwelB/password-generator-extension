import {
  generatePassword,
  CHAR_SETS,
  DEFAULT_LENGTH,
  MIN_LENGTH,
  MAX_LENGTH,
  type CharSet,
} from "../generator/generator";

// ---------- Elements ----------

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const passwordOutput = byId<HTMLOutputElement>("password");
const regenerateButton = byId<HTMLButtonElement>("regenerate");
const copyButton = byId<HTMLButtonElement>("copy");
const entropyText = byId<HTMLParagraphElement>("entropy");
const lengthSlider = byId<HTMLInputElement>("length");
const lengthValue = byId<HTMLSpanElement>("length-value");
const setCheckboxes = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-set]"));

// ---------- State ----------

type CopyStatus = "idle" | "copied" | "failed";

interface PopupState {
  length: number;
  sets: CharSet[];
  password: string;
  entropyBits: number;
  copyStatus: CopyStatus;
}

const state: PopupState = {
  length: DEFAULT_LENGTH,
  sets: Object.keys(CHAR_SETS) as CharSet[],
  password: "",
  entropyBits: 0,
  copyStatus: "idle",
};

// ---------- Actions: update state, then render ----------

function regenerate(): void {
  const result = generatePassword({ length: state.length, sets: state.sets });
  state.password = result.password;
  state.entropyBits = result.entropyBits;
  state.copyStatus = "idle";
  render();
}

let copyTimer: number | undefined;

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(state.password);
    state.copyStatus = "copied";
  } catch {
    state.copyStatus = "failed";
  }
  render();

  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    state.copyStatus = "idle";
    render();
  }, 2000);
}

function charClass(c: string): string {
  if (CHAR_SETS.digits.includes(c)) return "digit";
  if (CHAR_SETS.symbols.includes(c)) return "symbol";
  return "letter";
}
// ---------- Render: draw the screen from state ----------

function render(): void {
  passwordOutput.replaceChildren(
    ...[...state.password].map((c) => {
      const span = document.createElement("span");
      span.className = charClass(c);
      span.textContent = c;
      return span;
    }),
  );
  entropyText.textContent = `≈ ${Math.round(state.entropyBits)} bits`;
  lengthSlider.value = String(state.length);
  lengthValue.textContent = String(state.length);

  copyButton.textContent =
    state.copyStatus === "copied"
      ? "Copied!"
      : state.copyStatus === "failed"
        ? "Copy failed"
        : "Copy";

  for (const checkbox of setCheckboxes) {
    const set = checkbox.dataset.set as CharSet;
    const checked = state.sets.includes(set);
    checkbox.checked = checked;
    checkbox.disabled = checked && state.sets.length === 1;
  }
}

// ---------- Wiring and startup ----------

regenerateButton.addEventListener("click", regenerate);
copyButton.addEventListener("click", () => void copy());

lengthSlider.addEventListener("input", () => {
  state.length = Number(lengthSlider.value);
  regenerate();
});

for (const checkbox of setCheckboxes) {
  checkbox.addEventListener("change", () => {
    const set = checkbox.dataset.set as CharSet;
    state.sets = checkbox.checked ? [...state.sets, set] : state.sets.filter((s) => s !== set);
    regenerate();
  });
}

lengthSlider.min = String(MIN_LENGTH);
lengthSlider.max = String(MAX_LENGTH);
regenerate();
