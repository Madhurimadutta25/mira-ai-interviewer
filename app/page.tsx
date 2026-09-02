"use client";

export default function HomePage() {
  const openSetup = () => {
    window.location.assign("/setup");
  };

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
          maxWidth: "650px",
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            marginBottom: "10px",
          }}
        >
          MIRA
        </h1>

        <p
          style={{
            fontSize: "22px",
            color: "#cbd5e1",
            marginBottom: "35px",
          }}
        >
          AI-Powered Interviewer
        </p>

        <button
          type="button"
          onClick={openSetup}
          style={{
            padding: "17px 35px",
            border: "none",
            borderRadius: "12px",
            background: "#6366f1",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🚀 Start My Interview
        </button>
      </div>
    </main>
  );
}