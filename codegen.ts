import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: 'src/graphql/schema/**/*.graphql',
  generates: {
    'generated/graphql/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '../../src/graphql/context#GraphQLContext',
        mappers: {
          User: '@prisma/index#User',
          LeaveRequest: '@prisma/index#LeaveRequest',
          LeaveType: '@prisma/index#LeaveType',
        },
      },
    },
  },
}

export default config
