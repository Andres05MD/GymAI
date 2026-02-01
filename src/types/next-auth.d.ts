import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "athlete" | "coach" | "admin";
            onboardingCompleted: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        role: "athlete" | "coach" | "admin";
        onboardingCompleted: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "athlete" | "coach" | "admin";
        onboardingCompleted: boolean;
    }
}
