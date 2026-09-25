import type { MDXComponents } from "mdx/types";

// Project write-ups render inside the man page's DESCRIPTION block; styling lives in globals.css (.man-body).
// ## in MDX sits inside the DESCRIPTION section (an h2), so it renders one level down.
const components: MDXComponents = {
  h2: (props) => <h3 {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
