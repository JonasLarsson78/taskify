export default function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* Prevent theme flash: set data-theme on html before hydration */}
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
      <link rel="manifest" href="/manifest.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Taskify" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <meta name="theme-color" content="#18192a" />
    </>
  )
}
