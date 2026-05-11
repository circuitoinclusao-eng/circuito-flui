import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { editalFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/editais/novo")({
  component: () => (
    <ResourceForm table="editais" basePath="/editais"
      title="Novo edital" breadcrumb={["Início", "Editais", "Novo"]}
      fields={editalFields}
    />
  ),
});
