const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        FileReader: 'readonly',
        Element: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        TransformStream: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        performance: 'readonly',
        matchMedia: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        self: 'readonly',
        crypto: 'readonly',
        MessageChannel: 'readonly',
        MessagePort: 'readonly',
        Worker: 'readonly',
        DOMException: 'readonly',
        queueMicrotask: 'readonly',
        setImmediate: 'readonly',
        reportError: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        Symbol: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Reflect: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        TypeError: 'readonly',
        SyntaxError: 'readonly',
        RangeError: 'readonly',
        ReferenceError: 'readonly',
        XMLHttpRequest: 'readonly',
        WebSocket: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
