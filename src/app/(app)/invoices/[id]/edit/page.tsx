import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function EditInvoicePage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
