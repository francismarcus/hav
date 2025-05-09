

import { createClient } from 'redis';

export const redis = await createClient({
  url: process.env.REDIS_URL,
}).connect();



export const chatIsHuman = async (chatId: string) => {
  const status = await redis.get(`chat:${chatId}`);
  return status === 'human';
};
