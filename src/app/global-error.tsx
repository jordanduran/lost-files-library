"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Page unavailable — Lost Files Library</title>
      </head>
      <body
        style={{
          background: "#367d93",
          color: "#151515",
          fontFamily: "Tahoma, Arial, sans-serif",
          padding: "32px",
          lineHeight: 1.6,
        }}
      >
        <main
          style={{
            background: "#c0c0c0",
            border: "3px outset white",
            padding: "24px",
            maxWidth: "720px",
            margin: "40px auto",
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
              background: "#c0c0c0",
              color: "#151515",
              border: "2px outset white",
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
