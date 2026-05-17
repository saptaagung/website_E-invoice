import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function NewQuotationPage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
