"use client";

import { useState } from "react";

export default function SetupPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("Fresher");
  const [interviewType, setInterviewType] =
    useState("Technical Interview");

  const [error, setError] = useState("");

  const startInterview = () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const params = new URLSearchParams();

    params.set("name", name.trim());
    params.set("role", role);
    params.set("experience", experience);
    params.set("type", interviewType);

    const interviewUrl = `/interview?${params.toString()}`;

    // Use normal browser navigation.
    // This avoids the Next.js router initialization error.
    window.location.assign(interviewUrl);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a, #172554, #312e81)",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <header
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              margin: 0,
            }}
          >
            MIRA
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "18px",
              marginTop: "10px",
            }}
          >
            AI-Powered Interviewer
          </p>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "5px",
            }}
          >
            Configure your interview before starting.
          </p>
        </header>

        {/* SETUP CARD */}

        <section
          style={{
            background: "rgba(255,255,255,0.08)",
            border:
              "1px solid rgba(255,255,255,0.15)",
            borderRadius: "22px",
            padding: "30px",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "25px",
            }}
          >
            🎯 Interview Setup
          </h2>

          {/* NAME */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Candidate Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter your name"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background:
                  "rgba(0,0,0,0.25)",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          {/* ROLE */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Target Role
            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "#1e293b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            >
              <option value="Software Engineer">
                Software Engineer
              </option>

              <option value="Frontend Developer">
                Frontend Developer
              </option>

              <option value="Backend Developer">
                Backend Developer
              </option>

              <option value="Full Stack Developer">
                Full Stack Developer
              </option>

              <option value="Data Analyst">
                Data Analyst
              </option>

              <option value="Data Scientist">
                Data Scientist
              </option>

              <option value="Machine Learning Engineer">
                Machine Learning Engineer
              </option>
            </select>
          </div>

          {/* EXPERIENCE */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Experience Level
            </label>

            <select
              value={experience}
              onChange={(e) =>
                setExperience(e.target.value)
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "#1e293b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            >
              <option value="Fresher">
                Fresher
              </option>

              <option value="0-1 Years">
                0-1 Years
              </option>

              <option value="1-3 Years">
                1-3 Years
              </option>

              <option value="3-5 Years">
                3-5 Years
              </option>

              <option value="5+ Years">
                5+ Years
              </option>
            </select>
          </div>

          {/* INTERVIEW TYPE */}

          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Interview Type
            </label>

            <select
              value={interviewType}
              onChange={(e) =>
                setInterviewType(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background: "#1e293b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            >
              <option value="Technical Interview">
                Technical Interview
              </option>

              <option value="HR Interview">
                HR Interview
              </option>

              <option value="Behavioral Interview">
                Behavioral Interview
              </option>
            </select>
          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginBottom: "15px",
                padding: "14px",
                borderRadius: "10px",
                background:
                  "rgba(220,38,38,0.2)",
                border:
                  "1px solid rgba(248,113,113,0.3)",
                color: "#fecaca",
              }}
            >
              {error}
            </div>
          )}

          {/* START BUTTON */}

          <button
            type="button"
            onClick={startInterview}
            style={{
              width: "100%",
              padding: "17px",
              border: "none",
              borderRadius: "12px",
              background: "#6366f1",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🚀 Start My Interview
          </button>
        </section>
      </div>
    </main>
  );
}