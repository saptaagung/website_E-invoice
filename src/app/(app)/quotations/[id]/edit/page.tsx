import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function EditQuotationPage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
