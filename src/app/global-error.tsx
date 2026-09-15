"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Page unavailable — Lost Files Library</title>
      </head>
      <body
        style={{
          background: "#080c0a",
          color: "#d5d9d2",
          fontFamily: "monospace",
          padding: "32px",
          lineHeight: 1.6,
        }}
      >
        <main>
          <h1>We couldn’t load Lost Files Library.</h1>
          <p role="alert">
            Please try again. Your purchases haven’t been changed.
          </p>
          <button
            onClick={() => retry()}
            style={{ padding: "12px 20px", font: "inherit" }}
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
