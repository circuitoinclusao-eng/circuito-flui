import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { editalFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/editais/")({
  component: () => (
    <ResourceList
      table="editais" basePath="/editais"
      title="Editais" breadcrumb={["Início", "Editais"]}
      fields={editalFields}
      listColumns={[
        { key: "titulo", label: "Edital" },
        { key: "organizacao", label: "Organização" },
        { key: "data_fim", label: "Encerra em", render: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "—" },
        { key: "valor", label: "Valor (R$)", render: (v) => v ? Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—" },
        { key: "status", label: "Status" },
      ]}
    />
  ),
});
