import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
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


// 1. Mettre à jour le type de question pour inclure le média
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

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: "Combien existe-t-il de Caprices de Paganini ?",
    choices: ["24", "22", "99", "Je ne crois pas avoir eu cet élève"],
    answerIndex: 0, // 24
  },

  {
    id: 2. ,
    question: "CHŒUR : Quel est le plus ancien chanteur du Chœur Mixte d’Adultes ?",
    choices: ["Véronique Idelot", "Régis Idelot", "Gérard Guenet", "Maria Callas"],
    answerIndex: 1, // Régis Idelot
  },

  {
    id: 3. ,
    question: "PERSO : En quelle année avez-vous reçu le Diplôme d’Aptitude pour l’Animation des Sociétés Musicales et Chorales (Direction Chorale)",
    choices: ["1985", "1986", "1987", "2026"],
    answerIndex: 1, // 1986
  },

  {
    id: 4. ,
    question: "Quel est ce chant ?",
    choices: ["Dies Irae (Verdi)", "Gloria (Vivaldi)", "Salve Regina (Liszt)", "La Marseillaise"],
    answerIndex: 0, // Dies Irae
  },

  {
    id: 5. ,
    question: "VIOLON : De quel pays vient – originellement – le bois servant à fabriquer les archets ?",
    choices: ["Thaïlande", "Guyane", "Brésil", "Rien ne vaut un bel archet en carbone chinois"],
    answerIndex: 2, // Brésil
  },
{
    id: 6. ,
    question: "CONSERVATOIRE : Qui a été le premier directeur de la forme actuelle de l'École de Musique de Persan ?",
    choices: ["Arnaud Bazin", "Fernand Chatelain", "Marc Devisme", "Il n'y a eu que Patrick Laviron"],
    answerIndex: 2 // Marc Devisme
  },

  {
    id: 7. ,
    question: "CHŒUR : Vous avez pris la direction de la Chorale Mixte d’Adultes dès sa création. Mais en quelle date ?",
    choices: ["1978", "1985", "1988", "1789"],
    answerIndex: 1 // 1985
  },

  {
    id: 8. ,
    question: "Quel est ce chant ?",
    choices: ["Salve Regina (Poulenc)", "En sortant de l'école (Kosma)", "Calme des nuits (Saint-Saëns)", "Une destinée (Patrick Laviron)"],
    answerIndex: 0 // Salve Regina (Poulenc)
  },

  {
    id: 9. ,
    question: "VIOLON : Combien existe-t-il d’Études de Sevcik – ayant brutalisé des générations d’élèves ?",
    choices: ["55", "21", "5", "Beaucoup trop"],
    answerIndex: 1 // 21
  },

 {
    id: 10. ,
    question: "CHOEUR : Dans un passage polyphonique de la Renaissance à quatre voix a cappella, comment le chef de chœur peut-il gérer la micro-intonation des tierces pour respecter le tempérament mésotonique implicite de l’époque ?",
    choices: ["En rendant les tierces majeures pures ", "Qui aurait cette idée ?", "En demandant des vibratos larges pour qu’on n’entende plus rien",  "En changeant de Chœur "],
    answerIndex: 0 // En rendant les tierces majeures pures
  },

   {
    id: 11. ,
    question: "PERSO : La question pour 1 million d’euros : Et maintenant quoi ?",
    choices: ["Je vais enfin pouvoir m’amuser !", "Ah ben non, Patrick sera aussi à la retraite", "Du coup... ",  "Je rempile !"],
    answerIndex: 0 // Je vais enfin pouvoir m’amuser !
  },
  
  {
    id: 12. ,
    question: "Quel est ce chant ?",
    choices: ["Ce n'est qu'un au revoir", "Ce n'est qu'un au revoir", "Ce n'est qu'un au revoir",  "Ce n'est qu'un au revoir"],
    answerIndex: 0 // 
  },

  // Ajoutez plus de questions par défaut ici...
];


const STORAGE_KEY = "qqmm_questions_v3";

function Game() {
  const [questions, _setQuestions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Créer un tableau de TOTAL_LEVELS questions avec les valeurs par défaut
    const arr = [];
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
  const [status, setStatus] = useState("idle"); // idle | asking | checking | won | lost
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [audiencePoll, setAudiencePoll] = useState<number[] | null>(null);
  const [phoneText, setPhoneText] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
  }

  function applyFifty() {
    if (usedJokers.fifty) return;
    const correct = questions[playerIndex].answerIndex;
    const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correct);
    // Supprimer aléatoirement deux mauvaises réponses
    shuffleArray(wrongIndexes);
    const remove = wrongIndexes.slice(0, 2);
    const newVisible = [true, true, true, true];
    remove.forEach((r) => (newVisible[r] = false));
    setVisibleChoices(newVisible);
    setUsedJokers((s) => ({ ...s, fifty: true }));
  }

  function applyPhone() {
    if (usedJokers.phone) return;
    // Simulation d'un appel - biaisé vers la bonne réponse mais pas toujours correct
    const correct = questions[playerIndex].answerIndex;
    const chance = Math.random();
    const suggested = chance < 0.85 ? correct : pickOther(correct);
    setPhoneText(`Ami: Je pense que la réponse serait "${questions[playerIndex].choices[suggested]}".`);
    setUsedJokers((s) => ({ ...s, phone: true }));
  }

  function applyAudience() {
    if (usedJokers.audience) return;
    const correct = questions[playerIndex].answerIndex;
    // Créer une distribution où la bonne réponse obtient entre 40-80%
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

  function pickOther(correct: number): number {
    const others = [0, 1, 2, 3].filter((i) => i !== correct);
    return others[Math.floor(Math.random() * others.length)];
  }

  function onChoose(idx: number) {
    if (locked || status === "checking") return;
    setLocked(true);
    setStatus("checking");
    setSelectedIndex(idx);
    const q = questions[playerIndex];
    
    timeoutRef.current = setTimeout(() => {
      const correct = q.answerIndex;
      const correctChoice = idx === correct;
      
      if (correctChoice) {
        setLastResult("correct");
        if (playerIndex === TOTAL_LEVELS - 1) {
          setStatus("won");
          setLocked(false);
        } else {
          timeoutRef.current = setTimeout(() => {
            setPlayerIndex((p) => p + 1);
            setVisibleChoices([true, true, true, true]);
            setStatus("asking");
            setLocked(false);
            setLastResult(null);
            setAudiencePoll(null);
            setPhoneText("");
            setSelectedIndex(null);
          }, 1200) as NodeJS.Timeout;
        }
      } else {
        setLastResult("wrong");
        setStatus("lost");
        setLocked(false);
      }
    }, 1000) as NodeJS.Timeout;
  }

  function quitGame() {
    setStatus("quit");
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

  // (Admin supprimé de l'UI)

  // Fonction utilitaire pour mélanger un tableau
  function shuffleArray(a: any[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  return (
   {/* Logo centré */}
   <div style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginBottom: 50
  }}
>
  <img
    src="/logo.jpg"
    alt="Logo Retraite"
    style={{ 
      width: 220, 
      height: 220,
     marginBottom: 50,
      objectFit: 'contain', 
      filter: 'drop-shadow(0 0 12px rgba(121,202,255,0.5))' 
    }}
  />
</div>


        {/* Zone de jeu principale */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar absolue droite */}
          <div style={{
            position: 'absolute',
            top: 50,
            right: 50,
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 50
          }}>
            {/* Lifelines */}
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginBottom: 20 }}>
              <button
                onClick={applyFifty}
                disabled={usedJokers.fifty}
                title="50:50"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: '#000000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: usedJokers.fifty ? 'default' : 'pointer',
                  boxShadow: '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)',
                  opacity: usedJokers.fifty ? 0.4 : 1,
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { if (!usedJokers.fifty) { e.currentTarget.style.boxShadow = '0 0 0 2px #ff9900, 0 0 8px #ff9900, 0 0 16px rgba(255,153,0,0.6)'; e.currentTarget.style.backgroundColor = '#ff9900'; }} }
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                <img src={fiftyIcon} alt="50:50" style={{ height: 24, display: 'block', border: 0, outline: 'none', background: 'transparent' }} />
              </button>
              <button
                onClick={applyPhone}
                disabled={usedJokers.phone}
                title="Appeler un ami"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: '#000000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: usedJokers.phone ? 'default' : 'pointer',
                  boxShadow: '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)',
                  opacity: usedJokers.phone ? 0.4 : 1,
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { if (!usedJokers.phone) { e.currentTarget.style.boxShadow = '0 0 0 2px #ff9900, 0 0 8px #ff9900, 0 0 16px rgba(255,153,0,0.6)'; e.currentTarget.style.backgroundColor = '#ff9900'; }} }
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)'; e.currentTarget.style.backgroundColor = '#000000'; }}
              >
                <img src={phoneIcon} alt="Appeler" style={{ height: 24, display: 'block', border: 0, outline: 'none', background: 'transparent' }} />
              </button>
              <button
                onClick={applyAudience}
                disabled={usedJokers.audience}
                title="Aide du public"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: '#000000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: usedJokers.audience ? 'default' : 'pointer',
                  boxShadow: '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)',
                  opacity: usedJokers.audience ? 0.4 : 1,
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { if (!usedJokers.audience) { e.currentTarget.style.boxShadow = '0 0 0 2px #ff9900, 0 0 8px #ff9900, 0 0 16px rgba(255,153,0,0.6)'; e.currentTarget.style.backgroundColor = '#ff9900'; }} }
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.5)'; e.currentTarget.style.backgroundColor = '#000000'; }}
              >
                <img src={audienceIcon} alt="Public" style={{ height: 24, display: 'block', border: 0, outline: 'none', background: 'transparent' }} />
              </button>
            </div>

            {/* Prize table */}
            <div style={{
              width: '100%',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '10px 5px',
              boxShadow: '0 0 5px #79caff, 0 0 10px rgba(121,202,255,0.5)',
              border: '2px solid #79caff',
              borderRadius: 5
            }}>
              {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
                const level = TOTAL_LEVELS - i;
                const amount = MONEY_LADDER[level];
                const isCurrent = playerIndex + 1 === level;
                const isSecured = SECURED_LEVELS.includes(level);
                return (
                  <div key={level} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 10px',
                    fontSize: '1.1em',
                    lineHeight: 1.4,
                    fontWeight: 'bold',
                    backgroundColor: isCurrent ? 'rgba(255,153,0,0.3)' : 'transparent',
                    border: isCurrent ? '1px solid #ff9900' : 'none',
                    boxShadow: isCurrent ? '0 0 8px #ff9900' : 'none'
                  }}>
                    <span style={{
                      width: '20%',
                      textAlign: 'left',
                      color: (level === 4 || level === 8) ? '#ffffff' : 'rgb(255, 217, 168)',
                      textShadow: isCurrent ? '0 0 5px #ff9900' : 'none',
                      fontSize: isCurrent ? '1.2em' : '1.1em',
                      transition: 'all 0.3s ease',
                      fontWeight: (level === 4 || level === 8) ? 'bold' : 'normal'
                    }}>{level}</span>
                    <span style={{
                      width: '80%',
                      textAlign: 'right',
                      color: isCurrent ? '#ff9900' : (isSecured ? '#ffffff' : '#ffd9a8')
                    }}>{formatEur(amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Colonne de gauche : Question et réponses */}
          <div className="flex-1 space-y-6" style={{ position: 'relative', zIndex: 1 }}>
            {/* Zone de question */}
<div style={{
  position: 'relative',
  width: '760px',
  padding: '25px 40px',
  marginBottom: '30px',
  color: '#ffffff',
  textAlign: 'center',
  fontSize: '1.4em',
  fontWeight: 'bold',
  backgroundColor: '#000000',
  boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)',
  clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)'
}}>
  <div style={{ position: 'relative', zIndex: 1, fontWeight: 700, letterSpacing: '0.3px', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>
    {questions[playerIndex]?.question || 'Chargement de la question...'}
  </div>
  <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)', boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)', pointerEvents: 'none', borderRadius: 0 }} />
</div>

{/* Ajoutez le média ici, juste après la zone de question */}
{questions[playerIndex]?.media && (
  <div style={{ 
    margin: '0 auto 30px auto',
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '760px',
    padding: '0 20px'
  }}>
    {questions[playerIndex].media.type === 'image' && (
      <img 
        src={questions[playerIndex].media.src} 
        alt={questions[playerIndex].media.alt || ''}
        style={{ 
          maxWidth: '100%', 
          maxHeight: '300px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          border: '2px solid #79caff'
        }}
      />
    )}
    {questions[playerIndex].media.type === 'video' && (
      <video 
        controls 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '300px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          border: '2px solid #79caff'
        }}
      >
        <source src={questions[playerIndex].media.src} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    )}
    {questions[playerIndex].media.type === 'audio' && (
      <audio 
        controls 
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          borderRadius: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
        }}
      >
        <source src={questions[playerIndex].media.src} type="audio/mp3" />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    )}
  </div>
)}

{/* Grille des réponses */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px 30px',
  width: '760px',
  marginBottom: '40px'
}}>


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
                        gap: '12px',
                        cursor: visible && !locked ? 'pointer' : 'default',
                        color: '#ffffff',
                        fontSize: '1.1em',
                        fontWeight: 'bold',
                        backgroundColor: '#000000',
                        boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)',
                        clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)',
                        ...(isSelected && { backgroundColor: '#ff9900', color: '#000000', boxShadow: '0 0 0 1px #ff9900, 0 0 5px #ff9900, 0 0 15px #ff9900, 0 0 30px rgba(255,153,0,0.7)' }),
                        ...(isCorrectReveal && { backgroundColor: '#0a3f1f', boxShadow: '0 0 18px rgba(0,255,128,0.45)' }),
                        ...(isChosenWrong && { backgroundColor: '#3f0a0a', boxShadow: '0 0 18px rgba(255,0,0,0.45)' })
                      }}
                      onMouseEnter={(e) => {
                        if (visible && !isCorrectReveal && !isChosenWrong && !isSelected) {
                          e.currentTarget.style.boxShadow = '0 0 0 1px #ff9900, 0 0 5px #ff9900, 0 0 15px #ff9900, 0 0 30px rgba(255,153,0,0.7)';
                          e.currentTarget.style.backgroundColor = '#ff9900';
                          e.currentTarget.style.color = '#000000';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (visible && !isCorrectReveal && !isChosenWrong && !isSelected) {
                          e.currentTarget.style.boxShadow = '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)';
                          e.currentTarget.style.backgroundColor = '#000000';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 1, color: '#ffc000', fontWeight: 700, minWidth: '42px' }}>
                        {label}:
                      </span>
                      <span style={{ position: 'relative', zIndex: 1 }}>{choice}</span>
                      {audiencePoll && (
                        <span style={{ position: 'relative', zIndex: 1, marginLeft: 'auto', color: '#ffcc33', fontWeight: 'bold' }}>
                          {audiencePoll[i]}%
                        </span>
                      )}
                      {phoneText && i === answerIndex && (
                        <span style={{ position: 'relative', zIndex: 1, marginLeft: '8px', color: '#ffcc33', fontStyle: 'italic' }}>
                          (suggéré)
                        </span>
                      )}
                      <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)', boxShadow: '0 0 0 3px #79caff, 0 0 8px #79caff, 0 0 16px rgba(121,202,255,0.6)', pointerEvents: 'none' }} />
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
