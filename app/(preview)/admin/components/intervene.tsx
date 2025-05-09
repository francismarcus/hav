'use client';

import { Button } from "@/components/ui/button";
import { setChatToHuman } from "@/lib/actions/redis";
import { useState } from "react";
import { LoadingIcon } from "@/components/icons";

interface InterveneProps {
    chatId: string;
}

export function Intervene({ chatId }: InterveneProps) {

    const [isLoading, setIsLoading] = useState(false);
    const [isHuman, setIsHuman] = useState(false);

    const handleClick = async () => {
        try {
            setIsLoading(true);
            await setChatToHuman(chatId);
            setIsHuman(true);
        } catch (error) {
            console.error('Failed to set chat to human', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading} >
            {isLoading ? <LoadingIcon /> : isHuman ? 'Has intervened' : 'Set to Human'}
        </Button>
    );
} 
