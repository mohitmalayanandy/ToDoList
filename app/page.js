// The root layout renders the whole workspace and derives the active section
// from the pathname, defaulting "/" to Today. A server redirect can't survive a
// static export on GitHub Pages, so "/" renders Today in place instead.
export default function Home() {
  return null;
}
