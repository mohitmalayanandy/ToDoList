import "./globals.css";
import Daybook from "../components/daybook";
export const metadata = {
  title: "Daybook — A little space for what matters",
  description:
    "Your personal productivity workspace. Tasks, projects, focus, and a little more clarity.",
};
export const viewport = { themeColor: "#f7f8fa" };
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Daybook>{children}</Daybook>
      </body>
    </html>
  );
}
