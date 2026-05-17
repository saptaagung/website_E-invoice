import WithSuspense from "@/components/WithSuspense";
import InvoiceForm from "@/views/InvoiceForm";

export default function ViewInvoicePage() {
  return (
    <WithSuspense>
      <InvoiceForm />
    </WithSuspense>
  );
}
