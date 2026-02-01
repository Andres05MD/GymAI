"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Send, Bot, User, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI } from "@/actions/chat-actions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area"; // Si tenemos, sino div css overflow

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "¡Hola! Soy GymIA. ¿En qué puedo ayudarte con tu entrenamiento hoy?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll al final
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Preparamos historial para enviar (limitado a últimos 10 para contexto sin gastar tokens infinitos)
            const historyToSend = [...messages, userMsg].slice(-10);

            const result = await chatWithAI(historyToSend);

            if (result.success && result.message) {
                setMessages(prev => [...prev, { role: "assistant", content: result.message }]);
            } else {
                toast.error("Error al conectar con el asistente");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-5">
                    <CardHeader className="flex flex-row items-center justify-between py-3 bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <CardTitle className="text-sm font-medium">Asistente GymIA</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((m, idx) => (
                                <div key={idx} className={cn("flex gap-2", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        m.role === "user" ? "bg-muted" : "bg-primary/20"
                                    )}>
                                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                                    </div>
                                    <div className={cn(
                                        "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                                        m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted rounded-tl-none"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm">
                                        Escribiendo...
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-background border-t">
                        <div className="flex w-full gap-2">
                            <Input
                                placeholder="Pregunta sobre tu entrenamiento..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {!isOpen && (
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg p-0 bg-primary hover:scale-105 transition-transform"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageSquare className="h-7 w-7" />
                </Button>
            )}
        </div>
    );
}
