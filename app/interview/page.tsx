"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type Evaluation = {
  evaluation: string;
  strengths: string[];
  improvements: string[];
  score: number;
  communication: number;
  relevance: number;
  structure: number;
  technicalDepth: number;
  followUpQuestion: string;
};

type ScoreRecord = {
  question: string;
  score: number;
  communication: number;
  relevance: number;
  structure: number;
  technicalDepth: number;
};

const TOTAL_QUESTIONS = 5;

/* =========================================================
   QUESTION GENERATOR
========================================================= */

function getFirstQuestion(
  role: string,
  type: string
): string {
  const roleLower = role.toLowerCase();
  const typeLower = type.toLowerCase();

  if (typeLower.includes("hr")) {
    return `Tell me about yourself and why you are interested in working as a ${role}.`;
  }

  if (typeLower.includes("behavioral")) {
    return "Tell me about a challenging situation you faced and how you handled it in your career or academic experience.";
  }

  if (roleLower.includes("data scientist")) {
    return "Can you explain the difference between supervised and unsupervised learning and give one practical example of each?";
  }

  if (roleLower.includes("data analyst")) {
    return "How would you use SQL to identify the top five customers based on their total purchase amount?";
  }

  if (roleLower.includes("machine learning")) {
    return "What is overfitting in machine learning, and what techniques can you use to reduce it?";
  }

  if (roleLower.includes("frontend")) {
    return "What is the difference between HTML, CSS, and JavaScript, and how do they work together in a web application?";
  }

  if (roleLower.includes("backend")) {
    return "What is a REST API, and how does a client typically communicate with a backend server using it?";
  }

  if (roleLower.includes("full stack")) {
    return "Can you explain the typical flow of data between a frontend application, backend server, and database?";
  }

  if (
    roleLower.includes("software") ||
    roleLower.includes("developer") ||
    roleLower.includes("engineer")
  ) {
    return "Explain the difference between an array and a linked list. When would you choose one over the other?";
  }

  return `Tell me about your technical experience and why you are interested in the ${role} role.`;
}

/* =========================================================
   SAFE SCORE
========================================================= */

function safeScore(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    10,
    Math.max(0, Math.round(number))
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function InterviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>Loading MIRA...</div>}>
      <InterviewPageInner />
    </Suspense>
  );
}

function InterviewPageInner() {
  const searchParams = useSearchParams();

  const candidateName =
    searchParams.get("name") || "Candidate";

  const candidateRole =
    searchParams.get("role") ||
    "Software Engineer";

  const candidateExperience =
    searchParams.get("experience") ||
    "Fresher";

  const interviewType =
    searchParams.get("type") ||
    "Technical Interview";

  const firstQuestion = getFirstQuestion(
    candidateRole,
    interviewType
  );

  const [question, setQuestion] =
    useState<string>(firstQuestion);

  const [answer, setAnswer] =
    useState<string>("");

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [questionNumber, setQuestionNumber] =
    useState<number>(1);

  const [scores, setScores] =
    useState<ScoreRecord[]>([]);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [listening, setListening] =
    useState<boolean>(false);

  const [finished, setFinished] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const recognitionRef =
    useRef<any>(null);

  const isListeningRef =
    useRef<boolean>(false);

  /* =========================================================
     SPEECH RECOGNITION
  ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported. Please use Google Chrome."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setListening(true);
      setError("");
    };

    recognition.onresult = (
      event: any
    ) => {
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (
          event.results[i].isFinal
        ) {
          finalText +=
            transcript + " ";
        }
      }

      if (finalText.trim()) {
        setAnswer((previous) => {
          if (!previous.trim()) {
            return finalText.trim();
          }

          return (
            previous.trim() +
            " " +
            finalText.trim()
          );
        });
      }
    };

    recognition.onerror = (
      event: any
    ) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      isListeningRef.current = false;
      setListening(false);

      if (
        event.error === "not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        event.error === "no-speech"
      ) {
        setError(
          "MIRA did not hear anything. Please speak again."
        );
      } else if (
        event.error === "audio-capture"
      ) {
        setError(
          "No microphone was detected. Please check your microphone."
        );
      } else {
        setError(
          `Speech recognition error: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setListening(false);
    };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  /* =========================================================
     START LISTENING
  ========================================================= */

  const startListening = () => {
    if (!recognitionRef.current) {
      setError(
        "Speech recognition is unavailable."
      );

      return;
    }

    if (isListeningRef.current) {
      return;
    }

    setError("");

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error(
        "Could not start microphone:",
        err
      );
    }
  };

  /* =========================================================
     STOP LISTENING
  ========================================================= */

  const stopListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {}

    isListeningRef.current = false;
    setListening(false);
  };

  /* =========================================================
     MIRA TEXT TO SPEECH
  ========================================================= */

  const speakQuestion = (
    text: string
  ) => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (!window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        text
      );

    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(
      speech
    );
  };

  /* =========================================================
     EVALUATE ANSWER
  ========================================================= */

  const evaluateAnswer = async () => {
    if (!answer.trim()) {
      setError(
        "Please type or speak your answer first."
      );

      return;
    }

    if (loading) {
      return;
    }

    stopListening();

    setLoading(true);
    setError("");
    setEvaluation(null);

    try {
      const response =
        await fetch(
          "/api/interview",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              question,
              answer,
              candidateName,
              role: candidateRole,
              experience:
                candidateExperience,
              interviewType,
            }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        console.error(
          "MIRA API returned non-JSON:",
          text
        );

        throw new Error(
          "MIRA API did not return JSON. Please check app/api/interview/route.ts."
        );
      }

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "MIRA could not evaluate the answer."
        );
      }

      const rawResult =
        data.result;

      if (!rawResult) {
        throw new Error(
          "MIRA returned an empty evaluation."
        );
      }

      const result: Evaluation = {
        evaluation:
          String(
            rawResult.evaluation ||
              "MIRA evaluated your answer."
          ),

        communication:
          safeScore(
            rawResult.communication
          ),

        relevance:
          safeScore(
            rawResult.relevance
          ),

        structure:
          safeScore(
            rawResult.structure
          ),

        technicalDepth:
          safeScore(
            rawResult.technicalDepth
          ),

        score:
          safeScore(
            rawResult.score
          ),

        strengths:
          Array.isArray(
            rawResult.strengths
          )
            ? rawResult.strengths.map(
                (item: unknown) =>
                  String(item)
              )
            : [],

        improvements:
          Array.isArray(
            rawResult.improvements
          )
            ? rawResult.improvements.map(
                (item: unknown) =>
                  String(item)
              )
            : [],

        followUpQuestion:
          String(
            rawResult.followUpQuestion ||
              ""
          ),
      };

      setEvaluation(result);

      setScores((previous) => [
        ...previous,
        {
          question,
          score: result.score,
          communication:
            result.communication,
          relevance:
            result.relevance,
          structure:
            result.structure,
          technicalDepth:
            result.technicalDepth,
        },
      ]);
    } catch (err: any) {
      console.error(
        "MIRA evaluation error:",
        err
      );

      setError(
        err?.message ||
          "MIRA could not process your answer."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     NEXT QUESTION
  ========================================================= */

  const goToNextQuestion = () => {
    if (!evaluation) {
      return;
    }

    if (
      questionNumber >=
      TOTAL_QUESTIONS
    ) {
      setFinished(true);
      setEvaluation(null);
      return;
    }

    const nextQuestion =
      evaluation.followUpQuestion.trim();

    if (!nextQuestion) {
      setError(
        "MIRA did not generate the next question."
      );

      return;
    }

    setQuestionNumber(
      (previous) =>
        previous + 1
    );

    setQuestion(
      nextQuestion
    );

    setAnswer("");

    setEvaluation(null);

    setError("");

    setTimeout(() => {
      speakQuestion(
        nextQuestion
      );
    }, 500);
  };

  /* =========================================================
     RESET / NEW INTERVIEW
  ========================================================= */

  const startNewInterview = () => {
    window.location.href =
      "/setup";
  };

  /* =========================================================
     SCORE CALCULATIONS
  ========================================================= */

  const calculateAverage = (
    key:
      | "score"
      | "communication"
      | "relevance"
      | "structure"
      | "technicalDepth"
  ): number => {
    if (scores.length === 0) {
      return 0;
    }

    const total =
      scores.reduce(
        (sum, item) =>
          sum + item[key],
        0
      );

    return Number(
      (total / scores.length).toFixed(
        1
      )
    );
  };

  const averageScore =
    calculateAverage("score");

  const averageCommunication =
    calculateAverage(
      "communication"
    );

  const averageRelevance =
    calculateAverage(
      "relevance"
    );

  const averageStructure =
    calculateAverage("structure");

  const averageTechnicalDepth =
    calculateAverage(
      "technicalDepth"
    );

  /* =========================================================
     PERFORMANCE MESSAGE
  ========================================================= */

  const performanceMessage =
    averageScore >= 8
      ? "Excellent performance. You demonstrated strong understanding, clear communication, and good interview readiness."
      : averageScore >= 6
      ? "Good performance. You demonstrated a reasonable understanding of the topics, with a few areas that can be improved."
      : averageScore >= 4
      ? "You showed a basic understanding of the topics. More practice can help improve confidence, structure, and technical depth."
      : "You should focus on strengthening your fundamentals and practicing interview questions regularly.";

  /* =========================================================
     BEST QUESTION
  ========================================================= */

  const bestQuestion =
    scores.length > 0
      ? scores.reduce(
          (best, current) =>
            current.score >
            best.score
              ? current
              : best
        )
      : null;

  /* =========================================================
     WEAKEST CATEGORY
  ========================================================= */

  const categoryScores = [
    {
      name: "Communication",
      score:
        averageCommunication,
    },
    {
      name: "Relevance",
      score:
        averageRelevance,
    },
    {
      name: "Structure",
      score:
        averageStructure,
    },
    {
      name: "Technical Depth",
      score:
        averageTechnicalDepth,
    },
  ];

  const weakestCategory =
    categoryScores.length > 0
      ? categoryScores.reduce(
          (weakest, current) =>
            current.score <
            weakest.score
              ? current
              : weakest
        )
      : null;

  /* =========================================================
     FINAL REPORT
  ========================================================= */

  if (finished) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)",
          color: "white",
          padding: "40px 20px 70px",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {/* =================================================
              REPORT HEADER
          ================================================= */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent:
                  "center",
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background:
                  "rgba(99,102,241,0.25)",
                border:
                  "1px solid rgba(165,180,252,0.35)",
                fontSize: "32px",
                marginBottom: "15px",
              }}
            >
              ✓
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(30px, 5vw, 46px)",
                margin:
                  "0 0 10px",
              }}
            >
              Interview Completed
            </h1>

            <p
              style={{
                color:
                  "#cbd5e1",
                fontSize: "17px",
                margin: 0,
              }}
            >
              MIRA has completed your
              interview evaluation.
            </p>
          </div>

          {/* =================================================
              SUMMARY TOP CARDS
          ================================================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "16px",
              marginBottom: "22px",
            }}
          >
            <SummaryCard
              label="Candidate"
              value={candidateName}
              icon="👤"
            />

            <SummaryCard
              label="Role"
              value={candidateRole}
              icon="💼"
            />

            <SummaryCard
              label="Questions"
              value={`${scores.length}/${TOTAL_QUESTIONS}`}
              icon="📝"
            />

            <SummaryCard
              label="Overall Score"
              value={`${averageScore}/10`}
              icon="🏆"
              highlight
            />
          </div>

          {/* =================================================
              MAIN SCOREBOARD
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap: "wrap",
                gap: "15px",
                marginBottom:
                  "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      "0 0 7px",
                    fontSize:
                      "26px",
                  }}
                >
                  📊 Performance Overview
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      "#94a3b8",
                  }}
                >
                  Your overall interview
                  performance
                </p>
              </div>

              <div
                style={{
                  padding:
                    "8px 15px",
                  borderRadius:
                    "999px",
                  background:
                    averageScore >= 8
                      ? "rgba(34,197,94,0.18)"
                      : averageScore >= 6
                      ? "rgba(234,179,8,0.18)"
                      : "rgba(239,68,68,0.18)",
                  color:
                    averageScore >= 8
                      ? "#86efac"
                      : averageScore >= 6
                      ? "#fde047"
                      : "#fca5a5",
                  fontWeight:
                    "bold",
                  fontSize:
                    "14px",
                }}
              >
                {averageScore >= 8
                  ? "Excellent"
                  : averageScore >= 6
                  ? "Good"
                  : averageScore >= 4
                  ? "Needs Practice"
                  : "Needs Improvement"}
              </div>
            </div>

            {/* SCORE + GRAPH */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 0.8fr) minmax(300px, 1.6fr)",
                gap: "35px",
                alignItems:
                  "center",
              }}
            >
              {/* CIRCULAR SCORE */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <CircularScore
                  score={
                    averageScore
                  }
                />
              </div>

              {/* PERFORMANCE GRAPH */}

              <div>
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "18px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        "18px",
                    }}
                  >
                    Category Performance
                  </h3>

                  <span
                    style={{
                      color:
                        "#94a3b8",
                      fontSize:
                        "13px",
                    }}
                  >
                    Score out of 10
                  </span>
                </div>

                <PerformanceBar
                  label="Communication"
                  score={
                    averageCommunication
                  }
                  icon="🗣️"
                />

                <PerformanceBar
                  label="Relevance"
                  score={
                    averageRelevance
                  }
                  icon="🎯"
                />

                <PerformanceBar
                  label="Structure"
                  score={
                    averageStructure
                  }
                  icon="🧩"
                />

                <PerformanceBar
                  label="Technical Depth"
                  score={
                    averageTechnicalDepth
                  }
                  icon="💻"
                />
              </div>
            </div>
          </section>

          {/* =================================================
              CATEGORY CARDS
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 22px",
                fontSize:
                  "24px",
              }}
            >
              📈 Category-wise Performance
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
              }}
            >
              <LargeScoreCard
                title="Communication"
                score={
                  averageCommunication
                }
                icon="🗣️"
              />

              <LargeScoreCard
                title="Relevance"
                score={
                  averageRelevance
                }
                icon="🎯"
              />

              <LargeScoreCard
                title="Structure"
                score={
                  averageStructure
                }
                icon="🧩"
              />

              <LargeScoreCard
                title="Technical Depth"
                score={
                  averageTechnicalDepth
                }
                icon="💻"
              />
            </div>
          </section>

          {/* =================================================
              QUESTION-WISE GRAPH
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <h2
                style={{
                  margin:
                    "0 0 7px",
                  fontSize:
                    "24px",
                }}
              >
                📊 Question-wise Performance
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#94a3b8",
                }}
              >
                See how your performance
                changed across the
                interview.
              </p>
            </div>

            <QuestionGraph
              scores={scores}
            />
          </section>

          {/* =================================================
              PERFORMANCE INSIGHTS
          ================================================= */}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "18px",
              marginBottom: "22px",
            }}
          >
            <InsightCard
              title="🏆 Best Question"
              value={
                bestQuestion
                  ? `${bestQuestion.score}/10`
                  : "N/A"
              }
              description={
                bestQuestion
                  ? bestQuestion.question
                  : "No question data available."
              }
            />

            <InsightCard
              title="🎯 Focus Area"
              value={
                weakestCategory
                  ? weakestCategory.name
                  : "N/A"
              }
              description={
                weakestCategory
                  ? `Your average score in this category was ${weakestCategory.score}/10.`
                  : "No category data available."
              }
            />
          </section>

          {/* =================================================
              MIRA OVERALL FEEDBACK
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 18px",
                fontSize:
                  "24px",
              }}
            >
              🤖 MIRA's Overall Assessment
            </h2>

            <div
              style={{
                background:
                  "rgba(0,0,0,0.22)",
                borderRadius:
                  "16px",
                padding: "22px",
                lineHeight:
                  1.7,
                color:
                  "#cbd5e1",
              }}
            >
              {performanceMessage}
            </div>
          </section>

          {/* =================================================
              QUESTION-WISE SCORES
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 22px",
                fontSize:
                  "24px",
              }}
            >
              📝 Question-wise Scores
            </h2>

            {scores.map(
              (item, index) => (
                <QuestionResult
                  key={index}
                  item={item}
                  index={index}
                />
              )
            )}
          </section>

          {/* =================================================
              FINAL SCORE BREAKDOWN
          ================================================= */}

          <section
            style={{
              background:
                "rgba(255,255,255,0.07)",
              border:
                "1px solid rgba(255,255,255,0.14)",
              borderRadius: "24px",
              padding: "30px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 20px",
                fontSize:
                  "24px",
              }}
            >
              📋 Final Score Breakdown
            </h2>

            <div
              style={{
                display: "grid",
                gap: "13px",
              }}
            >
              <FinalBreakdownRow
                label="Overall Score"
                score={
                  averageScore
                }
              />

              <FinalBreakdownRow
                label="Communication"
                score={
                  averageCommunication
                }
              />

              <FinalBreakdownRow
                label="Relevance"
                score={
                  averageRelevance
                }
              />

              <FinalBreakdownRow
                label="Structure"
                score={
                  averageStructure
                }
              />

              <FinalBreakdownRow
                label="Technical Depth"
                score={
                  averageTechnicalDepth
                }
              />
            </div>
          </section>

          {/* =================================================
              START NEW INTERVIEW
          ================================================= */}

          <button
            type="button"
            onClick={
              startNewInterview
            }
            style={{
              width: "100%",
              marginTop: "5px",
              padding: "17px",
              border: "none",
              borderRadius: "14px",
              background:
                "#6366f1",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow:
                "0 10px 30px rgba(99,102,241,0.25)",
            }}
          >
            🔄 Start New Interview
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN INTERVIEW SCREEN
  ========================================================= */

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)",
        color: "white",
        padding: "40px 20px 70px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <header
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background:
                "rgba(99,102,241,0.25)",
              border:
                "1px solid rgba(165,180,252,0.3)",
              fontSize: "28px",
              marginBottom:
                "12px",
            }}
          >
            M
          </div>

          <h1
            style={{
              fontSize: "40px",
              margin: 0,
            }}
          >
            MIRA
          </h1>

          <p
            style={{
              color:
                "#cbd5e1",
              marginTop:
                "8px",
            }}
          >
            AI-Powered Interviewer
          </p>
        </header>

        {/* MAIN CARD */}

        <section
          style={{
            background:
              "rgba(255,255,255,0.08)",
            border:
              "1px solid rgba(255,255,255,0.15)",
            borderRadius: "22px",
            padding: "30px",
          }}
        >
          {/* CANDIDATE INFORMATION */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginBottom:
                "25px",
            }}
          >
            <InfoCard
              label="CANDIDATE"
              value={
                candidateName
              }
            />

            <InfoCard
              label="ROLE"
              value={
                candidateRole
              }
            />

            <InfoCard
              label="EXPERIENCE"
              value={
                candidateExperience
              }
            />

            <InfoCard
              label="TYPE"
              value={
                interviewType
              }
            />
          </div>

          {/* PROGRESS */}

          <div
            style={{
              marginBottom:
                "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom:
                  "8px",
                color:
                  "#cbd5e1",
              }}
            >
              <span>
                Interview Progress
              </span>

              <span>
                {questionNumber}/
                {TOTAL_QUESTIONS}
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: "8px",
                background:
                  "rgba(255,255,255,0.15)",
                borderRadius:
                  "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${
                    (questionNumber /
                      TOTAL_QUESTIONS) *
                    100
                  }%`,
                  height: "100%",
                  background:
                    "#6366f1",
                  transition:
                    "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* QUESTION */}

          <div
            style={{
              background:
                "rgba(0,0,0,0.25)",
              padding: "25px",
              borderRadius: "16px",
              marginBottom:
                "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "15px",
              }}
            >
              <p
                style={{
                  color:
                    "#a5b4fc",
                  fontWeight:
                    "bold",
                  margin: 0,
                }}
              >
                QUESTION{" "}
                {questionNumber}
              </p>

              <button
                type="button"
                onClick={() =>
                  speakQuestion(
                    question
                  )
                }
                style={{
                  padding:
                    "8px 14px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(255,255,255,0.2)",
                  background:
                    "rgba(255,255,255,0.08)",
                  color:
                    "white",
                  cursor:
                    "pointer",
                }}
              >
                🔊 Hear
              </button>
            </div>

            <h2
              style={{
                lineHeight: 1.5,
                marginBottom: 0,
                fontSize:
                  "clamp(21px, 3vw, 28px)",
              }}
            >
              {question}
            </h2>
          </div>

          {/* ANSWER */}

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(
                e.target.value
              )
            }
            disabled={loading}
            placeholder="Type your answer or use the microphone..."
            style={{
              width: "100%",
              minHeight: "180px",
              boxSizing:
                "border-box",
              padding: "18px",
              borderRadius:
                "15px",
              border:
                "1px solid rgba(255,255,255,0.2)",
              background:
                "rgba(0,0,0,0.25)",
              color: "white",
              fontSize: "16px",
              resize: "vertical",
              outline: "none",
              fontFamily:
                "Arial, Helvetica, sans-serif",
            }}
          />

          {/* MICROPHONE CONTROLS */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop:
                "15px",
            }}
          >
            <button
              type="button"
              onClick={
                listening
                  ? stopListening
                  : startListening
              }
              disabled={loading}
              style={{
                flex: 1,
                padding: "15px",
                border: "none",
                borderRadius:
                  "12px",
                background:
                  listening
                    ? "#dc2626"
                    : "#475569",
                color: "white",
                fontWeight:
                  "bold",
                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {listening
                ? "⏹ Stop Speaking"
                : "🎤 Start Speaking"}
            </button>

            <button
              type="button"
              onClick={() =>
                setAnswer("")
              }
              disabled={
                loading ||
                !answer
              }
              style={{
                padding:
                  "15px 20px",
                borderRadius:
                  "12px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background:
                  "transparent",
                color:
                  "white",
                cursor:
                  "pointer",
              }}
            >
              Clear
            </button>
          </div>

          {/* SUBMIT */}

          <button
            type="button"
            onClick={
              evaluateAnswer
            }
            disabled={
              loading ||
              !answer.trim()
            }
            style={{
              width: "100%",
              marginTop:
                "15px",
              padding: "17px",
              border: "none",
              borderRadius:
                "12px",
              background:
                loading ||
                !answer.trim()
                  ? "#475569"
                  : "#6366f1",
              color: "white",
              fontSize:
                "16px",
              fontWeight:
                "bold",
              cursor:
                loading ||
                !answer.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "🤖 MIRA is analyzing..."
              : "Submit Answer →"}
          </button>

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginTop:
                  "15px",
                padding:
                  "15px",
                borderRadius:
                  "10px",
                background:
                  "rgba(220,38,38,0.2)",
                border:
                  "1px solid rgba(248,113,113,0.25)",
                color:
                  "#fecaca",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              LIVE EVALUATION
          ================================================= */}

          {evaluation && (
            <div
              style={{
                marginTop:
                  "30px",
              }}
            >
              <div
                style={{
                  background:
                    "rgba(0,0,0,0.25)",
                  padding:
                    "25px",
                  borderRadius:
                    "18px",
                }}
              >
                {/* LIVE SCORE */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    flexWrap:
                      "wrap",
                    gap: "15px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color:
                          "#94a3b8",
                        margin:
                          "0 0 5px",
                        fontSize:
                          "13px",
                        fontWeight:
                          "bold",
                      }}
                    >
                      MIRA EVALUATION
                    </p>

                    <h3
                      style={{
                        margin:
                          "0",
                        fontSize:
                          "25px",
                      }}
                    >
                      📊 Overall Score
                    </h3>
                  </div>

                  <div
                    style={{
                      fontSize:
                        "34px",
                      fontWeight:
                        "bold",
                      color:
                        "#a5b4fc",
                    }}
                  >
                    {evaluation.score}
                    <span
                      style={{
                        fontSize:
                          "15px",
                        color:
                          "#94a3b8",
                      }}
                    >
                      /10
                    </span>
                  </div>
                </div>

                {/* CATEGORY SCORES */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "10px",
                    marginTop:
                      "20px",
                  }}
                >
                  <MiniScore
                    title="Communication"
                    score={
                      evaluation.communication
                    }
                  />

                  <MiniScore
                    title="Relevance"
                    score={
                      evaluation.relevance
                    }
                  />

                  <MiniScore
                    title="Structure"
                    score={
                      evaluation.structure
                    }
                  />

                  <MiniScore
                    title="Technical Depth"
                    score={
                      evaluation.technicalDepth
                    }
                  />
                </div>

                {/* EVALUATION */}

                <h4
                  style={{
                    marginTop:
                      "25px",
                  }}
                >
                  🧠 Evaluation
                </h4>

                <p
                  style={{
                    color:
                      "#cbd5e1",
                    lineHeight:
                      1.7,
                  }}
                >
                  {
                    evaluation.evaluation
                  }
                </p>

                {/* STRENGTHS */}

                <h4>
                  ✅ Strengths
                </h4>

                <ul
                  style={{
                    color:
                      "#cbd5e1",
                    lineHeight:
                      1.7,
                  }}
                >
                  {evaluation
                    .strengths
                    .length >
                  0 ? (
                    evaluation.strengths.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                          style={{
                            marginBottom:
                              "6px",
                          }}
                        >
                          {item}
                        </li>
                      )
                    )
                  ) : (
                    <li>
                      Good effort in
                      answering the
                      question.
                    </li>
                  )}
                </ul>

                {/* IMPROVEMENTS */}

                <h4>
                  🔧 Areas for Improvement
                </h4>

                <ul
                  style={{
                    color:
                      "#cbd5e1",
                    lineHeight:
                      1.7,
                  }}
                >
                  {evaluation
                    .improvements
                    .length >
                  0 ? (
                    evaluation.improvements.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                          style={{
                            marginBottom:
                              "6px",
                          }}
                        >
                          {item}
                        </li>
                      )
                    )
                  ) : (
                    <li>
                      Continue practicing
                      interview
                      questions.
                    </li>
                  )}
                </ul>

                {/* FOLLOW UP */}

                <div
                  style={{
                    marginTop:
                      "22px",
                    padding:
                      "18px",
                    borderRadius:
                      "13px",
                    background:
                      "rgba(99,102,241,0.12)",
                    border:
                      "1px solid rgba(129,140,248,0.2)",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#a5b4fc",
                      fontSize:
                        "13px",
                      fontWeight:
                        "bold",
                      marginBottom:
                        "7px",
                    }}
                  >
                    MIRA'S NEXT QUESTION
                  </div>

                  <div
                    style={{
                      lineHeight:
                        1.6,
                      color:
                        "#e2e8f0",
                    }}
                  >
                    {
                      evaluation.followUpQuestion
                    }
                  </div>
                </div>
              </div>

              {/* NEXT */}

              <button
                type="button"
                onClick={
                  goToNextQuestion
                }
                style={{
                  width: "100%",
                  marginTop:
                    "15px",
                  padding:
                    "16px",
                  border: "none",
                  borderRadius:
                    "12px",
                  background:
                    "#6366f1",
                  color: "white",
                  fontSize:
                    "16px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                {questionNumber >=
                TOTAL_QUESTIONS
                  ? "🏁 Finish Interview"
                  : "➡️ Next Question"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background:
          highlight
            ? "rgba(99,102,241,0.24)"
            : "rgba(0,0,0,0.22)",
        border:
          highlight
            ? "1px solid rgba(129,140,248,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
        padding:
          "20px",
        borderRadius:
          "17px",
      }}
    >
      <div
        style={{
          fontSize:
            "20px",
          marginBottom:
            "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color:
            "#94a3b8",
          fontSize:
            "12px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.06em",
          marginBottom:
            "7px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize:
            "20px",
          display:
            "block",
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   CIRCULAR SCORE
========================================================= */

function CircularScore({
  score,
}: {
  score: number;
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        score * 10
      )
    );

  const radius = 82;
  const circumference =
    2 *
    Math.PI *
    radius;

  const dashOffset =
    circumference -
    (percentage /
      100) *
      circumference;

  return (
    <div
      style={{
        position:
          "relative",
        width:
          "220px",
        height:
          "220px",
      }}
    >
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        style={{
          transform:
            "rotate(-90deg)",
        }}
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="15"
        />

        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#818cf8"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            dashOffset
          }
          style={{
            transition:
              "stroke-dashoffset 0.8s ease",
          }}
        />
      </svg>

      <div
        style={{
          position:
            "absolute",
          inset: 0,
          display:
            "flex",
          flexDirection:
            "column",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <div
          style={{
            fontSize:
              "42px",
            fontWeight:
              "bold",
          }}
        >
          {score}
        </div>

        <div
          style={{
            color:
              "#94a3b8",
            fontSize:
              "14px",
          }}
        >
          out of 10
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PERFORMANCE BAR
========================================================= */

function PerformanceBar({
  label,
  score,
  icon,
}: {
  label: string;
  score: number;
  icon: string;
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        score * 10
      )
    );

  return (
    <div
      style={{
        marginBottom:
          "18px",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "7px",
        }}
      >
        <span
          style={{
            color:
              "#e2e8f0",
            fontSize:
              "14px",
          }}
        >
          {icon} {label}
        </span>

        <strong
          style={{
            fontSize:
              "14px",
          }}
        >
          {score}/10
        </strong>
      </div>

      <div
        style={{
          width:
            "100%",
          height:
            "11px",
          background:
            "rgba(255,255,255,0.08)",
          borderRadius:
            "999px",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height:
              "100%",
            background:
              "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius:
              "999px",
            transition:
              "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   LARGE SCORE CARD
========================================================= */

function LargeScoreCard({
  title,
  score,
  icon,
}: {
  title: string;
  score: number;
  icon: string;
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        score * 10
      )
    );

  return (
    <div
      style={{
        background:
          "rgba(0,0,0,0.22)",
        border:
          "1px solid rgba(255,255,255,0.07)",
        borderRadius:
          "18px",
        padding:
          "22px",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "17px",
        }}
      >
        <span
          style={{
            color:
              "#cbd5e1",
            fontSize:
              "14px",
          }}
        >
          {icon} {title}
        </span>

        <strong
          style={{
            fontSize:
              "24px",
          }}
        >
          {score}
        </strong>
      </div>

      <div
        style={{
          height:
            "100px",
          display:
            "flex",
          alignItems:
            "flex-end",
          gap:
            "8px",
        }}
      >
        {[
          30,
          45,
          60,
          75,
          90,
          percentage,
        ].map(
          (
            value,
            index
          ) => (
            <div
              key={
                index
              }
              style={{
                flex: 1,
                height: `${Math.max(
                  8,
                  (value / 100) *
                    100
                )}%`,
                background:
                  index ===
                  5
                    ? "#818cf8"
                    : "rgba(129,140,248,0.22)",
                borderRadius:
                  "5px 5px 0 0",
                transition:
                  "height 0.5s ease",
              }}
            />
          )
        )}
      </div>

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          marginTop:
            "8px",
          color:
            "#64748b",
          fontSize:
            "11px",
        }}
      >
        <span>
          Low
        </span>

        <span>
          Performance
        </span>

        <span>
          High
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   QUESTION GRAPH
========================================================= */

function QuestionGraph({
  scores,
}: {
  scores: ScoreRecord[];
}) {
  if (scores.length === 0) {
    return (
      <div
        style={{
          padding:
            "30px",
          textAlign:
            "center",
          color:
            "#94a3b8",
        }}
      >
        No score data available.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          height:
            "260px",
          display:
            "flex",
          alignItems:
            "flex-end",
          gap:
            "clamp(8px, 2vw, 20px)",
          padding:
            "20px 10px 0",
          borderBottom:
            "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {scores.map(
          (
            item,
            index
          ) => {
            const height =
              Math.max(
                8,
                item.score *
                  10
              );

            return (
              <div
                key={
                  index
                }
                style={{
                  flex: 1,
                  height:
                    "100%",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "flex-end",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  minWidth:
                    "35px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "13px",
                    fontWeight:
                      "bold",
                    color:
                      "#c7d2fe",
                  }}
                >
                  {item.score}
                </div>

                <div
                  style={{
                    width:
                      "100%",
                    maxWidth:
                      "70px",
                    height: `${height}%`,
                    minHeight:
                      "8px",
                    background:
                      "linear-gradient(180deg, #818cf8, #4f46e5)",
                    borderRadius:
                      "8px 8px 2px 2px",
                    transition:
                      "height 0.6s ease",
                    boxShadow:
                      "0 8px 25px rgba(99,102,241,0.18)",
                  }}
                />
              </div>
            );
          }
        )}
      </div>

      <div
        style={{
          display:
            "flex",
          gap:
            "clamp(8px, 2vw, 20px)",
          padding:
            "10px",
        }}
      >
        {scores.map(
          (
            _item,
            index
          ) => (
            <div
              key={
                index
              }
              style={{
                flex: 1,
                textAlign:
                  "center",
                color:
                  "#94a3b8",
                fontSize:
                  "12px",
              }}
            >
              Q{index + 1}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,0.07)",
        border:
          "1px solid rgba(255,255,255,0.14)",
        borderRadius:
          "20px",
        padding:
          "25px",
      }}
    >
      <div
        style={{
          color:
            "#94a3b8",
          fontSize:
            "13px",
          marginBottom:
            "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize:
            "25px",
          fontWeight:
            "bold",
          marginBottom:
            "10px",
        }}
      >
        {value}
      </div>

      <p
        style={{
          color:
            "#cbd5e1",
          fontSize:
            "13px",
          lineHeight:
            1.6,
          margin:
            0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   QUESTION RESULT
========================================================= */

function QuestionResult({
  item,
  index,
}: {
  item: ScoreRecord;
  index: number;
}) {
  return (
    <div
      style={{
        background:
          "rgba(0,0,0,0.22)",
        padding:
          "20px",
        borderRadius:
          "16px",
        marginBottom:
          "13px",
        border:
          "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          gap:
            "15px",
          alignItems:
            "flex-start",
        }}
      >
        <div
          style={{
            flex: 1,
          }}
        >
          <div
            style={{
              color:
                "#a5b4fc",
              fontSize:
                "12px",
              fontWeight:
                "bold",
              marginBottom:
                "8px",
              letterSpacing:
                "0.05em",
            }}
          >
            QUESTION{" "}
            {index + 1}
          </div>

          <div
            style={{
              color:
                "#e2e8f0",
              lineHeight:
                1.6,
            }}
          >
            {item.question}
          </div>
        </div>

        <div
          style={{
            minWidth:
              "65px",
            textAlign:
              "center",
            padding:
              "10px",
            borderRadius:
              "12px",
            background:
              "rgba(99,102,241,0.14)",
          }}
        >
          <div
            style={{
              fontSize:
                "22px",
              fontWeight:
                "bold",
            }}
          >
            {item.score}
          </div>

          <div
            style={{
              fontSize:
                "11px",
              color:
                "#94a3b8",
            }}
          >
            /10
          </div>
        </div>
      </div>

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(120px, 1fr))",
          gap:
            "10px",
          marginTop:
            "18px",
        }}
      >
        <MiniScore
          title="Communication"
          score={
            item.communication
          }
        />

        <MiniScore
          title="Relevance"
          score={
            item.relevance
          }
        />

        <MiniScore
          title="Structure"
          score={
            item.structure
          }
        />

        <MiniScore
          title="Technical"
          score={
            item.technicalDepth
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   FINAL BREAKDOWN ROW
========================================================= */

function FinalBreakdownRow({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        score * 10
      )
    );

  return (
    <div
      style={{
        display:
          "grid",
        gridTemplateColumns:
          "150px 1fr 55px",
        gap:
          "15px",
        alignItems:
          "center",
      }}
    >
      <span
        style={{
          color:
            "#cbd5e1",
          fontSize:
            "14px",
        }}
      >
        {label}
      </span>

      <div
        style={{
          height:
            "9px",
          background:
            "rgba(255,255,255,0.08)",
          borderRadius:
            "999px",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height:
              "100%",
            background:
              "linear-gradient(90deg, #6366f1, #818cf8)",
            borderRadius:
              "999px",
          }}
        />
      </div>

      <strong
        style={{
          textAlign:
            "right",
        }}
      >
        {score}
      </strong>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background:
          "rgba(0,0,0,0.2)",
        padding:
          "12px",
        borderRadius:
          "10px",
      }}
    >
      <small
        style={{
          color:
            "#94a3b8",
        }}
      >
        {label}
      </small>

      <div
        style={{
          marginTop:
            "4px",
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   MINI SCORE
========================================================= */

function MiniScore({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,0.06)",
        padding:
          "11px",
        borderRadius:
          "10px",
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          color:
            "#94a3b8",
          fontSize:
            "11px",
          marginBottom:
            "5px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize:
            "15px",
        }}
      >
        {score}/10
      </strong>
    </div>
  );
}