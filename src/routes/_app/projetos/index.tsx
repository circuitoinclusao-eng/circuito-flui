import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { projetoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/projetos/")({
  component: () => (
    <ResourceList
      table="projetos" basePath="/projetos"
      title="Projetos" breadcrumb={["Início", "Projetos"]}
      fields={projetoFields}
      listColumns={[
        { key: "titulo", label: "Projeto" },
        { key: "numero_projeto", label: "Nº" },
        { key: "cidade", label: "Cidade" },
        { key: "data_inicio", label: "Início", render: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "—" },
        { key: "status", label: "Status" },
      ]}
    />
  ),
});
