'use server';
import { redis } from '../redis';

export const setChatToHuman = async (chatId: string) => {
  await redis.set(`chat:${chatId}`, 'human');

  return { success: true };
};
