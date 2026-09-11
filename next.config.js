/** @type {import('next').NextConfig} */

// GitHub Pages serves this repo from https://<user>.github.io/ToDoList, so the
// build needs a basePath. Local `next dev`/`next build` stay at the root.
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repo = "ToDoList";

export default {
  output: "export",
  // Emits `<route>/index.html`, which Pages resolves without extension guessing.
  trailingSlash: true,
  basePath: isGitHubPages ? `/${repo}` : "",
  images: { unoptimized: true },
};
