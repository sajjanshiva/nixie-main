import InvoiceView from "@/components/admin/invoices/InvoiceView";

export const metadata = { title: "Invoice" };

export default async function Page({ params }) {
  const { id } = await params;
  return <InvoiceView id={id} />;
}
