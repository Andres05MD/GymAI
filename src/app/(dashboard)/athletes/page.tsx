import { getAllAthletes } from "@/actions/coach-actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronRight, Search, Users } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function AthletesPage() {
    const { athletes } = await getAllAthletes();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Directorio de Atletas</h1>
                <p className="text-muted-foreground">Gestiona y supervisa a todos los miembros del gimnasio.</p>
            </div>

            <Card className="glass-card border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-bold text-white">Lista de Atletas</CardTitle>
                        </div>
                        {/* Buscador simple (visual por ahora) */}
                        <div className="w-64 relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input placeholder="Buscar atleta..." className="pl-9 h-9 bg-zinc-900/50 border-white/10 text-sm" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[60px]"></TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Nombre</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider hidden md:table-cell">Objetivo</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider hidden md:table-cell">Miembro Desde</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-xs tracking-wider text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!athletes || athletes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                        No se encontraron atletas registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                athletes.map((athlete: any) => (
                                    <TableRow key={athlete.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell>
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={athlete.image} />
                                                <AvatarFallback className="bg-zinc-800 font-bold text-zinc-400">
                                                    {athlete.name?.[0]?.toUpperCase() || "A"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{athlete.name}</span>
                                                <span className="text-xs text-zinc-500">{athlete.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {athlete.goal ? (
                                                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                                    {athlete.goal}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-zinc-600">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-zinc-400 text-sm">
                                            {athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/athletes/${athlete.id}`}>
                                                <Button size="sm" variant="ghost" className="hover:bg-primary hover:text-black">
                                                    Ver Perfil <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
