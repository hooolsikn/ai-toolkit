import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

/* =========================================================================
 * API CLIENT
 * ======================================================================= */

const API_BASE = import.meta.env.VITE_API_BASE || "https://ai-toolkit-api-orcin.vercel.app";
const REQUEST_TIMEOUT_MS = 30000;

async function runTool(tool, input, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  let response;

  try {
    response = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, input, options }),
      signal: controller.signal,
    });
  } catch (networkErr) {
    if (networkErr.name === "AbortError") {
      const err = new Error(
        "The server took too long to respond. Please try again."
      );
      err.code = "timeout";
      throw err;
    }

    const err = new Error(
      "Couldn't reach the server. Check your connection and try again."
    );
    err.code = "network";
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch (_) {
      // Keep default error.
    }

    const err = new Error(message);
    err.code = "server";
    throw err;
  }

  const data = await response.json();
  return data.result;
}

/* =========================================================================
 * DESIGN
 * ======================================================================= */

const FONT_HEAD = "'Space Grotesk', 'Segoe UI', sans-serif";
const FONT_BODY = "'Work Sans', system-ui, sans-serif";

const COLOR = {
  bg: "#EEF3F6",
  surface: "#FFFFFF",
  ink: "#1B2A3A",
  line: "#C9D6DE",
  accent: "#E2622D",
  accent2: "#2E6E5E",
  muted: "#5E7282",
  soft: "#F8FAFB",
  errorBg: "#FBEAE5",
  errorBorder: "#E8B9AC",
  errorText: "#B3492E",
};

const MAX_INPUT_CHARS = 8000;

const TOOL_IDS = [
  "improve",
  "summarize",
  "translate",
  "email",
];

const TONES = [
  "Clearer",
  "More formal",
  "More casual",
  "More concise",
];

const LENGTHS = [
  "Short",
  "Medium",
  "Bullet points",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Japanese",
  "Mandarin Chinese",
  "Hindi",
  "Arabic",
  "Russian",
];

const EMAIL_TONES = [
  "Friendly",
  "Professional",
  "Direct",
  "Apologetic",
];

const LANGUAGE_STORAGE_KEY = "ai-toolkit-language";

/* =========================================================================
 * LOCALIZATION
 * ======================================================================= */

const STRINGS = {
  ru: {
    eyebrow: "БЕСПЛАТНЫЕ AI-ИНСТРУМЕНТЫ",
    subtitle:
      "Четыре простых AI-инструмента для текста — бесплатно, без регистрации.",

    tools: {
      improve: "Улучшить",
      summarize: "Сократить",
      translate: "Перевести",
      email: "Письмо",
    },

    placeholders: {
      improve: "Вставьте текст, который нужно улучшить…",
      summarize: "Вставьте текст, который нужно сократить…",
      translate: "Вставьте текст для перевода…",
      email:
        "Опишите, о чём должно быть письмо — кому, зачем и какие детали важны…",
    },

    toneLabels: {
      Clearer: "Понятнее",
      "More formal": "Формальнее",
      "More casual": "Более разговорно",
      "More concise": "Короче",
    },

    lengthLabels: {
      Short: "Коротко",
      Medium: "Средне",
      "Bullet points": "Списком",
    },

    emailToneLabels: {
      Friendly: "Дружелюбный",
      Professional: "Профессиональный",
      Direct: "Прямой",
      Apologetic: "Извиняющийся",
    },

    translatePrefix: "Перевести на",

    runLabels: {
      improve: "Улучшить",
      summarize: "Сократить",
      translate: "Перевести",
      email: "Создать письмо",
    },

    working: "Обработка…",

    resultTitle: "Результат",

    copy: "Копировать",
    copied: "Скопировано",

    errorPrefix: "Что-то пошло не так — ",

    errors: {
      timeout:
        "Сервер слишком долго не отвечает. Попробуйте ещё раз.",
      network:
        "Не удалось связаться с сервером. Проверьте соединение.",
    },

    charCounter: (count) => `${count} / ${MAX_INPUT_CHARS}`,

    footer:
      "Работает на AI — проверяйте важные факты перед использованием.",

    nextStepTitle: "Что дальше?",

    actions: {
      shorten: "Короче",
      formal: "Формальнее",
      casual: "Разговорнее",
      improve: "Улучшить",
      shortenMore: "Сократить ещё",
      translate: "Перевести",
      email: "Письмо",
      otherLanguage: "Другой язык",
      friendly: "Дружелюбнее",
      copy: "Копировать",
    },

    chooseLanguage: "Выберите язык",
    translateAction: "Перевести",
  },

  en: {
    eyebrow: "FREE AI TOOLS",
    subtitle:
      "Four simple AI writing tools — free, no account.",

    tools: {
      improve: "Improve",
      summarize: "Summarize",
      translate: "Translate",
      email: "Email",
    },

    placeholders: {
      improve: "Paste the text you want to improve…",
      summarize: "Paste the text you want summarized…",
      translate: "Paste the text you want translated…",
      email:
        "Describe what the email needs to say — who it's to, the purpose, any key details…",
    },

    toneLabels: {
      Clearer: "Clearer",
      "More formal": "More formal",
      "More casual": "More casual",
      "More concise": "More concise",
    },

    lengthLabels: {
      Short: "Short",
      Medium: "Medium",
      "Bullet points": "Bullet points",
    },

    emailToneLabels: {
      Friendly: "Friendly",
      Professional: "Professional",
      Direct: "Direct",
      Apologetic: "Apologetic",
    },

    translatePrefix: "Translate to",

    runLabels: {
      improve: "Improve",
      summarize: "Summarize",
      translate: "Translate",
      email: "Write email",
    },

    working: "Working…",

    resultTitle: "Your result",

    copy: "Copy",
    copied: "Copied",

    errorPrefix: "Something went wrong — ",

    errors: {
      timeout:
        "The server took too long to respond. Please try again.",
      network:
        "Couldn't reach the server. Check your connection.",
    },

    charCounter: (count) => `${count} / ${MAX_INPUT_CHARS}`,

    footer:
      "Powered by AI — double-check anything important.",

    nextStepTitle: "What next?",

    actions: {
      shorten: "Shorter",
      formal: "More formal",
      casual: "More casual",
      improve: "Improve",
      shortenMore: "Shorten more",
      translate: "Translate",
      email: "Email",
      otherLanguage: "Other language",
      friendly: "Friendlier",
      copy: "Copy",
    },

    chooseLanguage: "Choose a language",
    translateAction: "Translate",
  },
};

/* =========================================================================
 * HELPERS
 * ======================================================================= */

function inputFor(toolId, state) {
  return (
    {
      improve: state.improveText,
      summarize: state.summarizeText,
      translate: state.translateText,
      email: state.emailText,
    }[toolId] || ""
  );
}

function optionsFor(toolId, state) {
  switch (toolId) {
    case "improve":
      return {
        tone: state.tone,
      };

    case "summarize":
      return {
        length: state.length,
      };

    case "translate":
      return {
        language: state.language,
      };

    case "email":
      return {
        emailTone: state.emailTone,
      };

    default:
      return {};
  }
}

/* =========================================================================
 * GLOBAL STYLES
 * ======================================================================= */

function GlobalStyles() {
  return (
    <style>{`
      @keyframes toolkit-fade-in {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes toolkit-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .toolkit-fade-in {
        animation: toolkit-fade-in 220ms ease;
      }

      .toolkit-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: #FFFFFF;
        animation: toolkit-spin 700ms linear infinite;
        vertical-align: -2px;
        margin-right: 8px;
      }

      .toolkit-run-btn:hover:not(:disabled) {
        filter: brightness(0.93);
      }

      .toolkit-run-btn:active:not(:disabled) {
        transform: scale(0.985);
      }

      .toolkit-tab:hover:not(.toolkit-tab-active) {
        background: rgba(27,42,58,0.04);
      }

      .toolkit-chip:hover:not(.toolkit-chip-active) {
        border-color: #9FB0BC;
      }

      .toolkit-lang-btn:hover:not(.toolkit-lang-active) {
        background: rgba(27,42,58,0.05);
      }

      .toolkit-copy-btn:hover {
        background: rgba(226,98,45,0.08);
      }

      .toolkit-next-btn:hover {
        border-color: #9FB0BC;
        background: #F8FAFB;
      }

      .toolkit-next-btn:active {
        transform: scale(0.985);
      }

      .toolkit-textarea:focus,
      .toolkit-select:focus {
        outline: none;
        border-color: #E2622D;
        box-shadow: 0 0 0 3px rgba(226,98,45,0.14);
      }

      .toolkit-textarea,
      .toolkit-select,
      .toolkit-run-btn,
      .toolkit-chip,
      .toolkit-tab,
      .toolkit-next-btn {
        transition:
          background 140ms ease,
          border-color 140ms ease,
          box-shadow 140ms ease,
          color 140ms ease,
          transform 100ms ease,
          filter 140ms ease;
      }

      @media (max-width: 430px) {
        .toolkit-tabs {
          overflow-x: auto;
          scrollbar-width: none;
        }

        .toolkit-tabs::-webkit-scrollbar {
          display: none;
        }

        .toolkit-tab {
          min-width: 92px !important;
        }

        .toolkit-container {
          padding-left: 12px !important;
          padding-right: 12px !important;
        }

        .toolkit-card,
        .toolkit-result {
          padding: 16px !important;
        }
      }
    `}</style>
  );
}

/* =========================================================================
 * SMALL UI
 * ======================================================================= */

function Crosshair({ color }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      style={{
        display: "block",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <line
        x1="5"
        y1="0"
        x2="5"
        y2="10"
        stroke={color}
        strokeWidth="1"
      />

      <line
        x1="0"
        y1="5"
        x2="10"
        y2="5"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}

function LangSwitcher({ lang, setLang }) {
  const makeButton = (code, label) => (
    <button
      key={code}
      onClick={() => setLang(code)}
      className={
        "toolkit-lang-btn" +
        (lang === code ? " toolkit-lang-active" : "")
      }
      aria-pressed={lang === code}
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
        padding: "6px 11px",
        border: "none",
        cursor: "pointer",
        background:
          lang === code ? COLOR.ink : "transparent",
        color:
          lang === code ? "#FFFFFF" : COLOR.muted,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid ${COLOR.line}`,
        borderRadius: 999,
        overflow: "hidden",
        background: COLOR.surface,
      }}
    >
      {makeButton("ru", "RU")}
      {makeButton("en", "EN")}
    </div>
  );
}

function CopyButton({
  label,
  copiedLabel,
  text,
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch (_) {
      // Ignore clipboard errors.
    }
  };

  return (
    <button
      onClick={copy}
      className="toolkit-copy-btn"
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: copied ? COLOR.accent2 : COLOR.accent,
        background: "transparent",
        border: `1px solid ${COLOR.line}`,
        borderRadius: 6,
        padding: "6px 13px",
        cursor: "pointer",
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
  accent,
}) {
  return (
    <button
      onClick={onClick}
      className={
        "toolkit-chip" +
        (active ? " toolkit-chip-active" : "")
      }
      style={{
        fontFamily: FONT_BODY,
        fontSize: 13,
        fontWeight: 500,
        padding: "7px 13px",
        borderRadius: 999,
        border: active
          ? `1px solid ${accent}`
          : `1px solid ${COLOR.line}`,
        background: active
          ? accent
          : COLOR.surface,
        color: active
          ? "#FFFFFF"
          : COLOR.ink,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* =========================================================================
 * NEXT STEP ACTIONS
 * ======================================================================= */

function NextStep({
  actions,
  onAction,
  showLanguagePicker,
  language,
  setLanguage,
  languages,
  languageLabel,
  translateActionLabel,
  accent,
}) {
  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: `1px solid ${COLOR.line}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 9,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: COLOR.muted,
          }}
        >
          {actions.title}
        </span>

        <Crosshair color={accent} />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
        }}
      >
        {actions.items.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="toolkit-next-btn"
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 11px",
              borderRadius: 8,
              border: `1px solid ${COLOR.line}`,
              background: COLOR.surface,
              color:
                action.accent === "teal"
                  ? COLOR.accent2
                  : COLOR.ink,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {showLanguagePicker && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 7,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: COLOR.muted,
              fontWeight: 600,
            }}
          >
            {languageLabel}
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="toolkit-select"
            style={{
              ...selectStyle,
              marginTop: 0,
            }}
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            onClick={() => onAction("translate-selected")}
            className="toolkit-run-btn"
            style={{
              width: "100%",
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 650,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: accent,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            {translateActionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * ACTION MAP
 * ======================================================================= */

function getNextActions(activeTool, tr) {
  switch (activeTool) {
    case "improve":
      return {
        title: tr.nextStepTitle,
        items: [
          {
            id: "shorten",
            label: tr.actions.shorten,
          },
          {
            id: "formal",
            label: tr.actions.formal,
          },
          {
            id: "casual",
            label: tr.actions.casual,
          },
          {
            id: "translate",
            label: tr.actions.translate,
          },
        ],
      };

    case "summarize":
      return {
        title: tr.nextStepTitle,
        items: [
          {
            id: "improve",
            label: tr.actions.improve,
          },
          {
            id: "shorten",
            label: tr.actions.shortenMore,
          },
          {
            id: "translate",
            label: tr.actions.translate,
          },
          {
            id: "email",
            label: tr.actions.email,
          },
        ],
      };

    case "translate":
      return {
        title: tr.nextStepTitle,
        items: [
          {
            id: "other-language",
            label: tr.actions.otherLanguage,
          },
          {
            id: "improve",
            label: tr.actions.improve,
          },
          {
            id: "shorten",
            label: tr.actions.shorten,
          },
        ],
      };

    case "email":
      return {
        title: tr.nextStepTitle,
        items: [
          {
            id: "shorten",
            label: tr.actions.shorten,
          },
          {
            id: "formal",
            label: tr.actions.formal,
          },
          {
            id: "friendly",
            label: tr.actions.friendly,
          },
        ],
      };

    default:
      return {
        title: tr.nextStepTitle,
        items: [],
      };
  }
}

/* =========================================================================
 * MAIN APP
 * ======================================================================= */

function App() {
  const [lang, setLangState] = useState(() => {
    try {
      return (
        localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        ) || "ru"
      );
    } catch (_) {
      return "ru";
    }
  });

  const tr = STRINGS[lang];

  const setLang = (code) => {
    setLangState(code);

    try {
      localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        code
      );
    } catch (_) {
      // Ignore localStorage problems.
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;

    document.title =
      lang === "ru"
        ? "Toolkit — Бесплатные AI-инструменты"
        : "Toolkit — Free AI Tools";
  }, [lang]);

  const [activeTool, setActiveTool] =
    useState("improve");

  const [state, setState] = useState({
    improveText: "",
    tone: TONES[0],

    summarizeText: "",
    length: LENGTHS[0],

    translateText: "",
    language: LANGUAGES[0],

    emailText: "",
    emailTone: EMAIL_TONES[0],
  });

  const [output, setOutput] = useState({});

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showLanguagePicker, setShowLanguagePicker] =
    useState(false);

  const outputRef = useRef(null);

  const set = (patch) =>
    setState((current) => ({
      ...current,
      ...patch,
    }));

  const currentInput =
    inputFor(activeTool, state);

  const charCount =
    currentInput.length;

  const overLimit =
    charCount >= MAX_INPUT_CHARS;

  const canRun =
    currentInput.trim().length > 0 &&
    !loading;

  const accent =
    activeTool === "email"
      ? COLOR.accent2
      : COLOR.accent;

  /* -----------------------------------------------------------------------
   * Standard tool run
   * --------------------------------------------------------------------- */

  const run = async () => {
    if (!currentInput.trim()) {
      setError(
        lang === "ru"
          ? "Сначала введите текст."
          : "Please enter some text first."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await runTool(
        activeTool,
        currentInput,
        optionsFor(activeTool, state)
      );

      setOutput((current) => ({
        ...current,
        [activeTool]: result,
      }));

      setShowLanguagePicker(false);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    } catch (e) {
      const detail =
        e.code === "timeout" ||
        e.code === "network"
          ? tr.errors[e.code]
          : e.message;

      setError(
        tr.errorPrefix + detail
      );
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------------------
   * Quick action runner
   * --------------------------------------------------------------------- */

  const runNextAction = async (actionId) => {
    const currentResult =
      output[activeTool];

    if (!currentResult) {
      return;
    }

    if (actionId === "copy") {
      try {
        await navigator.clipboard.writeText(
          currentResult
        );
      } catch (_) {
        // Ignore clipboard errors.
      }

      return;
    }

    if (actionId === "other-language") {
      setShowLanguagePicker(true);
      return;
    }

    setShowLanguagePicker(false);
    setError("");
    setLoading(true);

    let nextTool = activeTool;
    let nextInput = currentResult;
    let nextOptions = {};

    switch (actionId) {
      case "shorten":
        nextTool =
          activeTool === "summarize"
            ? "summarize"
            : "improve";

        nextInput = currentResult;

        nextOptions =
          nextTool === "summarize"
            ? { length: "Short" }
            : { tone: "More concise" };

        break;

      case "formal":
        nextTool = "improve";
        nextInput = currentResult;
        nextOptions = {
          tone: "More formal",
        };
        break;

      case "casual":
        nextTool = "improve";
        nextInput = currentResult;
        nextOptions = {
          tone: "More casual",
        };
        break;

      case "friendly":
        nextTool = "email";
        nextInput = currentResult;
        nextOptions = {
          emailTone: "Friendly",
        };
        break;

      case "improve":
        nextTool = "improve";
        nextInput = currentResult;
        nextOptions = {
          tone: "Clearer",
        };
        break;

      case "translate":
        nextTool = "translate";
        nextInput = currentResult;
        nextOptions = {
          language:
            state.language,
        };
        break;

      case "email":
        nextTool = "email";
        nextInput = currentResult;
        nextOptions = {
          emailTone:
            state.emailTone,
        };
        break;

      case "translate-selected":
        nextTool = "translate";
        nextInput = currentResult;
        nextOptions = {
          language:
            state.language,
        };
        break;

      default:
        setLoading(false);
        return;
    }

    /*
     * Put the current result into the target tool's input.
     * This makes the transition visible in the interface
     * and also lets the user continue editing it manually.
     */

    if (nextTool === "improve") {
      set({
        improveText: nextInput,
        tone:
          nextOptions.tone ||
          state.tone,
      });
    }

    if (nextTool === "summarize") {
      set({
        summarizeText: nextInput,
        length:
          nextOptions.length ||
          state.length,
      });
    }

    if (nextTool === "translate") {
      set({
        translateText: nextInput,
        language:
          nextOptions.language ||
          state.language,
      });
    }

    if (nextTool === "email") {
      set({
        emailText: nextInput,
        emailTone:
          nextOptions.emailTone ||
          state.emailTone,
      });
    }

    try {
      const result = await runTool(
        nextTool,
        nextInput,
        nextOptions
      );

      setActiveTool(nextTool);

      setOutput((current) => ({
        ...current,
        [nextTool]: result,
      }));

      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 70);
    } catch (e) {
      const detail =
        e.code === "timeout" ||
        e.code === "network"
          ? tr.errors[e.code]
          : e.message;

      setError(
        tr.errorPrefix + detail
      );
    } finally {
      setLoading(false);
    }
  };

  const nextActions =
    getNextActions(
      activeTool,
      tr
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLOR.bg,
        fontFamily: FONT_BODY,
        color: COLOR.ink,
        padding:
          "20px 16px 40px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <GlobalStyles />

      <div
        className="toolkit-container"
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        {/* ---------------------------------------------------------------
         * TOP ROW
         * ------------------------------------------------------------- */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            marginBottom: 14,
          }}
        >
          <Crosshair
            color={COLOR.muted}
          />

          <LangSwitcher
            lang={lang}
            setLang={setLang}
          />
        </div>

        {/* ---------------------------------------------------------------
         * HEADER
         * ------------------------------------------------------------- */}

        <div
          style={{
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <span
            style={{
              display:
                "inline-block",
              fontFamily:
                FONT_BODY,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing:
                "0.06em",
              color: COLOR.accent,
              background:
                "rgba(226,98,45,0.10)",
              borderRadius: 999,
              padding: "4px 11px",
              marginBottom: 10,
            }}
          >
            {tr.eyebrow}
          </span>

          <h1
            style={{
              fontFamily:
                FONT_HEAD,
              fontWeight: 700,
              fontSize: 30,
              margin: 0,
              letterSpacing:
                "-0.01em",
            }}
          >
            Toolkit
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              fontSize: 13.5,
              color: COLOR.muted,
              lineHeight: 1.5,
            }}
          >
            {tr.subtitle}
          </p>
        </div>

        {/* ---------------------------------------------------------------
         * TOOL NAVIGATION
         * ------------------------------------------------------------- */}

        <div
          className="toolkit-tabs"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: 4,
            marginBottom: 12,
            background:
              "rgba(27,42,58,0.045)",
            border:
              `1px solid ${COLOR.line}`,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {TOOL_IDS.map((id) => {
            const isActive =
              id === activeTool;

            const tabAccent =
              id === "email"
                ? COLOR.accent2
                : COLOR.accent;

            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTool(id);
                  setError("");
                  setShowLanguagePicker(
                    false
                  );
                }}
                className={
                  "toolkit-tab" +
                  (isActive
                    ? " toolkit-tab-active"
                    : "")
                }
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding:
                    "9px 3px",
                  cursor:
                    "pointer",
                  borderRadius: 8,
                  border: "none",
                  background:
                    isActive
                      ? COLOR.surface
                      : "transparent",
                  color:
                    isActive
                      ? tabAccent
                      : COLOR.muted,
                  boxShadow:
                    isActive
                      ? "0 1px 2px rgba(27,42,58,0.10)"
                      : "none",
                  minWidth: 0,
                  whiteSpace:
                    "nowrap",
                }}
              >
                {tr.tools[id]}
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------------------
         * MAIN WORKSPACE
         * ------------------------------------------------------------- */}

        <div
          className="toolkit-card"
          style={{
            background:
              COLOR.surface,
            border:
              `1px solid ${COLOR.line}`,
            borderRadius: 14,
            padding: 20,
            boxShadow:
              "0 1px 2px rgba(27,42,58,0.04), 0 10px 28px rgba(27,42,58,0.05)",
          }}
        >
          {activeTool === "improve" && (
            <>
              <textarea
                value={
                  state.improveText
                }
                onChange={(e) =>
                  set({
                    improveText:
                      e.target.value,
                  })
                }
                placeholder={
                  tr.placeholders.improve
                }
                rows={6}
                maxLength={
                  MAX_INPUT_CHARS
                }
                className="toolkit-textarea"
                style={taStyle}
              />

              <CharCounter
                count={charCount}
                overLimit={overLimit}
                tr={tr}
              />

              <div
                style={rowStyle}
              >
                {TONES.map((tone) => (
                  <Chip
                    key={tone}
                    active={
                      state.tone ===
                      tone
                    }
                    onClick={() =>
                      set({
                        tone,
                      })
                    }
                    accent={accent}
                  >
                    {tr.toneLabels[tone]}
                  </Chip>
                ))}
              </div>
            </>
          )}

          {activeTool === "summarize" && (
            <>
              <textarea
                value={
                  state.summarizeText
                }
                onChange={(e) =>
                  set({
                    summarizeText:
                      e.target.value,
                  })
                }
                placeholder={
                  tr.placeholders.summarize
                }
                rows={6}
                maxLength={
                  MAX_INPUT_CHARS
                }
                className="toolkit-textarea"
                style={taStyle}
              />

              <CharCounter
                count={charCount}
                overLimit={overLimit}
                tr={tr}
              />

              <div
                style={rowStyle}
              >
                {LENGTHS.map(
                  (length) => (
                    <Chip
                      key={length}
                      active={
                        state.length ===
                        length
                      }
                      onClick={() =>
                        set({
                          length,
                        })
                      }
                      accent={accent}
                    >
                      {
                        tr
                          .lengthLabels[
                          length
                        ]
                      }
                    </Chip>
                  )
                )}
              </div>
            </>
          )}

          {activeTool === "translate" && (
            <>
              <textarea
                value={
                  state.translateText
                }
                onChange={(e) =>
                  set({
                    translateText:
                      e.target.value,
                  })
                }
                placeholder={
                  tr.placeholders.translate
                }
                rows={6}
                maxLength={
                  MAX_INPUT_CHARS
                }
                className="toolkit-textarea"
                style={taStyle}
              />

              <CharCounter
                count={charCount}
                overLimit={overLimit}
                tr={tr}
              />

              <div
                style={{
                  marginTop: 10,
                }}
              >
                <select
                  value={
                    state.language
                  }
                  onChange={(e) =>
                    set({
                      language:
                        e.target.value,
                    })
                  }
                  className="toolkit-select"
                  style={
                    selectStyle
                  }
                >
                  {LANGUAGES.map(
                    (language) => (
                      <option
                        key={language}
                        value={language}
                      >
                        {
                          tr.translatePrefix
                        }{" "}
                        {language}
                      </option>
                    )
                  )}
                </select>
              </div>
            </>
          )}

          {activeTool === "email" && (
            <>
              <textarea
                value={
                  state.emailText
                }
                onChange={(e) =>
                  set({
                    emailText:
                      e.target.value,
                  })
                }
                placeholder={
                  tr.placeholders.email
                }
                rows={6}
                maxLength={
                  MAX_INPUT_CHARS
                }
                className="toolkit-textarea"
                style={taStyle}
              />

              <CharCounter
                count={charCount}
                overLimit={overLimit}
                tr={tr}
              />

              <div
                style={rowStyle}
              >
                {EMAIL_TONES.map(
                  (tone) => (
                    <Chip
                      key={tone}
                      active={
                        state.emailTone ===
                        tone
                      }
                      onClick={() =>
                        set({
                          emailTone:
                            tone,
                        })
                      }
                      accent={accent}
                    >
                      {
                        tr
                          .emailToneLabels[
                          tone
                        ]
                      }
                    </Chip>
                  )
                )}
              </div>
            </>
          )}

          {/* -------------------------------------------------------------
           * MAIN BUTTON
           * ----------------------------------------------------------- */}

          <button
            onClick={run}
            disabled={!canRun}
            className="toolkit-run-btn"
            style={{
              marginTop: 16,
              width: "100%",
              fontFamily: FONT_BODY,
              fontSize: 15,
              fontWeight: 600,
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background:
                canRun
                  ? accent
                  : COLOR.line,
              color:
                canRun
                  ? "#FFFFFF"
                  : "#8496A3",
              cursor:
                canRun
                  ? "pointer"
                  : "default",
            }}
          >
            {loading && (
              <span
                className="toolkit-spinner"
                aria-hidden="true"
              />
            )}

            {loading
              ? tr.working
              : tr.runLabels[
                  activeTool
                ]}
          </button>

          {/* -------------------------------------------------------------
           * ERROR
           * ----------------------------------------------------------- */}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                background:
                  COLOR.errorBg,
                border:
                  `1px solid ${COLOR.errorBorder}`,
                color:
                  COLOR.errorText,
                fontSize: 13,
                lineHeight: 1.5,
                borderRadius: 8,
                padding:
                  "10px 12px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------
         * RESULT + NEXT STEP
         * ------------------------------------------------------------- */}

        {output[activeTool] && (
          <div
            ref={outputRef}
            className={
              "toolkit-result toolkit-fade-in"
            }
            style={{
              marginTop: 14,
              background:
                COLOR.surface,
              border:
                `1px solid ${COLOR.line}`,
              borderRadius: 14,
              padding: 20,
              boxShadow:
                "0 1px 2px rgba(27,42,58,0.04), 0 10px 28px rgba(27,42,58,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius:
                      "50%",
                    background:
                      accent,
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing:
                      "0.06em",
                    textTransform:
                      "uppercase",
                    color:
                      COLOR.muted,
                  }}
                >
                  {tr.resultTitle}
                </span>
              </div>

              <CopyButton
                label={tr.copy}
                copiedLabel={
                  tr.copied
                }
                text={
                  output[
                    activeTool
                  ]
                }
              />
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                whiteSpace:
                  "pre-wrap",
                color: COLOR.ink,
              }}
            >
              {output[activeTool]}
            </div>

            {/* NEXT STEP */}

            <NextStep
              actions={{
                title:
                  nextActions.title,
                items:
                  nextActions.items.map(
                    (action) => ({
                      ...action,
                      accent:
                        activeTool ===
                          "email" &&
                        action.id ===
                          "friendly"
                          ? "teal"
                          : "orange",
                    })
                  ),
              }}
              onAction={
                runNextAction
              }
              showLanguagePicker={
                showLanguagePicker
              }
              language={
                state.language
              }
              setLanguage={(value) =>
                set({
                  language:
                    value,
                })
              }
              languages={
                LANGUAGES
              }
              languageLabel={
                tr.chooseLanguage
              }
              translateActionLabel={
                tr.translateAction
              }
              accent={accent}
            />
          </div>
        )}

        {/* ---------------------------------------------------------------
         * FOOTER
         * ------------------------------------------------------------- */}

        <p
          style={{
            marginTop: 22,
            marginBottom: 0,
            textAlign: "center",
            fontSize: 12,
            color: COLOR.muted,
          }}
        >
          {tr.footer}
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
 * CHAR COUNTER
 * ======================================================================= */

function CharCounter({
  count,
  overLimit,
  tr,
}) {
  return (
    <div
      style={{
        marginTop: 6,
        textAlign: "right",
        fontSize: 12,
        fontWeight:
          overLimit
            ? 600
            : 400,
        color:
          overLimit
            ? COLOR.errorText
            : COLOR.muted,
      }}
    >
      {tr.charCounter(count)}
    </div>
  );
}

/* =========================================================================
 * STYLES
 * ======================================================================= */

const taStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT_BODY,
  fontSize: 15,
  lineHeight: 1.55,
  padding: 13,
  borderRadius: 10,
  border:
    `1px solid ${COLOR.line}`,
  outline: "none",
  resize: "vertical",
  color: COLOR.ink,
  background: "#FBFCFD",
};

const rowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  marginTop: 12,
};

const selectStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT_BODY,
  fontSize: 14,
  fontWeight: 500,
  padding: "11px 12px",
  borderRadius: 10,
  border:
    `1px solid ${COLOR.line}`,
  background: "#FBFCFD",
  color: COLOR.ink,
  outline: "none",
};

/* =========================================================================
 * ENTRY POINT
 * ======================================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);