import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function ViewQuotationPage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
