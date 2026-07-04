import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/decisions");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-brand-600">Decision Journal</h1>
      <p className="text-gray-600">Sign in to log and revisit your decisions.</p>
      <SignInButtons />
    </main>
  );
}
