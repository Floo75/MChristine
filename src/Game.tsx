console.log("Game.tsx version 1.1");

import React, { useEffect, useState, useRef } from "react";
import fiftyIcon from './assets/jokers/fifty.svg';
import phoneIcon from './assets/jokers/phone.svg';
import audienceIcon from './assets/jokers/audience.svg';

const MONEY_LADDER = [
  0,
  500,
  1000,
  2000,
  4000,
  8000,
  16000,
  32000,
  48000,
  72000,
  100000,
  500000,
  1000000,
];

const SECURED_LEVELS = [4, 8]; // Niveaux sécurisés (1-based)
const TOTAL_LEVELS = MONEY_LADDER.length - 1; // nombre de questions

interface Question {
  id: number;
  question: string;
  choices: string[];
  answerIndex: number;
  media?: {
    type: 'image' | 'video' | 'audio';
    src: string;
    alt?: string;
  };
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Combien existe-t-il de Caprices de Paganini ?",
    choices: ["24", "22", "99", "Je ne crois pas avoir eu cet élève"],
    answerIndex: 0,
  },
  {
    id: 2,
    question: "CHŒUR : Quel est le plus ancien chanteur du Chœur Mixte d’Adultes ?",
    choices: ["Véronique Idelot", "Régis Idelot", "Gérard Guenet", "Maria Callas"],
    answerIndex: 1,
  },
  {
    id: 3,
    question: "PERSO : En quelle année avez-vous reçu le Diplôme d’Aptitude pour l’Animation des Sociétés Musicales et Chorales (Direction Chorale)",
    choices: ["1985", "1986", "1987", "2026"],
    answerIndex: 1,
  },
  {
    id: 4,
    question: "Quel est ce chant ?",
    choices: ["Dies Irae (Verdi)", "Gloria (Vivaldi)", "Salve Regina (Liszt)", "La Marseillaise"],
    answerIndex: 0,
  },
  {
    id: 5,
    question: "VIOLON : De quel pays vient – originellement – le bois servant à fabriquer les archets ?",
    choices: ["Thaïlande", "Guyane", "Brésil", "Rien ne vaut un bel archet en carbone chinois"],
    answerIndex: 2,
  },
  {
    id: 6,
    question: "CONSERVATOIRE : Qui a été le premier directeur de la forme actuelle de l'École de Musique de Persan ?",
    choices: ["Arnaud Bazin", "Fernand Chatelain", "Marc Devisme", "Il n'y a eu que Patrick Laviron"],
    answerIndex: 2,
  },
  {
    id: 7,
    question: "CHŒUR : Vous avez pris la direction de la Chorale Mixte d’Adultes dès sa création. Mais en quelle date ?",
    choices: ["1978", "1985", "1988", "1789"],
    answerIndex: 1,
  },
  {
    id: 8,
    question: "Quel est ce chant ?",
    choices: ["Salve Regina (Poulenc)", "En sortant de l'école (Kosma)", "Calme des nuits (Saint-Saëns)", "Une destinée (Patrick Laviron)"],
    answerIndex: 0,
  },
  {
    id: 9,
    question: "VIOLON : Combien existe-t-il d’Études de Sevcik – ayant brutalisé des générations d’élèves ?",
    choices: ["55", "21", "5", "Beaucoup trop"],
    answerIndex: 1,
  },
  {
    id: 10,
    question: "CHOEUR : Dans un passage polyphonique de la Renaissance à quatre voix a cappella, comment le chef de chœur peut-il gérer la micro-intonation des tierces pour respecter le tempérament mésotonique implicite de l’époque ?",
    choices: ["En rendant les tierces majeures pures", "Qui aurait cette idée ?", "En demandant des vibratos larges pour qu’on n’entende plus rien", "En changeant de Chœur"],
    answerIndex: 0,
  },
  {
    id: 11,
    question: "PERSO : La question pour 1 million d’euros : Et maintenant quoi ?",
    choices: ["Je vais enfin pouvoir m’amuser !", "Ah ben non, Patrick sera aussi à la retraite", "Du coup...", "Je rempile !"],
    answerIndex: 0,
  },
  {
    id: 12,
    question: "Quel est ce chant ?",
    choices: ["Ce n'est qu'un au revoir", "Ce n'est qu'un au revoir", "Ce n'est qu'un au revoir", "Ce n'est qu'un au revoir"],
    answerIndex: 0,
  },
];

const STORAGE_KEY = "qqmm_questions_v3";

function Game(): JSX.Element {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    const arr: Question[] = [];
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      arr.push(
        DEFAULT_QUESTIONS[i] || {
          id: i + 1,
          question: `Question ${i + 1} (éditez-moi)`,
          choices: ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
          answerIndex: 0,
        }
      );
    }
    return arr;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  const [playerIndex, setPlayerIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [usedJokers, setUsedJokers] = useState({ fifty: false, phone: false, audience: false });
  const [visibleChoices, setVisibleChoices] = useState([true, true, true, true]);
  const [status, setStatus] = useState<"idle" | "asking" | "checking" | "won" | "lost">("idle");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [audiencePoll, setAudiencePoll] = useState<number[] | null>(null);
  const [phoneText, setPhoneText] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function resetGame() {
    setPlayerIndex(0);
    setLocked(false);
    setUsedJokers({ fifty: false, phone: false, audience: false });
    setVisibleChoices([true, true, true, true]);
    setStatus("idle");
    setLastResult(null);
    setAudiencePoll(null);
    setPhoneText("");
    setSelectedIndex(null);
  }

  function shuffleArray(a: any[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  function applyFifty() {
    if (usedJokers.fifty) return;
    const correct = questions[playerIndex].answerIndex;
    const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correct);
    shuffleArray(wrongIndexes);
    const remove = wrongIndexes.slice(0, 2);
    const newVisible = [true, true, true, true];
    remove.forEach((r) => (newVisible[r] = false));
    setVisibleChoices(newVisible);
    setUsedJokers((s) => ({ ...s, fifty: true }));
  }

  function pickOther(correct: number): number {
    const others = [0, 1, 2, 3].filter((i) => i !== correct);
    return others[Math.floor(Math.random() * others.length)];
  }

  function applyPhone() {
    if (usedJokers.phone) return;
    const correct = questions[playerIndex].answerIndex;
    const chance = Math.random();
    const suggested = chance < 0.85 ? correct : pickOther(correct);
    setPhoneText(`Ami: Je pense que la réponse serait "${questions[playerIndex].choices[suggested]}".`);
    setUsedJokers((s) => ({ ...s, phone: true }));
  }

  function applyAudience() {
    if (usedJokers.audience) return;
    const correct = questions[playerIndex].answerIndex;
    const correctShare = Math.floor(40 + Math.random() * 40);
    let remaining = 100 - correctShare;
    const others = [0, 1, 2, 3].filter((i) => i !== correct);
    const polls = [0, 0, 0, 0];
    for (let i = 0; i < others.length - 1; i++) {
      const s = Math.floor(Math.random() * remaining);
      polls[others[i]] = s;
      remaining -= s;
    }
    polls[others[others.length - 1]] = remaining;
    polls[correct] = correctShare;
    setAudiencePoll(polls);
    setUsedJokers((s) => ({ ...s, audience: true }));
  }

  function onChoose(idx: number) {
    if (locked || status === "checking") return;
    setLocked(true);
    setStatus("checking");
    setSelectedIndex(idx);
    const q = questions[playerIndex];

    timeoutRef.current = window.setTimeout(() => {
      const correct = q.answerIndex;
      const correctChoice = idx === correct;

      if (correctChoice) {
        setLastResult("correct");
        if (playerIndex === TOTAL_LEVELS - 1) {
          setStatus("won");
          setLocked(false);
        } else {
          timeoutRef.current = window.setTimeout(() => {
            setPlayerIndex((p) => p + 1);
            setVisibleChoices([true, true, true, true]);
            setStatus("asking");
            setLocked(false);
            setLastResult(null);
            setAudiencePoll(null);
            setPhoneText("");
            setSelectedIndex(null);
          }, 1200);
        }
      } else {
        setLastResult("wrong");
        setStatus("lost");
        setLocked(false);
      }
    }, 1000);
  }

  function getWinningsForIndex(idx: number): number {
    if (idx < 0) return 0;
    return MONEY_LADDER[idx + 1] || 0;
  }

  function getFinalWinningsOnWrong(idx: number): number {
    const qnum = idx + 1;
    let securedAmount = 0;
    for (let i = SECURED_LEVELS.length - 1; i >= 0; i--) {
      if (qnum > SECURED_LEVELS[i]) {
        securedAmount = MONEY_LADDER[SECURED_LEVELS[i]];
        break;
      }
    }
    return securedAmount;
  }

  function formatEur(v: number) {
    return v.toLocaleString('fr-FR') + ' €';
  }

  // layout styles (simple & responsive)
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#1c2a50',
    backgroundImage: 'linear-gradient(180deg, #1c2a50 0%, #000000 100%)',
    minHeight: '100vh',
    padding: 40,
    fontFamily: 'var(--font-primary, system-ui, sans-serif)',
    color: '#fff',
    boxSizing: 'border-box'
  };

  const innerWrapper: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    gap: 40,
    alignItems: 'flex-start',
    justifyContent: 'center'
  };

  const leftColumn: React.CSSProperties = {
    flex: 1,
    textAlign: 'center',
    zIndex: 1
  };

  const rightColumn: React.CSSProperties = {
    width: 300,
    flexShrink: 0
  };

  return (
    <div style={containerStyle}>
      <div style={innerWrapper}>

        {/* LEFT */}
        <div style={leftColumn}>
          {/* Logo centré avec margin-bottom 100px */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 50 }}>
            <img
              src="/logo.jpg"
              alt="Logo Retraite"
              style={{
                width: 220,
                height: 220,
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 0 12px rgba(121,202,255,0.5))'
              }}
            />
          </div>

          {/* Question block */}
          <div style={{
            position: 'relative',
            width: 760,
            maxWidth: '100%',
            padding: '25px 40px',
            margin: '0 auto 30px auto',
            color: '#ffffff',
            textAlign: 'center',
            fontSize: '1.4em',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)',
            clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)'
          }}>
            <div style={{ position: 'relative', zIndex: 1, fontWeight: 700 }}>
              {questions[playerIndex]?.question || 'Chargement de la question...'}
            </div>
            <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)', boxShadow: '0 0 0 3px #79caff', pointerEvents: 'none' }} />
          </div>

          {/* Media (if any) */}
          {questions[playerIndex]?.media && (
            <div style={{ margin: '0 auto 30px auto', display: 'flex', justifyContent: 'center', maxWidth: 760, padding: '0 20px' }}>
              {questions[playerIndex].media.type === 'image' && (
                <img src={questions[playerIndex].media.src} alt={questions[playerIndex].media.alt || ''} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.5)', border: '2px solid #79caff' }} />
              )}
              {questions[playerIndex].media.type === 'video' && (
                <video controls style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.5)', border: '2px solid #79caff' }}>
                  <source src={questions[playerIndex].media.src} type="video/mp4" />
                </video>
              )}
              {questions[playerIndex].media.type === 'audio' && (
                <audio controls style={{ width: '100%', maxWidth: 400 }}>
                  <source src={questions[playerIndex].media.src} type="audio/mp3" />
                </audio>
              )}
            </div>
          )}

          {/* Choices grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 30px', width: 760, maxWidth: '100%', margin: '0 auto 40px auto' }}>
            {questions[playerIndex]?.choices.map((choice, i) => {
              const visible = visibleChoices[i];
              const answerIndex = questions[playerIndex].answerIndex;
              const label = String.fromCharCode(65 + i);
              const isChosen = selectedIndex === i;
              const isCorrectReveal = lastResult !== null && i === answerIndex;
              const isChosenWrong = lastResult === 'wrong' && isChosen && i !== answerIndex;
              const isSelected = isChosen && status === 'checking';

              return (
                <div key={i} style={{ position: 'relative', opacity: visible ? 1 : 0.5, pointerEvents: !visible || locked ? 'none' : 'auto' }}>
                  <button
                    onClick={() => onChoose(i)}
                    disabled={!visible || locked}
                    style={{
                      position: 'relative',
                      width: '100%',
                      padding: '15px 30px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: visible && !locked ? 'pointer' : 'default',
                      color: '#ffffff',
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      backgroundColor: '#000000',
                      boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)',
                      clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)',
                      ...(isSelected && { backgroundColor: '#ff9900', color: '#000000', boxShadow: '0 0 0 1px #ff9900, 0 0 5px #ff9900' }),
                      ...(isCorrectReveal && { backgroundColor: '#0a3f1f', boxShadow: '0 0 18px rgba(0,255,128,0.45)' }),
                      ...(isChosenWrong && { backgroundColor: '#3f0a0a', boxShadow: '0 0 18px rgba(255,0,0,0.45)' })
                    }}
                    onMouseEnter={(e) => {
                      if (visible && !isCorrectReveal && !isChosenWrong && !isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px #ff9900, 0 0 5px #ff9900';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ff9900';
                        (e.currentTarget as HTMLButtonElement).style.color = '#000000';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (visible && !isCorrectReveal && !isChosenWrong && !isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px #79caff, 0 0 8px #79caff';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#000000';
                        (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                      }
                    }}
                  >
                    <span style={{ position: 'relative', zIndex: 1, color: '#ffc000', fontWeight: 700, minWidth: 42 }}>
                      {label}:
                    </span>
                    <span style={{ position: 'relative', zIndex: 1 }}>{choice}</span>
                    {audiencePoll && (
                      <span style={{ position: 'relative', zIndex: 1, marginLeft: 'auto', color: '#ffcc33', fontWeight: 'bold' }}>
                        {audiencePoll[i]}%
                      </span>
                    )}
                    {phoneText && i === answerIndex && (
                      <span style={{ position: 'relative', zIndex: 1, marginLeft: 8, color: '#ffcc33', fontStyle: 'italic' }}>
                        (suggéré)
                      </span>
                    )}
                    <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)', boxShadow: '0 0 0 3px #79caff', pointerEvents: 'none' }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div style={rightColumn}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8, marginBottom: 16, boxShadow: '0 0 10px rgba(121,202,255,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 8 }}>
              <button onClick={applyFifty} disabled={usedJokers.fifty} title="50:50" style={{ width: 54, height: 54, borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: usedJokers.fifty ? 'none' : '0 0 8px #79caff' }}>
                <img src={fiftyIcon} alt="50" style={{ height: 24 }} />
              </button>
              <button onClick={applyPhone} disabled={usedJokers.phone} title="Appeler" style={{ width: 54, height: 54, borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: usedJokers.phone ? 'none' : '0 0 8px #79caff' }}>
                <img src={phoneIcon} alt="phone" style={{ height: 24 }} />
              </button>
              <button onClick={applyAudience} disabled={usedJokers.audience} title="Public" style={{ width: 54, height: 54, borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: usedJokers.audience ? 'none' : '0 0 8px #79caff' }}>
                <img src={audienceIcon} alt="audience" style={{ height: 24 }} />
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 6, border: '2px solid #79caff' }}>
              {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
                const level = TOTAL_LEVELS - i;
                const amount = MONEY_LADDER[level];
                const isCurrent = playerIndex + 1 === level;
                const isSecured = SECURED_LEVELS.includes(level);
                return (
                  <div key={level} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontSize: 14, fontWeight: 'bold', backgroundColor: isCurrent ? 'rgba(255,153,0,0.15)' : 'transparent', borderRadius: 4, marginBottom: 6 }}>
                    <span style={{ color: isSecured ? '#fff' : '#ffd9a8' }}>{level}</span>
                    <span style={{ color: isCurrent ? '#ff9900' : (isSecured ? '#fff' : '#ffd9a8') }}>{formatEur(amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={resetGame} style={{ padding: '8px 12px', borderRadius: 8, background: '#222', border: '1px solid #444' }}>Recommencer</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Game;
