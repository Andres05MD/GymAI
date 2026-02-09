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
        { role: "assistant", content: "¡Hola! Soy Vivi. ¿En qué puedo ayudarte con tu entrenamiento hoy?" }
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
        <div className="fixed bottom-28 md:bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
            {isOpen ? (
                <div className="w-[calc(100vw-2rem)] md:w-[380px] h-[550px] md:h-[600px] flex flex-col bg-neutral-950 border border-neutral-800 rounded-3xl shadow-[0_0_50px_-10px_rgba(220,38,38,0.2)] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-red-900/50 to-neutral-900 border-b border-neutral-800 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500 rounded-full blur-[8px] opacity-50"></div>
                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 border border-red-500/30 relative z-10 shadow-lg">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-neutral-900 rounded-full z-20"></div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-base font-black text-white leading-none tracking-tight">Vivi</h3>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">AI Coach Expert</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Minimize2 className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-hidden relative bg-neutral-950/50">
                        {/* Chat Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)' }}></div>

                        <div className="h-full overflow-y-auto p-5 space-y-6 relative z-10 custom-scrollbar" ref={scrollRef}>
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 opacity-50">
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Hoy {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            {messages.map((m, idx) => (
                                <div key={idx} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                    {m.role !== "user" && (
                                        <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 mt-1 self-start">
                                            <Bot className="h-4 w-4 text-red-500" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "rounded-2xl px-5 py-3 text-sm font-medium shadow-sm max-w-[85%] leading-relaxed",
                                        m.role === "user"
                                            ? "bg-white text-black rounded-tr-sm"
                                            : "bg-neutral-800/80 text-neutral-100 border border-neutral-700/50 rounded-tl-sm backdrop-blur-sm"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 mt-1">
                                        <Bot className="h-4 w-4 text-red-400 animate-pulse" />
                                    </div>
                                    <div className="bg-neutral-800/50 border border-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                        <div className="flex gap-3 relative">
                            <Input
                                placeholder="Escribe tu consulta..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isLoading}
                                className="flex-1 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-red-500/50 h-12 rounded-xl pl-4 pr-12 shadow-inner"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1.5 top-1.5 h-9 w-9 bg-red-600hover:bg-red-500 text-white rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-center text-neutral-600 mt-3 font-medium">
                            Vivi puede cometer errores. Verifica la info importante.
                        </p>
                    </div>
                </div>
            ) : (
                <Button
                    size="lg"
                    className="h-16 w-16 rounded-full shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)] p-0 bg-linear-to-br from-red-600 to-red-800 hover:scale-110 transition-all duration-300 border-2 border-white/10 group"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 duration-1000"></div>
                    <Bot className="h-8 w-8 text-white relative z-10" />
                    {/* Notification Badge if needed */}
                    <span className="absolute top-0 right-0 h-4 w-4 bg-green-500 border-2 border-neutral-900 rounded-full z-20"></span>
                </Button>
            )}
        </div>
    );
}
