import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";

export default function Root() {
  const role = getSessionRole();
  if (role === "parent") redirect("/parent");
  if (role === "student") redirect("/today");
  redirect("/login");
}
