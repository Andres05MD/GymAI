import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { ProfileForm } from "@/components/profile/profile-form";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ruler, User } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeasurementChart } from "@/components/profile/measurement-chart";
import { LogMeasurementDialog } from "@/components/profile/log-measurement-dialog";
import { getBodyMeasurementsHistory } from "@/actions/measurement-actions";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Fetch fresh user data
    const userDoc = await adminDb.collection("users").doc(session.user.id).get();
    const rawData = userDoc.data() || {};

    const userData = {
        id: userDoc.id,
        ...rawData,
        createdAt: rawData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || null,
        measurements: rawData.measurements ? {
            ...rawData.measurements,
            updatedAt: rawData.measurements.updatedAt?.toDate?.()?.toISOString() || null
        } : undefined
    } as any;

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
                <TabsList className={`grid w-full bg-neutral-900 mb-8 ${isCoach ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <TabsTrigger value="details" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <User className="w-4 h-4 mr-2" /> Datos Personales
                    </TabsTrigger>
                    {!isCoach && (
                        <TabsTrigger value="measurements" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                            <Ruler className="w-4 h-4 mr-2" /> Progreso Corporal
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="details">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
                        <ProfileForm user={userData} />
                    </div>
                </TabsContent>

                {!isCoach && (
                    <TabsContent value="measurements" className="space-y-6">
                        <div className="flex justify-between items-center bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Historial de Medidas</h2>
                                <p className="text-neutral-400 text-sm">Registro de tu evolución corporal en el tiempo.</p>
                            </div>
                            <LogMeasurementDialog />
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
            </Tabs>
        </div>
    );
}
