import { redirect } from "next/navigation";

// Until the app shell exists (stage 2), the design system is the only page.
export default function Home() {
  redirect("/system");
}
