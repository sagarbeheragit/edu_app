import { useState, useCallback } from "react";

// ─── Seeded PRNG ─────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 17) >>> 0) / 4294967296;
  };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min, max, rng) { return min + Math.floor(rng() * (max - min + 1)); }
function shuffle(arr, rng) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Math Generators ─────────────────────────────────────────────────
function genAddition(rng) {
  const a = randInt(1, 50, rng), b = randInt(1, 50, rng);
  return { q: `${a} + ${b} =`, a: `${a + b}` };
}
function genSubtraction(rng) {
  const a = randInt(10, 80, rng), b = randInt(1, a, rng);
  return { q: `${a} − ${b} =`, a: `${a - b}` };
}
function genMultiplication(rng) {
  const a = randInt(2, 12, rng), b = randInt(2, 12, rng);
  return { q: `${a} × ${b} =`, a: `${a * b}` };
}
function genDivision(rng) {
  const b = randInt(2, 12, rng), a = b * randInt(1, 10, rng);
  return { q: `${a} ÷ ${b} =`, a: `${a / b}` };
}
const wordTemplates = [
  (rng) => { const a = randInt(3,20,rng), b = randInt(1,a,rng); return { q:`Sam has ${a} apples. He eats ${b}. How many are left?`, a:`${a-b}` }; },
  (rng) => { const a = randInt(5,30,rng), b = randInt(3,20,rng); return { q:`A box has ${a} crayons. You add ${b} more. How many in total?`, a:`${a+b}` }; },
  (rng) => { const bags=randInt(2,8,rng), each=randInt(2,10,rng); return { q:`There are ${bags} bags with ${each} oranges each. How many oranges in all?`, a:`${bags*each}` }; },
  (rng) => { const g=pick([2,3,4,5,6],rng), t=g*randInt(3,10,rng); return { q:`A teacher splits ${t} students into groups of ${g}. How many groups?`, a:`${t/g}` }; },
  (rng) => { const a=randInt(10,40,rng), b=randInt(10,40,rng); return { q:`Lisa reads ${a} pages on Monday and ${b} on Tuesday. How many pages total?`, a:`${a+b}` }; },
  (rng) => { const p=randInt(5,30,rng), q=randInt(2,5,rng); return { q:`Each book costs $${p}. You buy ${q} books. How much do you spend?`, a:`$${p*q}` }; },
  (rng) => { const t=randInt(20,50,rng), g=randInt(5,t-3,rng); return { q:`You have $${t}. You give away $${g}. How much is left?`, a:`$${t-g}` }; },
  (rng) => { const a=randInt(3,9,rng), b=randInt(3,9,rng), c=randInt(1,5,rng); return { q:`There are ${a} red, ${b} blue, and ${c} green marbles. How many altogether?`, a:`${a+b+c}` }; },
];

// ─── English Pools ───────────────────────────────────────────────────
const vocabBank = [
  {word:"brave",def:"Not afraid of danger."},{word:"cold",def:"Having a low temperature."},
  {word:"happy",def:"Feeling joy and cheerfulness."},{word:"tiny",def:"Very small in size."},
  {word:"bright",def:"Full of light or sunshine."},{word:"fast",def:"Moving quickly."},
  {word:"kind",def:"Showing care for others."},{word:"loud",def:"Making a lot of noise."},
  {word:"soft",def:"Not hard or rough."},{word:"tall",def:"Very high in height."},
  {word:"dark",def:"Having very little light."},{word:"empty",def:"Containing nothing inside."},
  {word:"calm",def:"Peaceful and quiet."},{word:"heavy",def:"Having a lot of weight."},
  {word:"clean",def:"Free from dirt or dust."},
];
const grammarPool = [
  {wrong:"the cat sat on the mat.",right:"The cat sat on the mat."},
  {wrong:"I like to plays soccer.",right:"I like to play soccer."},
  {wrong:"She goed to the store yesterday.",right:"She went to the store yesterday."},
  {wrong:"Him is my best friend.",right:"He is my best friend."},
  {wrong:"Are you want some water?",right:"Do you want some water?"},
  {wrong:"the birds sings in the morning.",right:"The birds sing in the morning."},
  {wrong:"We has two dogs at home.",right:"We have two dogs at home."},
  {wrong:"she dont like spiders.",right:"She doesn't like spiders."},
  {wrong:"They is going to the park.",right:"They are going to the park."},
  {wrong:"I bringed my lunch today.",right:"I brought my lunch today."},
  {wrong:"him and me are brothers.",right:"He and I are brothers."},
  {wrong:"the flowers is very pretty.",right:"The flowers are very pretty."},
];
const passages = [
  { text:"The Sun is a star. It is very far away, but we can still feel its heat and see its light every day. Plants need sunlight to grow. Animals and people also need the Sun to stay healthy. At night, the Sun goes below the horizon and it gets dark. That is why we sleep at night and are awake during the day.",
    questions:[{q:"What is the Sun?",a:"The Sun is a star."},{q:"Why do plants need sunlight?",a:"Plants need sunlight to grow."},{q:"Why does it get dark at night?",a:"The Sun goes below the horizon."},{q:"Name one thing animals need the Sun for.",a:"To stay healthy."}]},
  { text:"Dogs are friendly animals. They come in many shapes and sizes. Some dogs are big and strong. Others are small and fluffy. Dogs can learn tricks like sit, shake, and roll over. They love to play fetch and go on walks. Dogs are often called man's best friend because they are loyal and loving.",
    questions:[{q:"What are some tricks dogs can learn?",a:"Sit, shake, and roll over."},{q:"Why are dogs called man's best friend?",a:"Because they are loyal and loving."},{q:"What do dogs love to do?",a:"Play fetch and go on walks."},{q:"Name two sizes dogs can be.",a:"Big and small."}]},
  { text:"Rain is very important for life on Earth. It helps rivers and lakes stay full of water. Plants drink water from the ground after it rains. Farmers need rain to help their crops grow. Sometimes it rains too much and there can be floods. Other times it does not rain enough and the land becomes dry. We need just the right amount of rain.",
    questions:[{q:"Why is rain important for plants?",a:"Plants drink water from the ground."},{q:"What happens when it rains too much?",a:"There can be floods."},{q:"Who needs rain to help crops grow?",a:"Farmers."},{q:"What happens when it does not rain enough?",a:"The land becomes dry."}]},
  { text:"The ocean is the largest body of water on Earth. It covers more than half of the planet. Many animals live in the ocean, like fish, whales, and dolphins. The ocean is very deep in some places. Sailors use boats to travel across the ocean. The waves in the ocean are caused by the wind blowing over the water.",
    questions:[{q:"What is the largest body of water on Earth?",a:"The ocean."},{q:"Name two animals that live in the ocean.",a:"Fish and whales (or dolphins)."},{q:"What causes waves in the ocean?",a:"The wind blowing over the water."},{q:"How do sailors travel across the ocean?",a:"By using boats."}]},
];
const writingPrompts = [
  "My favourite animal is","On weekends I like to","The best part of school is",
  "If I could fly, I would","My favourite food is","The funniest thing that happened to me was",
  "I want to be a ___ when I grow up because","My best friend is special because",
  "If I had a superpower, it would be","My happiest memory is",
];

// ─── Master Generator ────────────────────────────────────────────────
function generateWorksheet(seed) {
  const rng = mulberry32(seed);
  const math = {
    addition:       Array.from({length:5}, () => genAddition(rng)),
    subtraction:    Array.from({length:5}, () => genSubtraction(rng)),
    multiplication: Array.from({length:5}, () => genMultiplication(rng)),
    division:       Array.from({length:5}, () => genDivision(rng)),
    wordProblems:   shuffle(wordTemplates, rng).slice(0,5).map(fn => fn(rng)),
  };
  const english = {
    vocab:   shuffle(vocabBank, rng).slice(0,5),
    grammar: shuffle(grammarPool, rng).slice(0,5),
    passage: pick(passages, rng),
    writing: shuffle(writingPrompts, rng).slice(0,3),
  };
  return { seed, math, english };
}

// ─── Print Page ──────────────────────────────────────────────────────
function PrintPage({ ws, onClose }) {
  const mathAll = [...ws.math.addition,...ws.math.subtraction,...ws.math.multiplication,...ws.math.division,...ws.math.wordProblems];
  const eng = ws.english;
  const mathSections = [
    { title:"Addition (Grade 1–2)", items: ws.math.addition, startIdx: 1 },
    { title:"Subtraction (Grade 1–2)", items: ws.math.subtraction, startIdx: 6 },
    { title:"Multiplication (Grade 3–4)", items: ws.math.multiplication, startIdx: 11 },
    { title:"Division (Grade 3–4)", items: ws.math.division, startIdx: 16 },
    { title:"Word Problems (Grade 2–4)", items: ws.math.wordProblems, startIdx: 21 },
  ];

  const css = `
    @media print {
      .print-controls { display: none !important; }
      .print-overlay { background: transparent !important; padding: 0 !important; }
      .print-page { box-shadow: none !important; margin: 0 !important; padding: 40px 48px !important; page-break-after: always; }
    }
  `;

  const s = {
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", flexDirection:"column", alignItems:"center", overflowY:"auto", padding:"0 20px 40px" },
    controls:{ position:"sticky", top:0, zIndex:101, background:"#1e1e1e", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 24px", width:"100%", maxWidth:780, gap:12, borderRadius:"0 0 10px 10px" },
    page:{ background:"#fff", width:"100%", maxWidth:780, padding:"44px 48px 48px", boxShadow:"0 4px 28px rgba(0,0,0,0.16)", marginTop:20 },
    pageTitle:{ textAlign:"center", fontSize:23, fontWeight:800, color:"#1a1a1a", fontFamily:"'Georgia', serif", marginBottom:2 },
    pageSub:{ textAlign:"center", fontSize:12.5, color:"#999", marginBottom:24 },
    secTitle:{ fontSize:13.5, fontWeight:700, color:"#2E5090", fontFamily:"'Georgia', serif", marginTop:18, marginBottom:6, paddingBottom:3, borderBottom:"2px solid #d0dce8" },
    qRow:{ display:"flex", alignItems:"flex-start", gap:8, padding:"4px 0", fontSize:13, color:"#222" },
    qNum:{ minWidth:24, fontWeight:600, color:"#aaa", fontFamily:"monospace", fontSize:12.5 },
    blank:{ flex:1, borderBottom:"1px solid #bbb", minHeight:20, marginTop:2 },
    passage:{ background:"#f7f9fc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 14px", fontSize:12.5, lineHeight:1.7, color:"#333", marginBottom:8 },
  };

  return (
    <div className="print-overlay" style={s.overlay}>
      <style>{css}</style>
      {/* Controls */}
      <div className="print-controls" style={s.controls}>
        <span style={{ color:"#bbb", fontSize:13, fontWeight:600 }}>📄 Print Preview</span>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => window.print()} style={{ padding:"7px 20px", borderRadius:7, border:"none", background:"#4CAF50", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>🖨️ Print</button>
          <button onClick={onClose} style={{ padding:"7px 14px", borderRadius:7, border:"none", background:"#555", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>✕ Close</button>
        </div>
      </div>

      {/* MATH PAGE */}
      <div className="print-page" style={s.page}>
        <div style={s.pageTitle}>📐 Math Practice Worksheet</div>
        <div style={s.pageSub}>Grades 1 – 4 &nbsp;•&nbsp; Name: _________________ &nbsp;&nbsp; Date: _________________</div>
        {mathSections.map((sec,si) => (
          <div key={si}>
            <div style={s.secTitle}>{sec.title}</div>
            {sec.items.map((item,i) => (
              <div key={i} style={s.qRow}>
                <span style={s.qNum}>{sec.startIdx+i}.</span>
                <span style={{flex:"0 0 auto",maxWidth:"58%"}}>{item.q}</span>
                <div style={s.blank} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ENGLISH PAGE */}
      <div className="print-page" style={s.page}>
        <div style={s.pageTitle}>📖 English Practice Worksheet</div>
        <div style={s.pageSub}>Grades 1 – 4 &nbsp;•&nbsp; Name: _________________ &nbsp;&nbsp; Date: _________________</div>

        <div style={{...s.secTitle, color:"#2E7A4E"}}>Vocabulary – Match the Word</div>
        <div style={{ fontSize:11.5, color:"#999", fontStyle:"italic", marginBottom:6 }}>Word Bank: {shuffle(eng.vocab, mulberry32(99)).map(v=>v.word).join("   •   ")}</div>
        {eng.vocab.map((it,i) => (
          <div key={i} style={s.qRow}><span style={s.qNum}>{i+1}.</span><span style={{flex:"0 0 auto",maxWidth:"62%"}}>{it.def}</span><div style={s.blank}/></div>
        ))}

        <div style={{...s.secTitle, color:"#2E5090"}}>Grammar – Correct the Sentence</div>
        <div style={{ fontSize:11.5, color:"#999", fontStyle:"italic", marginBottom:6 }}>Each sentence has one mistake. Rewrite it correctly.</div>
        {eng.grammar.map((it,i) => (
          <div key={i} style={s.qRow}><span style={s.qNum}>{i+6}.</span><span style={{flex:"0 0 auto",maxWidth:"62%"}}>"{it.wrong}"</span><div style={s.blank}/></div>
        ))}

        <div style={{...s.secTitle, color:"#8a6530"}}>Reading Comprehension</div>
        <div style={s.passage}>{eng.passage.text}</div>
        {eng.passage.questions.map((it,i) => (
          <div key={i} style={s.qRow}><span style={s.qNum}>{i+11}.</span><span style={{flex:"0 0 auto",maxWidth:"62%"}}>{it.q}</span><div style={s.blank}/></div>
        ))}

        <div style={{...s.secTitle, color:"#7a5a9e"}}>Writing – Complete the Sentence</div>
        <div style={{ fontSize:11.5, color:"#999", fontStyle:"italic", marginBottom:6 }}>Finish each sentence in your own words.</div>
        {eng.writing.map((p,i) => (
          <div key={i} style={s.qRow}><span style={s.qNum}>{i+15}.</span><span style={{flex:"0 0 auto"}}>{p}</span><div style={s.blank}/></div>
        ))}
      </div>

      {/* ANSWER KEY PAGE */}
      <div className="print-page" style={s.page}>
        <div style={s.pageTitle}>✔️ Answer Key</div>
        <div style={s.pageSub}>Math & English Practice Worksheet</div>
        <div style={{ display:"flex", gap:28, flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 200px" }}>
            <div style={{...s.secTitle, color:"#2E5090"}}>📐 Math</div>
            {mathAll.map((it,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #eee", fontSize:12.5 }}>
                <span style={{ color:"#aaa", fontFamily:"monospace", fontWeight:600 }}>{i+1}.</span>
                <span style={{ color:"#2E7A4E", fontWeight:700 }}>{it.a}</span>
              </div>
            ))}
          </div>
          <div style={{ flex:"1 1 200px" }}>
            <div style={{...s.secTitle, color:"#2E7A4E"}}>📖 English</div>
            {eng.vocab.map((it,i) => (<div key={`v${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #eee", fontSize:12.5 }}><span style={{ color:"#aaa", fontFamily:"monospace", fontWeight:600 }}>{i+1}.</span><span style={{ color:"#2E7A4E", fontWeight:700 }}>{it.word}</span></div>))}
            {eng.grammar.map((it,i) => (<div key={`g${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #eee", fontSize:12 }}><span style={{ color:"#aaa", fontFamily:"monospace", fontWeight:600 }}>{i+6}.</span><span style={{ color:"#2E7A4E", fontWeight:600, maxWidth:"76%", textAlign:"right" }}>{it.right}</span></div>))}
            {eng.passage.questions.map((it,i) => (<div key={`r${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #eee", fontSize:12 }}><span style={{ color:"#aaa", fontFamily:"monospace", fontWeight:600 }}>{i+11}.</span><span style={{ color:"#2E7A4E", fontWeight:600, maxWidth:"76%", textAlign:"right" }}>{it.a}</span></div>))}
            {eng.writing.map((_,i) => (<div key={`w${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #eee", fontSize:12 }}><span style={{ color:"#aaa", fontFamily:"monospace", fontWeight:600 }}>{i+15}.</span><span style={{ color:"#aaa", fontStyle:"italic" }}>Open-ended</span></div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [tab, setTab] = useState("math");
  const [showAnswers, setShowAnswers] = useState(false);
  const [printing, setPrinting] = useState(false);

  const generate = useCallback(() => {
    const seed = Date.now() + Math.floor(Math.random() * 100000);
    const ws = generateWorksheet(seed);
    setHistory(prev => {
      const next = prev.slice(0, currentIdx + 1);
      next.push(ws);
      setCurrentIdx(next.length - 1);
      return next;
    });
    setTab("math");
    setShowAnswers(false);
  }, [currentIdx]);

  const ws = currentIdx >= 0 && currentIdx < history.length ? history[currentIdx] : null;

  // ── Shared sub-components ──
  const SectionTitle = ({ children, color="#2E5090" }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:26, marginBottom:8 }}>
      <div style={{ width:5, height:20, borderRadius:3, background:color }} />
      <span style={{ fontSize:14.5, fontWeight:700, color, fontFamily:"'Georgia', serif" }}>{children}</span>
    </div>
  );
  const QRow = ({ num, question, answer }) => (
    <div style={{ display:"flex", alignItems:"flex-start", padding:"6px 0", borderBottom:"1px solid #ebe7df", gap:10 }}>
      <span style={{ fontSize:12.5, color:"#aaa", fontWeight:600, minWidth:26, paddingTop:1, fontFamily:"monospace" }}>{num}.</span>
      <span style={{ flex:1, fontSize:13.5, color:"#2c2c2c", lineHeight:1.55 }}>{question}</span>
      {showAnswers && <span style={{ fontSize:12.5, color:"#2E7A4E", fontWeight:700, background:"#eaf7ee", padding:"2px 8px", borderRadius:12, whiteSpace:"nowrap" }}>{answer}</span>}
    </div>
  );
  const BlankRow = ({ num, question }) => (
    <div style={{ padding:"6px 0", borderBottom:"1px solid #ebe7df", display:"flex", alignItems:"flex-start", gap:10 }}>
      <span style={{ fontSize:12.5, color:"#aaa", fontWeight:600, minWidth:26, paddingTop:1, fontFamily:"monospace" }}>{num}.</span>
      <span style={{ flex:1, fontSize:13.5, color:"#2c2c2c", lineHeight:1.55 }}>{question} <span style={{ color:"#c5bfb5" }}>____________________________</span></span>
    </div>
  );
  const Toggle = () => (
    <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12.5, color:"#7a7060", userSelect:"none" }}>
      <div onClick={() => setShowAnswers(!showAnswers)} style={{ width:36, height:20, borderRadius:10, background:showAnswers?"#2E7A4E":"#ccc5b8", position:"relative", transition:"background 0.25s", cursor:"pointer" }}>
        <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:showAnswers?18:2, transition:"left 0.25s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      Show Answers
    </label>
  );

  // ── Print overlay ──
  if (printing && ws) return <PrintPage ws={ws} onClose={() => setPrinting(false)} />;

  // ── Landing ──
  if (!ws) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fdf6ec 0%,#f0ebe3 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:24 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:10 }}>📚</div>
          <div style={{ fontSize:28, fontWeight:800, color:"#3a3028", fontFamily:"'Georgia', serif" }}>Worksheet Generator</div>
          <div style={{ fontSize:14, color:"#8a7f70", marginTop:6, maxWidth:420, lineHeight:1.6 }}>
            Generate unlimited unique Math & English worksheets on demand. Each one is completely different — hit the button as many times as you like, and print any of them.
          </div>
        </div>
        <button onClick={generate} style={{ padding:"14px 38px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#e8c87a,#d4a84b)", color:"#fff", fontSize:17, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 18px rgba(212,168,75,0.4)", letterSpacing:0.4 }}>
          ✨ Generate Worksheet
        </button>
      </div>
    );
  }

  // ── Sheet view ──
  const eng = ws.english;
  const tabs = [{ id:"math", label:"📐 Math" },{ id:"english", label:"📖 English" },{ id:"answers", label:"✔️ Answers" }];
  const mathAll = [...ws.math.addition,...ws.math.subtraction,...ws.math.multiplication,...ws.math.division,...ws.math.wordProblems];

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fdf6ec 0%,#f0ebe3 100%)", fontFamily:"'Segoe UI', sans-serif", padding:"20px 16px" }}>
      {/* Top bar */}
      <div style={{ maxWidth:700, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:19, fontWeight:800, color:"#3a3028", fontFamily:"'Georgia', serif" }}>📚 Worksheets</span>
          <span style={{ fontSize:11, background:"#e8dfd0", color:"#6b5f4e", padding:"3px 9px", borderRadius:10, fontWeight:700 }}>#{currentIdx + 1}</span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <button onClick={() => { if(currentIdx>0){ setCurrentIdx(c=>c-1); setTab("math"); setShowAnswers(false); }}} disabled={currentIdx<=0}
            style={{ padding:"6px 11px", borderRadius:8, border:"1.5px solid #d9d2c6", background:"#fff", color:currentIdx<=0?"#ccc":"#5a4e3c", fontSize:12.5, fontWeight:600, cursor:currentIdx<=0?"default":"pointer" }}>← Prev</button>
          <button onClick={() => { if(currentIdx<history.length-1){ setCurrentIdx(c=>c+1); setTab("math"); setShowAnswers(false); }}} disabled={currentIdx>=history.length-1}
            style={{ padding:"6px 11px", borderRadius:8, border:"1.5px solid #d9d2c6", background:"#fff", color:currentIdx>=history.length-1?"#ccc":"#5a4e3c", fontSize:12.5, fontWeight:600, cursor:currentIdx>=history.length-1?"default":"pointer" }}>Next →</button>
          <button onClick={generate}
            style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#e8c87a,#d4a84b)", color:"#fff", fontSize:12.5, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(212,168,75,0.35)" }}>✨ New</button>
          <button onClick={() => setPrinting(true)}
            style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#3a3028", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>🖨️ Print</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth:700, margin:"0 auto 8px", display:"flex", gap:5, justifyContent:"center" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowAnswers(false); }}
            style={{ padding:"7px 18px", borderRadius:22, border:"none", cursor:"pointer", fontSize:13.5, fontWeight:600,
              background:tab===t.id?"#3a3028":"rgba(255,255,255,0.7)",
              color:tab===t.id?"#fff":"#6b5f4e",
              boxShadow:tab===t.id?"0 2px 8px rgba(0,0,0,0.18)":"0 1px 3px rgba(0,0,0,0.06)",
              transition:"all 0.2s" }}>{t.label}</button>
        ))}
      </div>

      {/* Card */}
      <div style={{ maxWidth:700, margin:"10px auto 0", background:"#fff", borderRadius:16, boxShadow:"0 4px 24px rgba(0,0,0,0.07)", overflow:"hidden", border:"1px solid #ede8df" }}>
        <div style={{ height:5, background:"linear-gradient(90deg,#e8c87a,#d4a84b,#e8c87a)" }} />
        <div style={{ padding:"18px 22px 26px" }}>

          {/* MATH */}
          {tab==="math" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                <span style={{ fontSize:12, color:"#aaa", fontFamily:"monospace" }}>25 questions • Grades 1–4</span>
                <Toggle />
              </div>
              <SectionTitle color="#2E5090">Addition (Grade 1–2)</SectionTitle>
              {ws.math.addition.map((it,i) => <QRow key={i} num={i+1} question={it.q} answer={it.a} />)}
              <SectionTitle color="#2E5090">Subtraction (Grade 1–2)</SectionTitle>
              {ws.math.subtraction.map((it,i) => <QRow key={i} num={i+6} question={it.q} answer={it.a} />)}
              <SectionTitle color="#5a7a3a">Multiplication (Grade 3–4)</SectionTitle>
              {ws.math.multiplication.map((it,i) => <QRow key={i} num={i+11} question={it.q} answer={it.a} />)}
              <SectionTitle color="#5a7a3a">Division (Grade 3–4)</SectionTitle>
              {ws.math.division.map((it,i) => <QRow key={i} num={i+16} question={it.q} answer={it.a} />)}
              <SectionTitle color="#8a6530">Word Problems (Grade 2–4)</SectionTitle>
              {ws.math.wordProblems.map((it,i) => <QRow key={i} num={i+21} question={it.q} answer={it.a} />)}
            </>
          )}

          {/* ENGLISH */}
          {tab==="english" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                <span style={{ fontSize:12, color:"#aaa", fontFamily:"monospace" }}>15 questions • Grades 1–4</span>
                <Toggle />
              </div>
              <SectionTitle color="#2E7A4E">Vocabulary – Match the Word</SectionTitle>
              <div style={{ fontSize:12, color:"#8a7f70", marginBottom:8, fontStyle:"italic" }}>Word Bank: {shuffle(eng.vocab, mulberry32(42)).map(v=>v.word).join("   •   ")}</div>
              {eng.vocab.map((it,i) => <QRow key={i} num={i+1} question={it.def} answer={it.word} />)}
              <SectionTitle color="#2E5090">Grammar – Correct the Sentence</SectionTitle>
              <div style={{ fontSize:12, color:"#8a7f70", marginBottom:8, fontStyle:"italic" }}>Each sentence has one mistake. Rewrite it correctly.</div>
              {eng.grammar.map((it,i) => <QRow key={i} num={i+6} question={`"${it.wrong}"`} answer={it.right} />)}
              <SectionTitle color="#8a6530">Reading Comprehension</SectionTitle>
              <div style={{ background:"#faf7f0", border:"1px solid #ede8df", borderRadius:10, padding:"11px 15px", marginBottom:10, fontSize:13.5, color:"#3a3028", lineHeight:1.7 }}>{eng.passage.text}</div>
              {eng.passage.questions.map((it,i) => <QRow key={i} num={i+11} question={it.q} answer={it.a} />)}
              <SectionTitle color="#7a5a9e">Writing – Complete the Sentence</SectionTitle>
              <div style={{ fontSize:12, color:"#8a7f70", marginBottom:8, fontStyle:"italic" }}>Finish each sentence in your own words.</div>
              {eng.writing.map((p,i) => <BlankRow key={i} num={i+15} question={p} />)}
            </>
          )}

          {/* ANSWERS */}
          {tab==="answers" && (
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 220px" }}>
                <SectionTitle color="#2E5090">📐 Math Answers</SectionTitle>
                {mathAll.map((it,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #eee8df", fontSize:13 }}>
                    <span style={{ color:"#7a7060", fontWeight:600, fontFamily:"monospace" }}>{i+1}.</span>
                    <span style={{ color:"#2E7A4E", fontWeight:700 }}>{it.a}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex:"1 1 220px" }}>
                <SectionTitle color="#2E7A4E">📖 English Answers</SectionTitle>
                {eng.vocab.map((it,i) => (<div key={`v${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #eee8df", fontSize:13 }}><span style={{ color:"#7a7060", fontWeight:600, fontFamily:"monospace" }}>{i+1}.</span><span style={{ color:"#2E7A4E", fontWeight:700 }}>{it.word}</span></div>))}
                {eng.grammar.map((it,i) => (<div key={`g${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #eee8df", fontSize:12.5 }}><span style={{ color:"#7a7060", fontWeight:600, fontFamily:"monospace" }}>{i+6}.</span><span style={{ color:"#2E7A4E", fontWeight:600, maxWidth:"75%", textAlign:"right" }}>{it.right}</span></div>))}
                {eng.passage.questions.map((it,i) => (<div key={`r${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #eee8df", fontSize:12.5 }}><span style={{ color:"#7a7060", fontWeight:600, fontFamily:"monospace" }}>{i+11}.</span><span style={{ color:"#2E7A4E", fontWeight:600, maxWidth:"75%", textAlign:"right" }}>{it.a}</span></div>))}
                {eng.writing.map((_,i) => (<div key={`w${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #eee8df", fontSize:12.5 }}><span style={{ color:"#7a7060", fontWeight:600, fontFamily:"monospace" }}>{i+15}.</span><span style={{ color:"#aaa", fontStyle:"italic" }}>Open-ended</span></div>))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth:700, margin:"16px auto 0", textAlign:"center", fontSize:12, color:"#aaa" }}>
        💡 Hit <strong>✨ New</strong> anytime for a fresh sheet. Use <strong>← Prev / Next →</strong> to browse ones you already made.
      </div>
    </div>
  );
}
