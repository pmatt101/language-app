import "./globals.css";

export const metadata = {
  title: "Listening & Repeat",
  description: "Listening practice app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
