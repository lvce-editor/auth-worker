export const successHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authentication Complete</title>
    <style>
      :root {
        color-scheme: light;
        --background: linear-gradient(180deg, #f4f7fb 0%, #e9eef8 100%);
        --panel: rgba(255, 255, 255, 0.92);
        --panel-border: rgba(33, 52, 88, 0.08);
        --text: #132238;
        --muted: #5f6f86;
        --accent: #1f7a5a;
        --accent-soft: #e7f6ef;
        --shadow: 0 24px 60px rgba(44, 65, 98, 0.16);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        font-family: Inter, sans-serif;
        background: var(--background);
        color: var(--text);
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .card {
        width: min(100%, 460px);
        padding: 32px 28px;
        border: 1px solid var(--panel-border);
        border-radius: 20px;
        background: var(--panel);
        box-shadow: var(--shadow);
        text-align: center;
        backdrop-filter: blur(12px);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin-bottom: 20px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.15;
        letter-spacing: -0.03em;
      }

      p {
        margin: 14px 0 0;
        font-size: 15px;
        line-height: 1.6;
        color: var(--muted);
      }

      .hint {
        margin-top: 22px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(19, 34, 56, 0.04);
        font-size: 14px;
      }

      .button {
        margin-top: 20px;
        border: 0;
        border-radius: 999px;
        background: var(--text);
        color: #fff;
        padding: 10px 18px;
        font: inherit;
        cursor: pointer;
      }

      .button:hover {
        background: #0d182a;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="badge" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" role="presentation">
          <path d="M20 7L10 17L5 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
      <h1>Authentication complete</h1>
      <p>Your sign-in finished successfully. You can return to the app now.</p>
      <p class="hint">This window is no longer needed and can be closed.</p>
      <button class="button" type="button" id="close-button">Close Window</button>
    </main>
    <script>
      const closeWindow = () => {
        window.close()
      }

      document.getElementById('close-button')?.addEventListener('click', closeWindow)
      window.setTimeout(closeWindow, 1200)
    </script>
  </body>
</html>`

export const errorHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authentication Failed</title>
    <style>
      :root {
        color-scheme: light;
        --background: linear-gradient(180deg, #fbf4f2 0%, #f7e5df 100%);
        --panel: rgba(255, 255, 255, 0.94);
        --panel-border: rgba(120, 43, 24, 0.12);
        --text: #3a1d16;
        --muted: #7f5a4c;
        --accent: #b4492d;
        --accent-soft: #fde9e2;
        --shadow: 0 24px 60px rgba(96, 48, 32, 0.14);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        font-family: Inter, sans-serif;
        background: var(--background);
        color: var(--text);
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .card {
        width: min(100%, 460px);
        padding: 32px 28px;
        border: 1px solid var(--panel-border);
        border-radius: 20px;
        background: var(--panel);
        box-shadow: var(--shadow);
        text-align: center;
        backdrop-filter: blur(12px);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin-bottom: 20px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.15;
        letter-spacing: -0.03em;
      }

      p {
        margin: 14px 0 0;
        font-size: 15px;
        line-height: 1.6;
        color: var(--muted);
      }

      .hint {
        margin-top: 22px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(58, 29, 22, 0.05);
        font-size: 14px;
      }

      .button {
        margin-top: 20px;
        border: 0;
        border-radius: 999px;
        background: var(--text);
        color: #fff;
        padding: 10px 18px;
        font: inherit;
        cursor: pointer;
      }

      .button:hover {
        background: #24110d;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="badge" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" role="presentation">
          <path d="M12 8V12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
          <path d="M12 16H12.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
          <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
      <h1>Authentication failed</h1>
      <p>The sign-in flow did not return an authorization code.</p>
      <p class="hint">You can close this window and try again from the app.</p>
      <button class="button" type="button" id="close-button">Close Window</button>
    </main>
    <script>
      const closeWindow = () => {
        window.close()
      }

      document.getElementById('close-button')?.addEventListener('click', closeWindow)
    </script>
  </body>
</html>`
