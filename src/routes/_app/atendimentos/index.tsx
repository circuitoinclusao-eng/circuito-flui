import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { atendimentoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/atendimentos/")({
  component: () => (
    <ResourceList table="atendimentos" basePath="/atendimentos"
      title="Atendimentos" breadcrumb={["Início", "Atendimentos"]}
      fields={atendimentoFields}
      defaultOrder={{ col: "data", ascending: false }}
      listColumns={[
        { key: "nome_atendido", label: "Atendido" },
        { key: "tipo", label: "Tipo" },
        { key: "data", label: "Data", render: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "—" },
        { key: "status", label: "Status" },
      ]}
    />
  ),
});
