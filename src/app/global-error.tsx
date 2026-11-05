"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          color: "#1f2430",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "24rem" }}>
          <h1 style={{ fontSize: "1.25rem" }}>
            Something went wrong on our end.
          </h1>
          <p style={{ color: "#5b6472" }}>Please try again shortly.</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              background: "#3b6fd8",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.6rem 1.5rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
