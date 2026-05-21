import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.CODEGEN_SCHEMA ?? 'http://localhost:8086/graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/lib/gql/**'],
  ignoreNoDocuments: true,
  generates: {
    'src/lib/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: { Date: 'string', JSON: 'unknown' },
      },
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
    },
  },
};

export default config;
