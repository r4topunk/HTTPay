import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = [
  '@cosmjs/amino',
  '@cosmjs/cosmwasm-stargate',
  '@cosmjs/proto-signing',
  '@cosmjs/stargate',
  '@cosmos-kit/react',
  '@tanstack/react-query',
  'react',
  'react/jsx-runtime',
  'zod'
];

export default [
  // Main entry point - ES Module build
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
        noEmitOnError: false,
      }),
    ],
  },
  // Main entry point - CommonJS build
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
        noEmitOnError: false,
      }),
    ],
  },
  // React entry point - ES Module build
  {
    input: 'react.ts',
    output: {
      file: 'dist/react.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
        noEmitOnError: false,
      }),
    ],
  },
  // React entry point - CommonJS build
  {
    input: 'react.ts',
    output: {
      file: 'dist/react.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
        noEmitOnError: false,
      }),
    ],
  },
  // Main entry point - Type definitions
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external,
    plugins: [dts()],
  },
  // React entry point - Type definitions
  {
    input: 'react.ts',
    output: {
      file: 'dist/react.d.ts',
      format: 'es',
    },
    external,
    plugins: [dts()],
  },
];
