import { createFileRoute } from "@tanstack/react-router";
import { ResourceList } from "@/components/Resource";
import { contatoFields } from "@/lib/schemas";

export const Route = createFileRoute("/_app/contatos/")({
  component: () => (
    <ResourceList table="contatos" basePath="/contatos"
      title="Relacionamento / Contatos" breadcrumb={["Início", "Contatos"]}
      fields={contatoFields}
      listColumns={[
        { key: "nome", label: "Nome" },
        { key: "tipo", label: "Tipo" },
        { key: "telefone", label: "Telefone" },
        { key: "email", label: "E-mail" },
        { key: "cidade", label: "Cidade" },
      ]}
    />
  ),
});
