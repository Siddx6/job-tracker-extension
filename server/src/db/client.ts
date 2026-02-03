import { PrismaClient } from '@prisma/client';

// We use 'any' for process temporarily if the @types/node isn't picking up
// though the better fix is the tsconfig/package.json update we did.
const prisma = new PrismaClient({
  log: (process.env.NODE_ENV === 'development') 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

export default prisma;