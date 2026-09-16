"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Page unavailable — Lost Files Library</title>
      </head>
      <body
        style={{
          background: "#020609",
          color: "#e2e7f4",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "32px",
          lineHeight: 1.6,
        }}
      >
        <main
          style={{
            maxWidth: 720,
            margin: "40px auto",
            padding: 28,
            background: "#08131f",
            border: "1px solid #345c8a",
            borderRadius: 12,
          }}
        >
          <h1>We couldn’t load Lost Files Library.</h1>
          <p role="alert">
            Please try again. Your purchases haven’t been changed.
          </p>
          <button
            onClick={() => retry()}
            style={{
              padding: "12px 20px",
              font: "inherit",
              background: "#247dff",
              color: "#0b1528",
              border: "1px solid #247dff",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <p>
            <a href="/recover" style={{ color: "inherit" }}>
              Find my purchases
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
