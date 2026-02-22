import { getAllUsers } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Shield, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserRoleSelect } from "@/components/users/user-role-select";

export default async function UsersManagementPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        redirect("/dashboard");
    }

    const { users, error } = await getAllUsers();

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl">
                <p className="text-red-500 font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                        Gestión de Usuarios
                    </h1>
                    <p className="text-neutral-400">
                        Administra los roles y permisos de los miembros de la plataforma.
                    </p>
                </div>

                <div className="w-full md:w-80 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        className="pl-11 h-12 bg-neutral-900 border-neutral-800 text-white rounded-full focus-visible:ring-red-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-neutral-900/80">
                        <TableRow className="border-neutral-800 hover:bg-transparent">
                            <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-xs py-5 pl-8">Usuario</TableHead>
                            <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-xs py-5">Email</TableHead>
                            <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-xs py-5">Rol Actual</TableHead>
                            <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-xs py-5 pr-8">Cambiar Rol</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!users || users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-neutral-500">
                                        <Users className="w-10 h-10 mb-2 opacity-20" />
                                        <p>No se encontraron usuarios</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-neutral-800 hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-4 pl-8">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-neutral-800 transition-transform group-hover:scale-105">
                                                <AvatarImage src={user.image || user.photoUrl} />
                                                <AvatarFallback className="bg-neutral-800 text-white font-bold">
                                                    {user.name?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-white tracking-tight">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2 text-neutral-400">
                                            <Mail className="w-3 h-3" />
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge
                                            className={
                                                user.role === "coach"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                    : user.role === "advanced_athlete"
                                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                            }
                                        >
                                            {user.role === "coach" ? "Coach" : user.role === "advanced_athlete" ? "Atleta Avanzado" : "Atleta"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 pr-8">
                                        {/* Don't allow changing your own role or other coaches if needed, 
                                            but requirements say coach manages users. 
                                            Let's implement the select for all for now. */}
                                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
