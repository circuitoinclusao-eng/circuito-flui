import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROLES = ["administrador", "coordenador", "professor", "colaborador", "consulta"] as const;

const CreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  role: z.enum(ROLES),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesErr) throw new Response(rolesErr.message, { status: 500 });
    const isAdmin = (roles ?? []).some((r: any) => r.role === "administrador");
    if (!isAdmin) throw new Response("Apenas administradores podem criar usuários.", { status: 403 });

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (createErr || !created.user) {
      throw new Response(createErr?.message ?? "Falha ao criar usuário.", { status: 400 });
    }

    const newId = created.user.id;

    // Garante perfil + status aprovado (criação por admin é confiança direta)
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: newId, nome: data.nome, email: data.email, status: "aprovado" }, { onConflict: "id" });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (roleErr) throw new Response(roleErr.message, { status: 500 });

    await supabaseAdmin.from("audit_log").insert({
      actor_id: userId,
      acao: "criar_usuario",
      entidade: "user",
      entidade_id: newId,
      detalhes: { role: data.role, email: data.email },
    });

    return { id: newId };
  });
