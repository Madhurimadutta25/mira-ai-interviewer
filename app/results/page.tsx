"use client";

import { useEffect, useState } from "react";

type InterviewResult = {
  candidateName: string;
  role: string;
  experience: string;
  interviewType: string;
  date: string;
  score: number;
  totalQuestions: number;
};

export default function ResultsPage() {
  const [result, setResult] =
    useState<InterviewResult | null>(null);

  useEffect(() => {
    const saved =
      localStorage.getItem("miraInterviewResult");

    if (saved) {
      try {
        setResult(JSON.parse(saved));
      } catch {
        setResult(null);
      }
    }
  }, []);

  if (!result) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a, #172554, #312e81)",
          color: "white",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          <h1>No Interview Result Found</h1>

          <p
            style={{
              color: "#cbd5e1",
              marginTop: "10px",
            }}
          >
            Complete an interview first to
            view your MIRA results.
          </p>

          <button
            onClick={() => {
              window.location.href =
                "/setup";
            }}
            style={{
              marginTop: "20px",
              padding: "14px 25px",
              border: "none",
              borderRadius: "10px",
              background: "#6366f1",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Start Interview
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a, #172554, #312e81)",
        color: "white",
        padding: "40px 20px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            MIRA Interview Results
          </h1>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            AI-powered interview performance
            report
          </p>
        </div>

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
          <h2>Candidate Information</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <InfoCard
              title="Candidate"
              value={result.candidateName}
            />

            <InfoCard
              title="Role"
              value={result.role}
            />

            <InfoCard
              title="Experience"
              value={result.experience}
            />

            <InfoCard
              title="Interview Type"
              value={result.interviewType}
            />

            <InfoCard
              title="Date"
              value={result.date}
            />

            <InfoCard
              title="Questions"
              value={String(
                result.totalQuestions
              )}
            />
          </div>

          <div
            style={{
              marginTop: "30px",
              padding: "30px",
              borderRadius: "18px",
              background:
                "rgba(99,102,241,0.2)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#c7d2fe",
                margin: 0,
              }}
            >
              FINAL SCORE
            </p>

            <div
              style={{
                fontSize: "55px",
                fontWeight: "bold",
                marginTop: "5px",
              }}
            >
              {result.score}/10
            </div>

            <p
              style={{
                color: "#cbd5e1",
              }}
            >
              {result.score >= 8
                ? "Excellent Performance"
                : result.score >= 6
                ? "Good Performance"
                : "Needs Improvement"}
            </p>
          </div>

          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background:
                "rgba(0,0,0,0.2)",
              borderRadius: "15px",
            }}
          >
            <h3>
              📊 Performance Summary
            </h3>

            <p
              style={{
                color: "#cbd5e1",
                lineHeight: 1.7,
              }}
            >
              MIRA evaluated your responses
              based on technical knowledge,
              relevance, clarity and
              problem-solving ability.
            </p>

            {result.score >= 8 && (
              <p>
                ⭐ You demonstrated a strong
                understanding of the
                interview topics.
              </p>
            )}

            {result.score >= 6 &&
              result.score < 8 && (
                <p>
                  👍 You demonstrated a good
                  understanding, but there is
                  room for improvement.
                </p>
              )}

            {result.score < 6 && (
              <p>
                📚 Continue practicing the
                relevant technical concepts
                and interview questions.
              </p>
            )}
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/setup";
            }}
            style={{
              width: "100%",
              marginTop: "25px",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              background: "#6366f1",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Start New Interview
          </button>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background:
          "rgba(0,0,0,0.22)",
        padding: "18px",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginBottom: "6px",
        }}
      >
        {title.toUpperCase()}
      </div>

      <strong>{value}</strong>
    </div>
  );
}