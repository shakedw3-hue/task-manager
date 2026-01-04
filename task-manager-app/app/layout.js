import './globals.css'

export const metadata = {
  title: 'מנהל משימות',
  description: 'אפליקציה לניהול משימות יומיות, שבועיות וחודשיות',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
