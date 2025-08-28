"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * ThemeProvider
 * Wraps the app to enable class-based dark mode via next-themes.
 * Defaults:
 * - attribute="class" (adds "class" to html root)
 * - defaultTheme="dark" (web3 aesthetic)
 * - enableSystem={false} (stick to explicit light/dark)
 */
export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
  enableSystem = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}