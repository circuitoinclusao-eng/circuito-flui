import { createFileRoute } from "@tanstack/react-router";
import { ResourceForm } from "@/components/Resource";
import { contatoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/contatos/novo")({
  component: () => (
    <ResourceForm table="contatos" basePath="/contatos"
      title="Novo contato" breadcrumb={["Início", "Contatos", "Novo"]} fields={contatoFields} />
  ),
});
