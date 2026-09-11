import { initialProjects } from "../../../lib/workspace";

// Project ids are generated in the browser, so only the seeded projects can be
// prerendered. Any other slug falls through to 404.html, which GitHub Pages
// serves for unknown paths — the layout still reads the slug off the URL and
// renders the right project.
export function generateStaticParams() {
  return initialProjects.map((project) => ({ slug: project.id }));
}

export default function ProjectPage() {
  return null;
}
