import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROLES = ["administrador", "coordenador", "professor", "colaborador", "consulta"] as const;
const STATUSES = ["aprovado", "pendente", "bloqueado"] as const;

async function ensureAdmin(supabase: any, userId: string) {
  const { data: roles, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Response(error.message, { status: 500 });
  const ok = (roles ?? []).some((r: any) => r.role === "administrador");
  if (!ok) throw new Response("Apenas administradores podem executar esta ação.", { status: 403 });
}

async function countActiveAdmins(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("count_active_admins");
  if (error) return 0;
  return (data as number) ?? 0;
}

// ---------------- Create ----------------
const CreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().max(40).optional().or(z.literal("")),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72),
  role: z.enum(ROLES),
  status: z.enum(["aprovado", "bloqueado"]).default("aprovado"),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);

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
    await supabaseAdmin.from("profiles").upsert({
      id: newId,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || null,
      status: data.status,
      ativo: data.status === "aprovado",
    }, { onConflict: "id" });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: newId, role: data.role });
    if (roleErr) throw new Response(roleErr.message, { status: 500 });

    return { id: newId };
  });

// ---------------- Update ----------------
const UpdateSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(ROLES),
  status: z.enum(STATUSES),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);

    // Prevent removing last active admin
    const { data: currentRoles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", data.id);
    const wasAdmin = (currentRoles ?? []).some((r: any) => r.role === "administrador");
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles").select("status").eq("id", data.id).single();

    const willStopBeingActiveAdmin =
      wasAdmin && (data.role !== "administrador" || data.status !== "aprovado");

    if (willStopBeingActiveAdmin) {
      const total = await countActiveAdmins();
      if (total <= 1 && (currentProfile?.status === "aprovado")) {
        throw new Response("Não é possível remover o último administrador ativo do sistema.", { status: 400 });
      }
    }

    const { error: pErr } = await supabaseAdmin.from("profiles").update({
      nome: data.nome,
      telefone: data.telefone || null,
      status: data.status,
      ativo: data.status === "aprovado",
    }).eq("id", data.id);
    if (pErr) throw new Response(pErr.message, { status: 500 });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: data.id, role: data.role });
    if (rErr) throw new Response(rErr.message, { status: 500 });

    return { ok: true };
  });

// ---------------- Set status (aprovar / inativar / reativar) ----------------
const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
});

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => StatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);

    if (data.status !== "aprovado") {
      const { data: roles } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", data.id);
      const isAdminTarget = (roles ?? []).some((r: any) => r.role === "administrador");
      if (isAdminTarget) {
        const total = await countActiveAdmins();
        if (total <= 1) {
          throw new Response("Não é possível inativar o último administrador ativo do sistema.", { status: 400 });
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status, ativo: data.status === "aprovado" })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

// ---------------- Delete ----------------
const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DeleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);

    if (data.id === context.userId) {
      throw new Response("Você não pode excluir a própria conta.", { status: 400 });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", data.id);
    const isAdminTarget = (roles ?? []).some((r: any) => r.role === "administrador");
    if (isAdminTarget) {
      const total = await countActiveAdmins();
      if (total <= 1) {
        throw new Response("Não é possível excluir o último administrador do sistema.", { status: 400 });
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Response(error.message, { status: 500 });
    // profiles + user_roles têm cascade via FK ao auth.users; caso não tenham, limpamos manualmente:
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    return { ok: true };
  });
