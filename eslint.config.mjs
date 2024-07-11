import globals from "globals"
import pluginJs from "@eslint/js"

export default [{
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      'semi': ['error', 'never'],
      'indent': ['error', 2],
    }
  },
  pluginJs.configs.recommended,
]
