import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

/* ------------------ CONSTANTS ------------------ */

// Movie prompts
const MOVIE_QUESTIONS = [
  "What was a highlight of your day, and what made it meaningful to you?",
  "Was there a moment today that genuinely made you smile or feel good?",
  "What are you currently looking forward to, and why does it matter to you?",
  "What went better than you expected today, and what do you think contributed to that?"
];


// Original stress prompts (Check-in 1)
const STRESS_QUESTIONS = [
  "What are some tasks which are approaching deadline?",
  "What is the work required to finish them?",
  "In what way do those tasks stress you?",
  "What exactly is making them difficult?"
];


const STRESS2_QUESTIONS = [
  "What are some of the conversations in the past few days that did not go well?",
  "What could you have done differently?",
  "Why do they affect you?"
];

// Baseline stays same for both check-ins
const BASELINE_QUESTIONS_BY_CHECKIN = {
  1: MOVIE_QUESTIONS,
  2: MOVIE_QUESTIONS,
  default: MOVIE_QUESTIONS,
};


// 👇 Key change here
const DEADLINE_QUESTIONS_BY_CHECKIN = {
  1: STRESS_QUESTIONS,            // Check-in 1 → original stress
  2: STRESS2_QUESTIONS,   // Check-in 2 → new flow
  default: STRESS_QUESTIONS,
};


const getBaselineQuestions = (checkinNumber) => {
  return BASELINE_QUESTIONS_BY_CHECKIN[checkinNumber] || BASELINE_QUESTIONS_BY_CHECKIN.default;
};

const getDeadlineQuestions = (checkinNumber) => {
  return DEADLINE_QUESTIONS_BY_CHECKIN[checkinNumber] || DEADLINE_QUESTIONS_BY_CHECKIN.default;
};


const PRE_POST_SURVEY_PROMPT =
  "How stressed do you feel right now? 1 means not stressed at all, as if you were on vacation with no tasks. 5 means extremely stressed, as if you had 10 important deadlines at once.";

const MID_SURVEY_QUESTIONS = [
  "During the color naming task, how stressed did you feel?",
  "During the task about deadlines, how stressed did you feel?"
];
const HAPPY_TEXT = `
On a quiet evening, a student sat by the window and looked outside as the sky slowly changed from orange to deep blue.
The day had been long, and there had been many things to finish, but for the first time in a while, everything felt a little lighter.
The tasks were still there, the deadlines were still real, but they no longer felt impossible.
Instead of thinking about everything at once, the student imagined doing one small thing at a time.
A page could be read. A paragraph could be written. One email could be answered.
That was enough.
The room was calm, the air was still, and the mind felt clearer than before.
There was no need to rush in this moment.
There was only the next step, and then the one after that.
And somehow, that felt manageable.
The student took another slow breath and realized that progress did not need to be dramatic to be meaningful.
Even small steady movement was still movement.
Even a difficult day could end with a little more peace than it began.
`;

// Stroop
const STROOP_COLORS = ["RED", "GREEN", "BLUE", "YELLOW"];

const STROOP_COLOR_MAP = {
  RED: "text-red-500",
  GREEN: "text-green-500",
  BLUE: "text-blue-500",
  YELLOW: "text-yellow-500"
};

/* ------------------ TTS ------------------ */

const speak = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const femaleVoice =
      voices.find(v => /female/i.test(v.name)) ||
      voices.find(v => /zira|samantha|victoria|ava|allison|karen/i.test(v.name)) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0];

    utterance.voice = femaleVoice;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

/* ------------------ COMPONENT ------------------ */

export default function CheckinPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [checkinNumber, setCheckinNumber] = useState(1);

  const [step, setStep] = useState("intro");

  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState(MOVIE_QUESTIONS[0]);
  const [surveyRatings, setSurveyRatings] = useState({
    pre: null,
    reaction: null,
    deadline: null,
    post: null
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [audioBlobs, setAudioBlobs] = useState({
    baseline: null,
    stroop: null,
    deadline: null,
    reading: null,
  });

  const [audioUrls, setAudioUrls] = useState({
    baseline: null,
    stroop: null,
    deadline: null,
    reading: null,
  });

  const [submitError, setSubmitError] = useState(null);

  const [silenceSeconds, setSilenceSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioTaskRef = useRef(null);

  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const timerRef = useRef(null);
  const audioPollRef = useRef(null);
  const silenceAccumulatorRef = useRef(0);
  const recordingSecondsRef = useRef(0);
  const questionIndexRef = useRef(0);

  // Stroop
  const [stroopWord, setStroopWord] = useState("");
  const [stroopColor, setStroopColor] = useState("");
  const [stroopTime, setStroopTime] = useState(30);
  const stroopRef = useRef(null);
  const stroopCountdownRef = useRef(null);

  // Breathing
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [breathTime, setBreathTime] = useState(30);
  const breathLoopRef = useRef(null);
  const breathCountdownRef = useRef(null);

  /* ------------------ LOAD ------------------ */

  useEffect(() => {
    if (!id) return;

    const fetchCheckin = async () => {
      try {
        const res = await fetch('/api/checkins');
        const data = await res.json();
        const checkin = data.checkins.find(c => c.id === id);
        if (checkin) setCheckinNumber(checkin.number);
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    fetchCheckin();
  }, [id]);

  /* ------------------ PRELOAD VOICES ------------------ */

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  /* ------------------ TTS ------------------ */

  useEffect(() => {
    if (step === "movie" || step === "stress") {
      speak(currentPrompt);
    }
  }, [currentPrompt, step]);

  /* ------------------ TIMER ------------------ */

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  /* ------------------ AUDIO POLLING: MIC + SILENCE ------------------ */

  useEffect(() => {
    if (!isRecording || !analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.fftSize);
    silenceAccumulatorRef.current = 0;
    setSilenceSeconds(0);

    audioPollRef.current = setInterval(() => {
      analyserRef.current.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] - 128;
        sum += Math.abs(val);
      }

      const avg = sum / dataArray.length;
      const normalized = Math.min((avg / 12) * 100, 100);
      setMicLevel(normalized);
      //console.log(avg);
      if ((step === "movie" || step === "stress") && recordingSecondsRef.current < 45) {
        if (avg < 10) {
          silenceAccumulatorRef.current += 0.2;
          if (silenceAccumulatorRef.current >= 7) {
            handleSilenceTrigger();
            silenceAccumulatorRef.current = 0;
          }
        } else {
          silenceAccumulatorRef.current = 0;
        }

        const wholeSeconds = Math.floor(silenceAccumulatorRef.current);
        setSilenceSeconds(wholeSeconds);
      }
    }, 200);

    return () => {
        if (audioPollRef.current) {
          clearInterval(audioPollRef.current);
          audioPollRef.current = null;
        }
      };
    }, [isRecording, step]);

    const handleSilenceTrigger = () => {
    if (!isRecording || recordingSecondsRef.current >= 45) return;

    if (step === "movie") {
      const baselineQuestions = getBaselineQuestions(checkinNumber);
      if (questionIndexRef.current < baselineQuestions.length - 1) {
        const next = questionIndexRef.current + 1;
        questionIndexRef.current = next;
        setQuestionIndex(next);
        setCurrentPrompt(baselineQuestions[next]);
      }
    }

    if (step === "stress") {
      const deadlineQuestions = getDeadlineQuestions(checkinNumber);
      if (questionIndexRef.current < deadlineQuestions.length - 1) {
        const next = questionIndexRef.current + 1;
        questionIndexRef.current = next;
        setQuestionIndex(next);
        setCurrentPrompt(deadlineQuestions[next]);
      }
    }
  };

  /* ------------------ RECORDING ------------------ */

  const startRecording = async (task) => {
    audioTaskRef.current = task;
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    setSilenceSeconds(0);
    silenceAccumulatorRef.current = 0;
    setMicLevel(0);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      try {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const task = audioTaskRef.current;
        if (task) {
          setAudioBlobs(prev => ({ ...prev, [task]: blob }));
        }
        audioTaskRef.current = null;
      } catch (e) {
        console.error(e);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
    };

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaStreamSource(stream);

    source.connect(analyser);
    analyser.fftSize = 512;

    analyserRef.current = analyser;
    audioContextRef.current = ctx;

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = (nextStep = null) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setMicLevel(0);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (nextStep) {
      setStep(nextStep);
    }
  };

  const submitCheckin = async () => {
    try {
      console.log('submitCheckin start', {
        checkinId: id,
        checkinNumber,
        surveyRatings,
        audioBlobs: {
          baseline: !!audioBlobs.baseline,
          stroop: !!audioBlobs.stroop,
          deadline: !!audioBlobs.deadline,
          reading: !!audioBlobs.reading,
        }
      });

      const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1] ?? null;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadAudioTask = async (task, blob) => {
        const base64 = await blobToBase64(blob);
        const response = await fetch('/api/checkin-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `checkin-${checkinNumber}-${task}.wav`,
            base64Audio: base64,
            fileType: 'audio/wav'
          })
        });

        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || 'Audio upload failed');
        }

        setAudioUrls(prev => ({ ...prev, [task]: json.url }));
        return json.url;
      };

      const audioUrlsToSend = { ...audioUrls };
      for (const task of ['baseline', 'stroop', 'deadline', 'reading']) {
        if (!audioUrlsToSend[task] && audioBlobs[task]) {
          audioUrlsToSend[task] = await uploadAudioTask(task, audioBlobs[task]);
        }
      }

      const response = await fetch('/api/checkin-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinId: id,
          checkinNumber,
          surveyResponses: surveyRatings,
          audioUrls: audioUrlsToSend,
          submittedAt: new Date().toISOString()
        })
      });

      const responseBody = await response.text();
      console.log('submitCheckin response', { status: response.status, body: responseBody });

      if (!response.ok) {
        const message = `Submit failed: ${response.status} ${responseBody}`;
        setSubmitError(message);
        console.error('Failed to submit check-in', responseBody);
        return false;
      }

      setSubmitError(null);
      return true;
    } catch (error) {
      const message = error.message || 'Submit failed';
      setSubmitError(message);
      console.error('Submit error:', error);
      return false;
    }
  };

  /* ------------------ STROOP ------------------ */

  const randomStroop = () => {
    const word = STROOP_COLORS[Math.floor(Math.random() * 4)];
    let color;

    if (Math.random() < 0.8) {
      do {
        color = STROOP_COLORS[Math.floor(Math.random() * 4)];
      } while (color === word);
    } else {
      color = word;
    }

    return { word, color };
  };

  const startStroop = async () => {
    setStep("stroop");
    setStroopTime(45);

    await startRecording('stroop');

    const update = () => {
      const { word, color } = randomStroop();
      setStroopWord(word);
      setStroopColor(color);

      stroopRef.current = setTimeout(update, 800 + Math.random() * 400);
    };

    update();

    stroopCountdownRef.current = setInterval(() => {
      setStroopTime(prev => {
        if (prev <= 1) {
          if (stroopCountdownRef.current) {
            clearInterval(stroopCountdownRef.current);
            stroopCountdownRef.current = null;
          }
          if (stroopRef.current) {
            clearTimeout(stroopRef.current);
            stroopRef.current = null;
          }
          stopRecording("stress-intro");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ------------------ BREATHING ------------------ */

  const startBreathing = () => {
    setStep("breathing");
    setBreathTime(30);

    const phases = [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 2 },
      { name: "Exhale", duration: 4 }
    ];

    let phaseIndex = 0;

    const run = () => {
      const phase = phases[phaseIndex];
      setBreathPhase(phase.name);

      breathLoopRef.current = setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        run();
      }, phase.duration * 1000);
    };

    run();

    breathCountdownRef.current = setInterval(() => {
      setBreathTime(prev => {
        if (prev <= 1) {
          if (breathCountdownRef.current) {
            clearInterval(breathCountdownRef.current);
            breathCountdownRef.current = null;
          }
          if (breathLoopRef.current) {
            clearTimeout(breathLoopRef.current);
            breathLoopRef.current = null;
          }
          setStep("happy-intro");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ------------------ CLEANUP ------------------ */

  useEffect(() => {
    return () => {
      if (stroopRef.current) clearTimeout(stroopRef.current);
      if (stroopCountdownRef.current) clearInterval(stroopCountdownRef.current);
      if (breathLoopRef.current) clearTimeout(breathLoopRef.current);
      if (breathCountdownRef.current) clearInterval(breathCountdownRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPollRef.current) clearInterval(audioPollRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (step !== "thank-you") return;

    const submitAndRedirect = async () => {
      const success = await submitCheckin();
      if (!success) {
        return;
      }

      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

      return () => clearTimeout(timeout);
    };

    submitAndRedirect();
  }, [step, router, id]);

  /* ------------------ UI ------------------ */

  const progress = Math.min((recordingSeconds / 45) * 100, 100);
  const micBarWidth = `${Math.max(4, micLevel)}%`;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-xl font-bold">Check-in {checkinNumber}</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          {submitError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-left text-sm">
              {submitError}
            </div>
          )}

          {step === "intro" && (
            <>
              <h2 className="text-xl font-bold mb-4">
                Hello, and thank you for checking in today.
              </h2>

              <button
                onClick={() => {
                  setStep("pre-survey");
                  setSurveyRatings(prev => ({ ...prev, pre: null }));
                }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg w-full"
              >
                Start
              </button>
            </>
          )}

          {step === "pre-survey" && (
            <>
              <h2 className="text-lg font-bold mb-4">Pre check-in survey</h2>
              <p className="text-gray-600 mb-4">{PRE_POST_SURVEY_PROMPT}</p>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSurveyRatings(prev => ({ ...prev, pre: value }))}
                    className={`py-3 rounded-lg border text-lg ${
                      surveyRatings.pre === value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setStep("movie");
                  setCurrentPrompt(getBaselineQuestions(checkinNumber)[0]);
                  setQuestionIndex(0);
                }}
                disabled={surveyRatings.pre === null}
                className="bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg w-full"
              >
                Continue
              </button>
            </>
          )}

          {(step === "movie" || step === "stress") && (
            <>
              <h2 className="text-lg font-bold mb-4">{currentPrompt}</h2>

              {isRecording && (
                <div className="w-full mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-150"
                      style={{ width: micBarWidth }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Mic level</p>
                </div>
              )}

              {step !== "happy" && isRecording && recordingSeconds < 45 && (
                <div className="w-full mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p>{recordingSeconds}s / 45s</p>
                </div>
              )}

              {!isRecording && recordingSeconds === 0 && (
                <button
                  onClick={() => startRecording(step === 'movie' ? 'baseline' : 'deadline')}
                  className="bg-green-500 text-white w-full py-3 rounded-lg"
                >
                  Start Recording
                </button>
              )}

              {isRecording && recordingSeconds >= 45 && (
                <button
                  onClick={() => {
                    if (step === "movie") stopRecording("stroop-intro");
                    else stopRecording("mid-survey");
                  }}
                  className="bg-red-500 text-white w-full py-3 rounded-lg"
                >
                  Stop Recording
                </button>
              )}

              <p className="text-sm text-gray-500 mt-3">
                After 45 seconds, you will be able to stop the recording.
              </p>
            </>
          )}

          {step === "stroop-intro" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Reaction Task
              </h2>

              <p className="text-gray-600 mb-4">
                You will now see words displayed in different colors.
                Your task is to say the color of the text, not what the word spells.
                For example, if the word says RED but is shown in blue, you should say blue.
                Keep responding aloud as the words change quickly on the screen.
              </p>

              <button
                onClick={startStroop}
                className="bg-green-500 text-white w-full py-3 rounded-lg"
              >
                Start
              </button>
            </>
          )}

          {step === "stress-intro" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Now, tell me something real
              </h2>

              <button
                onClick={() => {
                  setStep("stress");
                  setCurrentPrompt(getDeadlineQuestions(checkinNumber)[0]);
                  setQuestionIndex(0);
                  setRecordingSeconds(0);
                  setSilenceSeconds(0);
                  setSurveyRatings(prev => ({ ...prev, reaction: null, deadline: null }));
                }}
                className="bg-blue-500 text-white w-full py-3 rounded-lg"
              >
                Start
              </button>
            </>
          )}

          {step === "mid-survey" && (
            <>
              <h2 className="text-lg font-bold mb-4">Mid check-in Survey</h2>
              <p className="text-gray-600 mb-4">
                Please rate how stressed you felt during the color naming task and during the task that asked about deadlines.
              </p>

              {[MID_SURVEY_QUESTIONS[0], MID_SURVEY_QUESTIONS[1]].map((question, index) => (
                <div key={question} className="mb-4">
                  <p className="mb-2 font-medium">{question}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const field = index === 0 ? 'reaction' : 'deadline';
                      return (
                        <button
                          key={value}
                          onClick={() => setSurveyRatings(prev => ({ ...prev, [field]: value }))}
                          className={`py-3 rounded-lg border text-lg ${
                            surveyRatings[field] === value
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={() => setStep("breathing-intro")}
                disabled={surveyRatings.reaction === null || surveyRatings.deadline === null}
                className="bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg w-full"
              >
                Continue
              </button>
            </>
          )}

          {step === "breathing-intro" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Relaxation Task
              </h2>

              <p className="text-gray-600 mb-4">
                You will now follow a short breathing exercise.
                When the screen says inhale, breathe in slowly.
                When it says hold, pause your breath.
                When it says exhale, breathe out slowly.
                Keep following the instructions until the exercise ends.
              </p>

              <button
                onClick={startBreathing}
                className="bg-green-500 text-white w-full py-3 rounded-lg"
              >
                Start
              </button>
            </>
          )}

          {step === "stroop" && (
            <>
              {isRecording && (
                <div className="w-full mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-150"
                      style={{ width: micBarWidth }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Mic level</p>
                </div>
              )}

              <div className={`text-5xl font-bold mb-6 ${STROOP_COLOR_MAP[stroopColor]}`}>
                {stroopWord}
              </div>
              <p>{stroopTime}s</p>
            </>
          )}

          {step === "breathing" && (
            <>
              <h2 className="text-xl font-bold mb-4">{breathPhase}</h2>

              <div className="flex justify-center mb-6">
                <div
                  className={`rounded-full bg-blue-400 transition-all duration-1000 ${
                    breathPhase === "Inhale"
                      ? "w-40 h-40"
                      : breathPhase === "Exhale"
                      ? "w-24 h-24"
                      : "w-32 h-32"
                  }`}
                />
              </div>

              <p>{breathTime}s remaining</p>
            </>
          )}

          {step === "happy-intro" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Final task
              </h2>

              <p className="text-gray-600 mb-4">
                Click start recording to see the paragraph. Then read it slowly and clearly.
              </p>

              <button
                onClick={async () => {
                  setStep("happy");
                  setRecordingSeconds(0);
                  await startRecording('reading');
                }}
                className="bg-blue-500 text-white w-full py-3 rounded-lg"
              >
                Start Recording
              </button>
            </>
          )}

          {step === "happy" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Read this aloud
              </h2>

              {isRecording && (
                <>
                  <div className="w-full mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-150"
                        style={{ width: micBarWidth }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Mic level</p>
                  </div>

                  <p className="text-gray-700 mb-4 whitespace-pre-line">
                    {HAPPY_TEXT}
                  </p>
                </>
              )}

              {isRecording && (
                <button
                  onClick={() => stopRecording("post-survey")}
                  className="bg-red-500 text-white w-full py-3 rounded-lg"
                >
                  Stop Recording
                </button>
              )}

            </>
          )}

          {step === "post-survey" && (
            <>
              <h2 className="text-lg font-bold mb-4">Post check-in survey</h2>
              <p className="text-gray-600 mb-4">{PRE_POST_SURVEY_PROMPT}</p>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSurveyRatings(prev => ({ ...prev, post: value }))}
                    className={`py-3 rounded-lg border text-lg ${
                      surveyRatings.post === value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep("thank-you")}
                disabled={surveyRatings.post === null}
                className="bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg w-full"
              >
                Complete check-in
              </button>
            </>
          )}

          {step === "thank-you" && (
            <>
              <h2 className="text-lg font-bold mb-4">Thank you!</h2>
              <p className="text-gray-600 mb-3">
                Your recording and check-in responses are being been submitted. Redirecting you to the main screen.
              </p>
              <p className="text-red-600 font-semibold">
                Please DO NOT close this window.
              </p>
            </>
          )}

          {step === "done" && (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg"
            >
              Back
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
