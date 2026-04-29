export const metadata = { title: 'Sound Clash – Your Photo' };

const fontFaceCss = `
@font-face {
  font-family: 'FuturaRedBull';
  src: url('/fonts/FuturaforRedBull-CondBold.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
      </head>
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: "'FuturaRedBull', 'Arial Black', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
