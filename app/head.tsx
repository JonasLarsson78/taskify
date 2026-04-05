export default function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* Favicons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" href="/favicon.ico" />
      {/* Android Chrome icons */}
      <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      {/* SVGs for reference (not standard for favicons, but can be used elsewhere) */}
      {/* <link rel="icon" type="image/svg+xml" href="/file.svg" /> */}
      {/* <link rel="icon" type="image/svg+xml" href="/globe.svg" /> */}
      {/* <link rel="icon" type="image/svg+xml" href="/next.svg" /> */}
      {/* <link rel="icon" type="image/svg+xml" href="/vercel.svg" /> */}
      {/* <link rel="icon" type="image/svg+xml" href="/window.svg" /> */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var key = 'taskify-theme';
                var theme = localStorage.getItem(key);
                if (theme === 'dark' || (!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch {}
            })();
          `,
        }}
      />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Taskify" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="theme-color" content="#18192a" />
    </>
  )
}
