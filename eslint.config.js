export default [
  {
    files: ["**/*.js"],

    ignores: [
      "node_modules/**",
      "public/**"
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly"
      }
    },

    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn"
    }
  }
];