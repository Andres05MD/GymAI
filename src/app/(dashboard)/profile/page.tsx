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
    const userData = { id: userDoc.id, ...userDoc.data() } as any;

    // Fetch measurement history
    const historyResult = await getBodyMeasurementsHistory(session.user.id);
    const historyData = (historyResult.success ? historyResult.data : []) as any[];

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
                    <p className="text-neutral-400 text-sm">Gestiona tus datos y monitoriza tu progreso.</p>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-900 mb-8">
                    <TabsTrigger value="details" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <User className="w-4 h-4 mr-2" /> Datos Personales
                    </TabsTrigger>
                    <TabsTrigger value="measurements" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <Ruler className="w-4 h-4 mr-2" /> Progreso Corporal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
                        <ProfileForm user={userData} />
                    </div>
                </TabsContent>

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
                                { key: "waist", label: "Cintura", color: "#10b981" },
                                { key: "hips", label: "Cadera", color: "#f59e0b" }
                            ]}
                        />
                        <MeasurementChart
                            title="Brazos (cm)"
                            data={historyData}
                            metrics={[
                                { key: "biceps", label: "Bíceps", color: "#8b5cf6" },
                                { key: "triceps", label: "Tríceps", color: "#ec4899" },
                                { key: "forearms", label: "Antebrazo", color: "#6366f1" }
                            ]}
                        />
                        <MeasurementChart
                            title="Piernas (cm)"
                            data={historyData}
                            metrics={[
                                { key: "quads", label: "Cuádriceps", color: "#14b8a6" },
                                { key: "calves", label: "Pantorilla", color: "#f97316" }
                            ]}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
