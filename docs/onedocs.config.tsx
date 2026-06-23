import { defineConfig } from "onedocs/config";
import {
  Boxes,
  Braces,
  CheckCircle2,
  Globe,
  Layers,
  Package,
  Puzzle,
  Rocket,
  Search,
  Terminal,
  Wind,
  Zap,
} from "lucide-react";

const iconClass = "h-5 w-5 text-fd-primary";

export default defineConfig({
  title: "TailwindPHP",
  description:
    "A 1:1 port of TailwindCSS 4.x to PHP. Generate Tailwind utility CSS with pure PHP — no Node.js, no build step. Ships cn(), tailwind-merge, CVA, the typography and forms plugins, and a drop-in CLI.",
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
  },
  icon: { light: "/icon.png", dark: "/icon-dark.png" },
  nav: {
    github: "inline0/tailwindphp",
  },
  footer: {
    links: [{ label: "Inline0.com", href: "https://inline0.com" }],
  },
  homepage: {
    features: [
      {
        title: "Pure PHP",
        description:
          "No Node.js, no build step, no extensions beyond a standard PHP 8.2+ build. composer require and go.",
        icon: <Package className={iconClass} />,
      },
      {
        title: "TailwindCSS 4.x, 1:1",
        description:
          "A complete port of Tailwind v4.3 — the same utilities, variants, directives, and byte-for-byte CSS output.",
        icon: <Layers className={iconClass} />,
      },
      {
        title: "4,000+ tests",
        description:
          "Output is verified against TailwindCSS's own test suites, extracted from the TypeScript source and re-run on every push.",
        icon: <CheckCircle2 className={iconClass} />,
      },
      {
        title: "Every utility & variant",
        description:
          "All 364 utilities and every variant: hover, focus, responsive, dark mode, container queries, and arbitrary values.",
        icon: <Wind className={iconClass} />,
      },
      {
        title: "CSS directives",
        description:
          "@theme, @apply, @utility, @custom-variant, @layer, @plugin, and @source — all parsed and resolved natively.",
        icon: <Braces className={iconClass} />,
      },
      {
        title: "Runtime generation",
        description:
          "Generate utility CSS on the fly from HTML, database content, or template variables. No build step required.",
        icon: <Zap className={iconClass} />,
      },
      {
        title: "Batteries included",
        description:
          "cn(), merge(), and variants() — clsx, tailwind-merge, and CVA ported to PHP, with no extra packages.",
        icon: <Boxes className={iconClass} />,
      },
      {
        title: "Plugins",
        description:
          "@tailwindcss/typography and @tailwindcss/forms ported in full, plus a PHP plugin API for writing your own.",
        icon: <Puzzle className={iconClass} />,
      },
      {
        title: "Drop-in CLI",
        description:
          "bin/tailwindphp mirrors @tailwindcss/cli: -i, -o, --watch, --minify, --optimize, and @source scanning.",
        icon: <Terminal className={iconClass} />,
      },
      {
        title: "Inspect the theme",
        description:
          "Read raw and computed property values, colors, breakpoints, and spacing for any class straight from PHP.",
        icon: <Search className={iconClass} />,
      },
      {
        title: "Production-ready",
        description:
          "A built-in CSS minifier and a file cache with TTL keep repeated builds fast and output lean.",
        icon: <Rocket className={iconClass} />,
      },
      {
        title: "WordPress & PHP frameworks",
        description:
          "Ship Tailwind-powered themes and plugins with zero Node.js in the stack — just a Composer dependency.",
        icon: <Globe className={iconClass} />,
      },
    ],
  },
});
