import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "docs/**",
      ".tmp/**",
      ".data/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // В App Router внутренние страницы в <Link> не ходим через <a> — правило для pages/.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
