"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, X, Send, User, ChevronDown } from "lucide-react";
import { chatWithCoachAI } from "@/actions/ai-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface AICoachChatProps {
    context?: string; // Nombre del ejercicio actual o contexto
}

export function AICoachChat({ context }: AICoachChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hola, soy tu Coach IA. ¿Tienes alguna duda técnica sobre el entrenamiento?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            const result = await chatWithCoachAI(userMsg, context);
            if (result.success && result.response) {
                setMessages(prev => [...prev, { role: "ai", content: result.response! }]);
            } else {
                setMessages(prev => [...prev, { role: "ai", content: "Lo siento, tuve un problema conectando con el servidor." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "ai", content: "Error de red." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Ventana de Chat */}
            <div className={cn(
                "bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-[350px] overflow-hidden transition-all duration-300 origin-bottom-right pointer-events-auto",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 h-0 pointer-events-none"
            )}>
                <div className="bg-primary/10 p-4 border-b border-primary/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center border border-primary/30">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Coach IA</h3>
                            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">
                                {context ? `Contexto: ${context}` : "En línea"}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea className="h-[350px] px-4 py-4 bg-zinc-900/50">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                    msg.role === "user" ? "bg-zinc-800 border-zinc-700" : "bg-primary text-black border-primary"
                                )}>
                                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "rounded-2xl px-4 py-2 max-w-[80%] shadow-sm",
                                    msg.role === "user"
                                        ? "bg-zinc-800 text-white rounded-tr-none"
                                        : "bg-white text-black rounded-tl-none font-medium"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary text-black flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-white/10 rounded-2xl px-4 py-3 flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-3 bg-zinc-950 border-t border-white/5 flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Pregunta sobre técnica..."
                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary h-10"
                    />
                    <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="h-10 w-10 shrink-0 bg-primary text-black hover:bg-primary/90">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Botón Flotante (Trigger) */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-110 transition-all duration-300 border-2 border-primary pointer-events-auto",
                    isOpen ? "bg-zinc-900 text-white rotate-90" : "bg-black text-primary animate-bounce-subtle"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
            </Button>
        </div>
    );
}
