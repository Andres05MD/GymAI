import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { ProfileForm } from "@/components/profile/profile-form";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ruler, User, Activity, Pencil, Flame, HeartPulse } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeasurementChart } from "@/components/profile/measurement-chart";
import { LogMeasurementDialog } from "@/components/profile/log-measurement-dialog";
import { getBodyMeasurementsHistory } from "@/actions/measurement-actions";
import { EditHealthDialog } from "@/components/dashboard/edit-health-dialog";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Fetch fresh user data
    const userDoc = await adminDb.collection("users").doc(session.user.id).get();
    const rawData = userDoc.data() || {};

    const userData = {
        id: userDoc.id,
        name: rawData.name,
        email: rawData.email,
        image: rawData.image,
        phone: rawData.phone,
        height: rawData.height,
        weight: rawData.weight,
        role: rawData.role,
        onboardingCompleted: rawData.onboardingCompleted,
        injuries: rawData.injuries,
        medicalConditions: rawData.medicalConditions,
        // Explicitly converting dates if needed, though ProfileForm currently doesn't use them directly
        emailVerified: rawData.emailVerified?.toDate?.()?.toISOString() || null,
    };

    // Fetch measurement history if athlete
    let historyData: any[] = [];
    const isCoach = session.user.role === "coach";

    if (!isCoach) {
        const historyResult = await getBodyMeasurementsHistory(session.user.id);
        historyData = (historyResult.success ? historyResult.data : []) as any[];
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase">Mi Perfil</h1>
                    <p className="text-neutral-400 text-sm">{isCoach ? 'Gestiona tu cuenta profesional.' : 'Gestiona tus datos y monitoriza tu progreso.'}</p>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className={`grid w-full bg-neutral-900/50 backdrop-blur-md border border-white/5 mb-8 rounded-full p-1 h-12 ${isCoach ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    <TabsTrigger value="details" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-neutral-400 font-bold">
                        <User className="w-4 h-4 mr-2" /> Datos Personales
                    </TabsTrigger>
                    {!isCoach && (
                        <>
                            <TabsTrigger value="measurements" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-neutral-400 font-bold">
                                <Ruler className="w-4 h-4 mr-2" /> Progreso Corporal
                            </TabsTrigger>
                            <TabsTrigger value="health" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all text-neutral-400 font-bold">
                                <HeartPulse className="w-4 h-4 mr-2" /> Salud
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="details">
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 shadow-xl shadow-black/20">
                        <ProfileForm user={userData} />
                    </div>
                </TabsContent>

                {!isCoach && (
                    <TabsContent value="measurements" className="space-y-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 shadow-xl shadow-black/20 gap-4">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Historial de Medidas</h2>
                                <p className="text-neutral-400 text-sm">Registro de tu evolución corporal en el tiempo.</p>
                            </div>
                            <div className="w-full md:w-auto">
                                <LogMeasurementDialog />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MeasurementChart
                                title="Peso Corporal (kg)"
                                data={historyData}
                                metrics={[{ key: "weight", label: "Peso", color: "#ef4444" }]}
                            />
                            <MeasurementChart
                                title="Torso (cm)"
                                data={historyData}
                                metrics={[
                                    { key: "chest", label: "Pecho", color: "#3b82f6" },
                                    { key: "shoulders", label: "Hombros", color: "#8b5cf6" },
                                    { key: "waist", label: "Cintura", color: "#10b981" },
                                    { key: "hips", label: "Cadera", color: "#f59e0b" },
                                    { key: "glutes", label: "Glúteos", color: "#ec4899" }
                                ]}
                            />
                            <MeasurementChart
                                title="Brazos (cm)"
                                data={historyData}
                                metrics={[
                                    { key: "bicepsLeft", label: "Bíceps (I)", color: "#06b6d4" },
                                    { key: "bicepsRight", label: "Bíceps (D)", color: "#0ea5e9" },
                                    { key: "forearmsLeft", label: "Antebrazo (I)", color: "#6366f1" },
                                    { key: "forearmsRight", label: "Antebrazo (D)", color: "#8b5cf6" }
                                ]}
                            />
                            <MeasurementChart
                                title="Piernas (cm)"
                                data={historyData}
                                metrics={[
                                    { key: "quadsLeft", label: "Cuádriceps (I)", color: "#14b8a6" },
                                    { key: "quadsRight", label: "Cuádriceps (D)", color: "#059669" },
                                    { key: "calvesLeft", label: "Pantorilla (I)", color: "#f97316" },
                                    { key: "calvesRight", label: "Pantorilla (D)", color: "#ea580c" }
                                ]}
                            />
                        </div>
                    </TabsContent>
                )}

                {!isCoach && (
                    <TabsContent value="health" className="space-y-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-6 md:p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-6 h-6 text-red-500" />
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Salud y Lesiones</h2>
                                </div>
                                <EditHealthDialog
                                    athlete={{
                                        id: userData.id,
                                        name: userData.name || "Mi Perfil",
                                        injuries: userData.injuries,
                                        medicalConditions: userData.medicalConditions
                                    }}
                                    trigger={
                                        <Button className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold">
                                            <Pencil className="w-4 h-4 mr-2" /> Editar
                                        </Button>
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                                        <Flame className="w-3 h-3" /> Lesiones / Molestias
                                    </h4>
                                    {userData.injuries && userData.injuries.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {userData.injuries.map((injury: string, i: number) => (
                                                <span key={i} className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-sm font-bold border border-red-500/20">
                                                    {injury}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 text-sm italic">Sin datos registrados</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                                        <HeartPulse className="w-3 h-3" /> Condiciones Médicas
                                    </h4>
                                    {userData.medicalConditions && userData.medicalConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {userData.medicalConditions.map((condition: string, i: number) => (
                                                <span key={i} className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/20">
                                                    {condition}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 text-sm italic">Sin datos registrados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
