import { Suspense } from "react";
import Documents from "@/views/Documents";
import PageLoader from "@/components/PageLoader";

export default function DocumentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Documents />
    </Suspense>
  );
}
