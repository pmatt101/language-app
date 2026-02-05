"use client";

import { useEffect, useState } from "react";

/* ---------- LIST CONFIG ---------- */
const LISTS = {
  sentences: {
    label: "Sentences",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbZ6UWGUng68JOm5sp82l8EY32fmvkwRsnmGRtIYzd1mBL6Z-Njq3ZdQuhd_XzHYcv2dTlVdikk0Lg/pub?output=csv",
  },
  verbs: {
    label: "Verbs",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6CYwZKRmNqr3LXHnJAiDv0Q3nktIVN1mH-wVIVFQLLYde6EyXDIyJymA1H4k_hUCqA2W61wjc6nh9/pub?output=csv",
  },
};

type ListState = {
  items: string[];
  shuffled: string[];
  index: number;
};

export default function Home() {
  /* ---------- STATE ---------- */
  const [currentList, setCurrentList] = useState<"sentences" | "verbs">(
    "sentences"
  );
  const [state, setState] = useState<Record<string, ListState>>({
    sentences: { items: [], shuffled: [], index: 0 },
    verbs: { items: [], shuffled: [], index: 0 },
  });

  const [currentSentence, setCurrentSentence] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [targetVoiceLang, setTargetVoiceLang] = useState("es-ES");
  const [english, setEnglish] = useState("");
  const [target, setTarget] = useState("");
  const [progress, setProgress] = useState("");
  const [bar, setBar] = useState(0);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  /* ---------- VOICES ---------- */
  useEffect(() => {
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.onvoiceschanged = load;
  }, []);

  const getEnglishVoice = () =>
    voices.find(v => v.lang.startsWith("en-GB")) || voices[0];

  const getTargetVoice = () =>
    voices.find(v => v.lang === targetVoiceLang) ||
    voices.find(v => v.lang.startsWith(targetLang)) ||
    voices[0];

  /* ---------- UTILS ---------- */
  const shuffle = (array: string[]) => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- LOAD LIST ---------- */
  const loadList = async (name: "sentences" | "verbs") => {
    const res = await fetch(LISTS[name].url);
    const text = await res.text();
    const items = text
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    setState(prev => ({
      ...prev,
      [name]: {
        items,
        shuffled: shuffle(items),
        index: 0,
      },
    }));
  };

  /* ---------- SPEAK ENGLISH ---------- */
  const speakEnglish = async () => {
    const list = state[currentList];

    if (list.items.length === 0 || list.index >= list.shuffled.length) {
      await loadList(currentList);
      return;
    }

    const sentence = list.shuffled[list.index];

    setState(prev => ({
      ...prev,
      [currentList]: {
        ...list,
        index: list.index + 1,
      },
    }));

    setCurrentSentence(sentence);
    setEnglish(sentence);
    setTarget("");

    setProgress(
      `${LISTS[currentList].label}: ${list.index + 1} / ${list.shuffled.length}`
    );
    setBar(((list.index + 1) / list.shuffled.length) * 100);

    const msg = new SpeechSynthesisUtterance(sentence);
    msg.voice = getEnglishVoice();
    msg.lang = "en-GB";
    msg.rate = 0.95;
    speechSynthesis.speak(msg);
  };

  /* ---------- SPEAK TARGET ---------- */
  const speakTarget = async () => {
    if (!currentSentence) return;

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        currentSentence
      )}`
    );
    const data = await res.json();
    const translation = data[0].map((x: any) => x[0]).join("");

    setTarget(translation);

    const msg = new SpeechSynthesisUtterance(translation);
    msg.voice = getTargetVoice();
    msg.lang = targetVoiceLang;
    msg.rate = 0.95;
    speechSynthesis.speak(msg);
  };

  return (
    <div className="app">
      <h2>🎧 Listen & Speak</h2>

      <div className="card">
        <label>Practice list</label>
        <select
          value={currentList}
          onChange={e => setCurrentList(e.target.value as any)}
        >
          <option value="sentences">Sentences</option>
          <option value="verbs">Verbs</option>
        </select>

        <label>Target language</label>
        <select
          value={targetVoiceLang}
          onChange={e => {
            setTargetVoiceLang(e.target.value);
            setTargetLang(e.target.value.split("-")[0]);
            setTarget("");
          }}
        >
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="it-IT">Italian</option>
          <option value="ru-RU">Russian</option>
        </select>

        <button className="primary" onClick={speakEnglish}>
          ▶️ Speak English
        </button>
        <button className="secondary" onClick={speakTarget}>
          🌍 Speak Translation
        </button>

        <div id="progress">{progress}</div>
        <progress value={bar} max={100}></progress>
      </div>

      <div className="card">
        <label>English</label>
        <div className="text">{english}</div>
      </div>

      <div className="card">
        <label>Translation</label>
        <div className="text">{target}</div>
      </div>
    </div>
  );
}
