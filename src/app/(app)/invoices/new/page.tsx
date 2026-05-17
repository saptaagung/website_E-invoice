import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
