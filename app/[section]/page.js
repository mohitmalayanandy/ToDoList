import { notFound } from "next/navigation";

const SECTIONS = [
  "inbox",
  "tomorrow",
  "overdue",
  "pinned",
  "completed",
  "archived",
  "all",
];

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export default async function SectionPage({ params }) {
  const { section } = await params;
  if (!SECTIONS.includes(section)) notFound();
  return null;
}
