"use client";

import { Input } from "@/components/ui/input";
import { JSONValue, Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";

import { LoadingIcon } from "@/components/icons";
import { cn, nanoid } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const [toolCall, setToolCall] = useState<string>();
  const chatRef = useRef(nanoid());

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      id: chatRef.current,
      maxSteps: 5,
      onToolCall({ toolCall }) {
        setToolCall(toolCall.toolName);
      },
      onError: (error) => {
        toast.error("You've been rate limited, please try again later!");
      },

      experimental_prepareRequestBody: ({ messages }) => ({
        messages: messages as unknown as JSONValue,
        chatId: chatRef.current,
      }),
    });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  const currentToolCall = useMemo(() => {
    const tools = messages?.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName;
    } else {
      return undefined;
    }
  }, [toolCall, messages]);

  const awaitingResponse = useMemo(() => {
    if (
      isLoading &&
      currentToolCall === undefined &&
      messages.slice(-1)[0].role === "user"
    ) {
      return true;
    } else {
      return false;
    }
  }, [isLoading, currentToolCall, messages]);



  const lastAssistantMessage: Message | undefined = messages
    .filter((m) => m.role !== "user")
    .slice(-1)[0];

  return (
    <div className="flex justify-center items-start sm:pt-16 min-h-screen w-full dark:bg-neutral-900 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-[500px]">

        <motion.div
          animate={{
            minHeight: isExpanded ? 200 : 0,
            padding: isExpanded ? 12 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.5,
          }}
          className={cn(
            "rounded-lg w-full flex flex-col",
            isExpanded
              ? "bg-neutral-200 dark:bg-neutral-800"
              : "bg-transparent",
          )}
        >
          <div className="flex flex-col w-full justify-between gap-2 flex-1">
            <motion.div
              transition={{
                type: "spring",
              }}
              className="min-h-fit flex flex-col gap-2 flex-1"
            >
              <AnimatePresence>
                {messages.slice(0, -1).map((message, index) => (
                  <div key={message.id} className={cn(
                    "px-2 min-h-12 flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}>
                    {message.role === "user" ? (
                      <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                        {message.content}
                      </div>
                    ) : (
                      <div className=" rounded-lg px-4 py-2 max-w-[80%]">
                        <AssistantMessage message={message} />
                      </div>
                    )}
                  </div>
                ))}
                {awaitingResponse || currentToolCall ? (
                  <div className="px-2 min-h-12 flex justify-start">
                    <div className="rounded-lg px-4 py-2">
                      <Loading tool={currentToolCall} />
                    </div>
                  </div>
                ) : lastAssistantMessage ? (
                  <div className="px-2 min-h-12 flex justify-start">
                    <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg px-4 py-2 max-w-[80%]">
                      <AssistantMessage message={lastAssistantMessage} />
                    </div>
                  </div>
                ) : null}
              </AnimatePresence>
            </motion.div>
            <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
              <Input
                className={`bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300`}
                minLength={3}
                required
                value={input}
                placeholder={"Ask me anything..."}
                onChange={handleInputChange}
              />
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const AssistantMessage = ({ message }: { message: Message | undefined }) => {
  if (message === undefined) return "HELLO";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="whitespace-pre-wrap font-mono anti text-sm text-neutral-800 dark:text-neutral-200 overflow-hidden"
        id="markdown"
      >
        <MemoizedReactMarkdown
          className={"max-h-72 overflow-y-scroll no-scrollbar-gutter"}
        >
          {message.content}
        </MemoizedReactMarkdown>
      </motion.div>
    </AnimatePresence>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const toolName =
    tool === "getInformation"
      ? "Getting information"
      : tool === "findTimeslots"
        ? "Finding timeslots"
        : "Thinking";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring" }}
        className="overflow-hidden flex justify-start items-center"
      >
        <div className="flex flex-row gap-2 items-center">
          <div className="animate-spin dark:text-neutral-400 text-neutral-500">
            <LoadingIcon />
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            {toolName}...
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);
