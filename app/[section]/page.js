import { notFound } from "next/navigation";
export default async function SectionPage({ params }) {
  const { section } = await params;
  if (
    ![
      "inbox",
      "tomorrow",
      "overdue",
      "pinned",
      "completed",
      "archived",
      "all",
    ].includes(section)
  )
    notFound();
  return null;
}
