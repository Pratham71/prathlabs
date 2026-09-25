import type { MDXComponents } from "mdx/types";

// Project write-ups render inside the man page's DESCRIPTION block; styling lives in globals.css (.man-body).
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
