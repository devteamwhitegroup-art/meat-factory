import { cacheExchange, fetchExchange, type Exchange } from '@urql/core';

export const exchanges: Exchange[] = [cacheExchange, fetchExchange];
