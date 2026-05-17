import { Suspense, type ReactNode } from "react";
import PageLoader from "@/components/PageLoader";

export default function WithSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
