import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema/chat";
import { desc } from "drizzle-orm";
import { Intervene } from "./components/intervene";

export default async function AdminPage() {
  const chatList = await db.select().from(chats).orderBy(desc(chats.createdAt));

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Chat Admin Dashboard</h1>

      <div className="space-y-6">
        {chatList.map((chat) => (
          <div
            key={chat.id}
            className="  rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Chat ID: {chat.chatId}</h2>
                <p className="text-gray-600  mb-2">
                  Created: {new Date(chat.createdAt).toLocaleString()}
                </p>
                <p className="text-gray-600 ">
                  Last Updated: {new Date(chat.updatedAt).toLocaleString()}
                </p>
              </div>
              <Intervene chatId={chat.chatId} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-gray-700 ">{chat.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
