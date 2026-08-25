import { createHash, randomUUID } from "crypto";
import { parse as parseCookie } from "cookie";
import type { Request, Response } from "express";

const SESSION_COOKIE = "ff_supabase_session";
const JSON_HEADERS = { "Content-Type": "application/json" };

type RemoteProfile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

export type RemoteUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "gestora" | "revendedora";
  password: string;
  active: boolean;
  commissionRate: number;
  city?: string;
  inviteStatus?: "not_invited" | "pending" | "accepted" | "expired";
  inviteLink?: string;
  createdAt: string;
};

export type RemoteStore = {
  users: RemoteUser[];
  customers: Array<{ id: string; name: string; phone: string; email?: string; createdAt: string; updatedAt: string }>;
  products: Array<{
    id: string; name: string; category: string; price: number; stock: number; status: "available" | "unavailable";
    accent: string; imageUrl?: string; description?: string; variations?: Array<{ name: string; options: string[] }>;
    showInStore?: boolean; tags?: string[]; collection?: string; createdAt?: string; updatedAt?: string;
  }>;
  orders: Array<{
    id: string; origin: "direct" | "reseller"; entryType: "detailed" | "general"; resellerId?: string;
    customerId?: string; customerName?: string; customerContact?: string;
    items: Array<{ productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }>;
    total: number; commission: number; commissionRate: number;
    status: "draft" | "pending" | "approved" | "paid" | "separating" | "shipped" | "delivered" | "cancelled";
    paymentMethod: "pix" | "card" | "cash" | "transfer" | "pending";
    paymentStatus: "pending" | "paid" | "partially_paid";
    saleDate: string; notes?: string; proofReference?: string; requestId?: string;
    createdAt: string; updatedAt: string; history: Array<{ status: string; at: string; by?: string }>;
  }>;
  notifications: Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>;
  collections: Array<{ id: string; name: string; description?: string; productIds: string[]; createdAt: string; updatedAt: string }>;
  sessionUserId: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; role?: string; phone?: string };
  created_at?: string;
};

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    throw new Error("Supabase server configuration is incomplete.");
  }
  return { url, serviceKey, anonKey };
}

async function api<T>(
  path: string,
  init: RequestInit = {},
  keyType: "service" | "anon" = "service",
): Promise<T> {
  const { url, serviceKey, anonKey } = config();
  const key = keyType === "service" ? serviceKey : anonKey;
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(body?.message ?? `Supabase request failed (${response.status}).`);
  }
  return body as T;
}

function normalise(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function slugify(value: string) {
  return normalise(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 44) || "operacao";
}

function cookieToken(req: Request) {
  return parseCookie(req.headers.cookie ?? "")[SESSION_COOKIE] ?? null;
}

function setSession(res: Response, accessToken: string) {
  res.cookie(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSupabaseSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getSupabaseActor(req: Request): Promise<SupabaseAuthUser | null> {
  const token = cookieToken(req);
  if (!token) return null;
  const { url, anonKey } = config();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json() as Promise<SupabaseAuthUser>;
}

async function findProfile(profileId: string) {
  const rows = await api<RemoteProfile[]>(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}&select=id,full_name,email,phone&limit=1`,
  );
  return rows[0] ?? null;
}

async function findProfileByLegacyId(legacyId: string) {
  const rows = await api<RemoteProfile[]>(
    `/rest/v1/profiles?auth_subject_legacy=eq.${encodeURIComponent(legacyId)}&select=id,full_name,email,phone&limit=1`,
  );
  return rows[0] ?? null;
}

type Membership = { id: string; organization_id: string; profile_id: string; role: "owner" | "manager" | "reseller"; is_active: boolean };

async function findMembership(profileId: string) {
  const rows = await api<Membership[]>(
    `/rest/v1/organization_members?profile_id=eq.${encodeURIComponent(profileId)}&select=id,organization_id,profile_id,role,is_active&limit=1`,
  );
  return rows[0] ?? null;
}

async function provisionTenant(
  user: SupabaseAuthUser,
  role: "gestora" | "revendedora" = "gestora",
) {
  let profile = await findProfile(user.id);
  const metadata = user.user_metadata ?? {};
  if (!profile) {
    const rows = await api<RemoteProfile[]>("/rest/v1/profiles", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        id: user.id,
        full_name: metadata.full_name ?? user.email ?? "Usuária",
        email: user.email ?? null,
        phone: metadata.phone ?? null,
      }),
    });
    profile = rows[0];
  } else {
    await api("/rest/v1/profiles?id=eq." + encodeURIComponent(user.id), {
      method: "PATCH",
      body: JSON.stringify({
        full_name: metadata.full_name ?? profile.full_name,
        email: user.email ?? profile.email,
        phone: metadata.phone ?? profile.phone,
      }),
    });
  }

  let membership = await findMembership(user.id);
  if (!membership) {
    const suffix = user.id.replace(/-/g, "").slice(0, 8);
    const organizations = await api<Array<{ id: string }>>("/rest/v1/organizations", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: role === "gestora" ? `${profile.full_name} — operação` : `${profile.full_name} — rede`,
        slug: `${slugify(profile.full_name)}-${suffix}`,
        owner_profile_id: user.id,
      }),
    });
    const members = await api<Membership[]>("/rest/v1/organization_members", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        organization_id: organizations[0].id,
        profile_id: user.id,
        role: role === "gestora" ? "owner" : "reseller",
        is_active: true,
      }),
    });
    membership = members[0];
  }
  return { profile, membership };
}

async function localUserFor(user: SupabaseAuthUser): Promise<RemoteUser> {
  const { profile, membership } = await provisionTenant(
    user,
    user.user_metadata?.role === "revendedora" ? "revendedora" : "gestora",
  );
  const reseller = membership.role === "reseller"
    ? await api<Array<{ city: string; commission_rate: string; invite_status: RemoteUser["inviteStatus"] }>>(
      `/rest/v1/reseller_profiles?member_id=eq.${encodeURIComponent(membership.id)}&select=city,commission_rate,invite_status&limit=1`,
    )
    : [];
  return {
    id: user.id,
    name: profile.full_name,
    email: profile.email ?? user.email ?? "",
    phone: profile.phone ?? "",
    role: membership.role === "reseller" ? "revendedora" : "gestora",
    password: "",
    active: membership.is_active,
    commissionRate: Number(reseller[0]?.commission_rate ?? 0),
    city: reseller[0]?.city,
    inviteStatus: reseller[0]?.invite_status,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export async function registerSupabaseAccount(
  res: Response,
  input: { name: string; email: string; phone: string; password: string; role: "gestora" | "revendedora"; inviteToken?: string },
) {
  const invite = input.role === "revendedora" && input.inviteToken
    ? (await rows<{ id: string; member_id: string }>(
      "reseller_invites",
      `token_hash=eq.${encodeURIComponent(createHash("sha256").update(input.inviteToken).digest("hex"))}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,member_id&limit=1`,
    ))[0]
    : null;
  if (input.inviteToken && !invite?.member_id) throw new Error("Este convite não é mais válido.");
  const created = await api<SupabaseAuthUser>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.name.trim(), phone: input.phone.trim(), role: input.role },
    }),
  });
  let invited = false;
  if (invite) {
    const oldMembers = await rows<Membership>("organization_members", `id=eq.${encodeURIComponent(invite.member_id)}&select=id,organization_id,profile_id,role,is_active&limit=1`);
    const oldMember = oldMembers[0];
    if (!oldMember) throw new Error("O convite não tem uma revendedora disponível.");
    await api(`/rest/v1/organization_members?id=eq.${encodeURIComponent(oldMember.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ profile_id: created.id, is_active: true }),
    });
    await api(`/rest/v1/reseller_invites?id=eq.${encodeURIComponent(invite.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted", accepted_at: new Date().toISOString() }),
    });
    await api(`/auth/v1/admin/users/${encodeURIComponent(oldMember.profile_id)}`, { method: "DELETE" });
    invited = true;
  }
  if (!invited) await provisionTenant(created, input.role);
  return loginSupabaseAccount(res, { email: input.email, password: input.password, role: input.role });
}

export async function loginSupabaseAccount(
  res: Response,
  input: { email: string; password: string; role?: "gestora" | "revendedora" },
) {
  const { url, anonKey } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, ...JSON_HEADERS },
    body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password }),
  });
  const session = await response.json();
  if (!response.ok) throw new Error(session?.error_description ?? "E-mail ou senha inválidos.");
  setSession(res, session.access_token);
  const user = await localUserFor(session.user as SupabaseAuthUser);
  if (input.role && user.role !== input.role) {
    clearSupabaseSession(res);
    throw new Error("Este acesso não corresponde ao perfil selecionado.");
  }
  return user;
}

export async function currentSupabaseUser(req: Request) {
  const actor = await getSupabaseActor(req);
  return actor ? localUserFor(actor) : null;
}

function inFilter(ids: string[]) {
  return `in.(${ids.map(encodeURIComponent).join(",")})`;
}

async function organizationFor(actor: SupabaseAuthUser) {
  const { membership } = await provisionTenant(
    actor,
    actor.user_metadata?.role === "revendedora" ? "revendedora" : "gestora",
  );
  if (!membership.is_active) throw new Error("Seu acesso a esta organização está inativo.");
  return membership;
}

async function rows<T>(table: string, query: string) {
  return api<T[]>(`/rest/v1/${table}?${query}`);
}

function number(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export async function loadSupabaseStore(req: Request): Promise<RemoteStore> {
  const actor = await getSupabaseActor(req);
  if (!actor) throw new Error("Sessão inválida.");
  const membership = await organizationFor(actor);
  const organizationId = membership.organization_id;
  const orderScope = membership.role === "reseller"
    ? `organization_id=eq.${encodeURIComponent(organizationId)}&reseller_member_id=eq.${encodeURIComponent(membership.id)}`
    : `organization_id=eq.${encodeURIComponent(organizationId)}`;
  const memberScope = membership.role === "reseller"
    ? `organization_id=eq.${encodeURIComponent(organizationId)}&profile_id=eq.${encodeURIComponent(actor.id)}`
    : `organization_id=eq.${encodeURIComponent(organizationId)}`;
  const notificationScope = membership.role === "reseller"
    ? `organization_id=eq.${encodeURIComponent(organizationId)}&recipient_profile_id=eq.${encodeURIComponent(actor.id)}`
    : `organization_id=eq.${encodeURIComponent(organizationId)}`;
  const [members, products, customers, orders, collections, notifications] = await Promise.all([
    rows<Membership>("organization_members", `${memberScope}&select=id,organization_id,profile_id,role,is_active`),
    rows<any>("products", `organization_id=eq.${encodeURIComponent(organizationId)}&select=*&order=created_at.desc`),
    membership.role === "reseller"
      ? Promise.resolve([])
      : rows<any>("customers", `organization_id=eq.${encodeURIComponent(organizationId)}&deleted_at=is.null&select=*&order=created_at.desc`),
    rows<any>("orders", `${orderScope}&select=*&order=sale_date.desc`),
    rows<any>("collections", `organization_id=eq.${encodeURIComponent(organizationId)}&select=*&order=created_at.desc`),
    rows<any>("notifications", `${notificationScope}&select=*&order=created_at.desc`),
  ]);
  const profileIds = members.map(member => member.profile_id);
  const profiles = profileIds.length
    ? await rows<RemoteProfile>("profiles", `id=${inFilter(profileIds)}&select=id,full_name,email,phone,created_at`)
    : [];
  const resellerProfiles = members.length
    ? await rows<any>("reseller_profiles", `member_id=${inFilter(members.map(member => member.id))}&select=member_id,city,commission_rate,invite_status`)
    : [];
  const memberByProfile = new Map(members.map(member => [member.profile_id, member]));
  const profileById = new Map(profiles.map(profile => [profile.id, profile]));
  const resellerProfileByMember = new Map(resellerProfiles.map(profile => [profile.member_id, profile]));
  const productIds = products.map(product => product.id);
  const collectionIds = collections.map(collection => collection.id);
  const orderIds = orders.map(order => order.id);
  const [items, histories, collectionProducts] = await Promise.all([
    orderIds.length ? rows<any>("order_items", `order_id=${inFilter(orderIds)}&select=*`) : Promise.resolve([]),
    orderIds.length ? rows<any>("order_status_history", `organization_id=eq.${encodeURIComponent(organizationId)}&select=*`) : Promise.resolve([]),
    collectionIds.length ? rows<any>("collection_products", `collection_id=${inFilter(collectionIds)}&select=*`) : Promise.resolve([]),
  ]);
  const [variations, productTags, productMedia] = await Promise.all([
    productIds.length ? rows<any>("product_variations", `product_id=${inFilter(productIds)}&select=*`) : Promise.resolve([]),
    productIds.length ? rows<any>("product_tags", `product_id=${inFilter(productIds)}&select=product_id,tag_id`) : Promise.resolve([]),
    productIds.length ? rows<any>("product_media", `product_id=${inFilter(productIds)}&kind=eq.external_url&select=product_id,storage_path`) : Promise.resolve([]),
  ]);
  const variationIds = variations.map(variation => variation.id);
  const tagIds = productTags.map(tag => tag.tag_id);
  const [variationOptions, tags] = await Promise.all([
    variationIds.length ? rows<any>("product_variation_options", `variation_id=${inFilter(variationIds)}&select=variation_id,value`) : Promise.resolve([]),
    tagIds.length ? rows<any>("tags", `id=${inFilter(tagIds)}&select=id,name`) : Promise.resolve([]),
  ]);
  const itemsByOrder = new Map<string, any[]>();
  for (const item of items) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]);
  const historyByOrder = new Map<string, any[]>();
  for (const history of histories) historyByOrder.set(history.order_id, [...(historyByOrder.get(history.order_id) ?? []), history]);
  const productsByCollection = new Map<string, string[]>();
  for (const link of collectionProducts) productsByCollection.set(link.collection_id, [...(productsByCollection.get(link.collection_id) ?? []), link.product_id]);
  const collectionByProduct = new Map<string, string>();
  for (const link of collectionProducts) collectionByProduct.set(link.product_id, link.collection_id);
  const optionsByVariation = new Map<string, string[]>();
  for (const option of variationOptions) optionsByVariation.set(option.variation_id, [...(optionsByVariation.get(option.variation_id) ?? []), option.value]);
  const variationsByProduct = new Map<string, Array<{ name: string; options: string[] }>>();
  for (const variation of variations) {
    variationsByProduct.set(variation.product_id, [...(variationsByProduct.get(variation.product_id) ?? []), {
      name: variation.name,
      options: optionsByVariation.get(variation.id) ?? [],
    }]);
  }
  const tagNameById = new Map(tags.map(tag => [tag.id, tag.name]));
  const tagsByProduct = new Map<string, string[]>();
  for (const tag of productTags) {
    const name = tagNameById.get(tag.tag_id);
    if (name) tagsByProduct.set(tag.product_id, [...(tagsByProduct.get(tag.product_id) ?? []), name]);
  }
  const imageByProduct = new Map(productMedia.map(media => [media.product_id, media.storage_path]));
  const currentUser = await localUserFor(actor);

  return {
    users: members.map(member => {
      const profile = profileById.get(member.profile_id);
      const resellerProfile = resellerProfileByMember.get(member.id);
      return {
        id: member.profile_id,
        name: profile?.full_name ?? "Usuária",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        role: (member.role === "reseller" ? "revendedora" : "gestora") as RemoteUser["role"],
        password: "",
        active: member.is_active,
        commissionRate: Number(resellerProfile?.commission_rate ?? 0),
        city: resellerProfile?.city,
        inviteStatus: resellerProfile?.invite_status,
        createdAt: (profile as any)?.created_at ?? new Date().toISOString(),
      };
    }).map(user => user.id === currentUser.id ? currentUser : user),
    customers: customers.map(customer => ({
      id: customer.id, name: customer.full_name, phone: customer.phone ?? "", email: customer.email ?? undefined,
      createdAt: customer.created_at, updatedAt: customer.updated_at,
    })),
    products: products.map(product => ({
      id: product.id, name: product.name, category: product.category, price: number(product.sale_price),
      stock: product.stock_on_hand, status: product.status, accent: product.accent_color ?? "#b8955b",
      imageUrl: imageByProduct.get(product.id), description: product.description ?? undefined,
      variations: variationsByProduct.get(product.id) ?? [], tags: tagsByProduct.get(product.id) ?? [],
      showInStore: product.show_in_store,
      collection: collectionByProduct.get(product.id), createdAt: product.created_at, updatedAt: product.updated_at,
    })),
    orders: orders.map(order => ({
      id: order.id, origin: order.origin, entryType: order.entry_type, resellerId: order.reseller_member_id
        ? members.find(member => member.id === order.reseller_member_id)?.profile_id : undefined,
      customerId: order.customer_id ?? undefined, customerName: order.customer_name_snapshot ?? undefined,
      customerContact: order.customer_phone_snapshot ?? undefined,
      items: (itemsByOrder.get(order.id) ?? []).map(item => ({
        productId: item.product_id ?? "general-sale", productName: item.product_name_snapshot,
        unitPrice: number(item.unit_price), quantity: item.quantity, subtotal: number(item.subtotal),
      })),
      total: number(order.total_amount), commission: number(order.commission_amount), commissionRate: number(order.commission_rate),
      status: order.status, paymentMethod: order.payment_method === "other" ? "pending" : order.payment_method,
      paymentStatus: order.payment_status, saleDate: order.sale_date, notes: order.legacy_payload?.notes,
      proofReference: order.legacy_payload?.proofReference, requestId: order.request_id,
      createdAt: order.created_at, updatedAt: order.updated_at,
      history: (historyByOrder.get(order.id) ?? []).map(history => ({ status: history.to_status, at: history.changed_at })),
    })),
    notifications: notifications.map(notification => ({
      id: notification.id, title: notification.title, message: notification.message,
      read: Boolean(notification.read_at), createdAt: notification.created_at,
    })),
    collections: collections.map(collection => ({
      id: collection.id, name: collection.name, description: collection.description ?? undefined,
      productIds: productsByCollection.get(collection.id) ?? [], createdAt: collection.created_at, updatedAt: collection.updated_at,
    })),
    sessionUserId: actor.id,
  };
}

async function upsert(table: string, data: unknown) {
  if (!Array.isArray(data) || data.length === 0) return;
  await api(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(data),
  });
}

async function deleteMissing(table: string, organizationId: string, existing: Array<{ id: string }>, incomingIds: Set<string>) {
  const ids = existing.filter(item => !incomingIds.has(item.id)).map(item => item.id);
  if (!ids.length) return;
  await api(`/rest/v1/${table}?id=${inFilter(ids)}&organization_id=eq.${encodeURIComponent(organizationId)}`, { method: "DELETE" });
}

async function rejectForeignResourceIds(table: string, organizationId: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return;
  const records = await rows<{ id: string; organization_id: string }>(
    table,
    `id=${inFilter(uniqueIds)}&select=id,organization_id`,
  );
  if (records.some(record => record.organization_id !== organizationId)) {
    throw new Error("Um recurso informado não pertence à sua organização.");
  }
}

async function ensureResellerMember(
  organizationId: string,
  input: RemoteUser,
  existingMembers: Membership[],
) {
  const matchingMember = existingMembers.find(member => member.profile_id === input.id);
  if (matchingMember) {
    await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ full_name: input.name, phone: input.phone || null, email: input.email || null }),
    });
    await api(`/rest/v1/organization_members?id=eq.${encodeURIComponent(matchingMember.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: input.active }),
    });
    await upsert("reseller_profiles", [{
      member_id: matchingMember.id, city: input.city || "Não informado",
      commission_rate: input.commissionRate, invite_status: input.inviteStatus ?? "not_invited",
    }]);
    return { ...matchingMember, is_active: input.active };
  }

  let profile = await findProfileByLegacyId(input.id);
  if (!profile) {
    const authUser = await api<SupabaseAuthUser>("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: `reseller-${randomUUID()}@local.invalid`,
        password: randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: input.name, phone: input.phone, role: "revendedora" },
      }),
    });
    profile = await findProfile(authUser.id);
    if (!profile) throw new Error("Não foi possível preparar a conta da revendedora.");
    await api(`/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        auth_subject_legacy: input.id,
      }),
    });
  }
  const created = await api<Membership[]>("/rest/v1/organization_members", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      organization_id: organizationId,
      profile_id: profile.id,
      role: "reseller",
      is_active: input.active,
    }),
  });
  const member = created[0];
  await upsert("reseller_profiles", [{
    member_id: member.id,
    city: input.city || "Não informado",
    commission_rate: input.commissionRate,
    invite_status: input.inviteStatus ?? "not_invited",
  }]);
  if (input.inviteLink) {
    const token = input.inviteLink.split("/").filter(Boolean).pop();
    if (token) {
      await api(`/rest/v1/reseller_invites?member_id=eq.${encodeURIComponent(member.id)}&status=eq.pending`, { method: "DELETE" });
      await api("/rest/v1/reseller_invites", {
        method: "POST",
        body: JSON.stringify({
          organization_id: organizationId, member_id: member.id,
          token_hash: createHash("sha256").update(token).digest("hex"),
          status: "pending", expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: (await rows<{ owner_profile_id: string }>("organizations", `id=eq.${encodeURIComponent(organizationId)}&select=owner_profile_id&limit=1`))[0].owner_profile_id,
        }),
      });
    }
  }
  return member;
}

export async function saveSupabaseStore(req: Request, store: RemoteStore) {
  const actor = await getSupabaseActor(req);
  if (!actor) throw new Error("Sessão inválida.");
  const membership = await organizationFor(actor);
  const canManage = ["owner", "manager"].includes(membership.role);
  const organizationId = membership.organization_id;
  const existing = await loadSupabaseStore(req);
  const actorId = actor.id;
  await Promise.all([
    rejectForeignResourceIds("products", organizationId, store.products.map(product => product.id)),
    rejectForeignResourceIds("customers", organizationId, store.customers.map(customer => customer.id)),
    rejectForeignResourceIds("orders", organizationId, store.orders.map(order => order.id)),
    rejectForeignResourceIds("collections", organizationId, store.collections.map(collection => collection.id)),
    rejectForeignResourceIds("notifications", organizationId, store.notifications.map(notification => notification.id)),
    rejectForeignResourceIds("products", organizationId, store.orders.flatMap(order => order.items.map(item => item.productId)).filter(id => id !== "general-sale")),
    rejectForeignResourceIds("customers", organizationId, store.orders.flatMap(order => order.customerId ? [order.customerId] : [])),
  ]);
  const customers = store.customers.map(customer => ({
    id: customer.id, organization_id: organizationId, full_name: customer.name.trim(), phone: customer.phone || null,
    phone_normalized: customer.phone.replace(/\D/g, "") || null, email: customer.email ?? null,
  }));
  const products = store.products.map(product => ({
    id: product.id, organization_id: organizationId, name: product.name.trim(), name_normalized: normalise(product.name),
    category: product.category || "Sem categoria", description: product.description ?? null, sale_price: product.price,
    stock_on_hand: product.stock, status: product.status, accent_color: product.accent || null, show_in_store: Boolean(product.showInStore),
  }));
  const newCustomerIds = new Set(existing.customers.map(customer => customer.id));
  if (canManage) {
    await upsert("customers", customers);
    await upsert("products", products);
    const allTagNames = Array.from(new Set(store.products.flatMap(product => product.tags ?? []).map(tag => tag.trim()).filter(Boolean)));
    if (allTagNames.length) {
      await api("/rest/v1/tags?on_conflict=organization_id,name_normalized", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(allTagNames.map(tag => ({
          organization_id: organizationId,
          name: tag,
          name_normalized: normalise(tag),
        }))),
      });
    }
    const remoteTags = allTagNames.length
      ? await rows<any>("tags", `organization_id=eq.${encodeURIComponent(organizationId)}&select=id,name_normalized`)
      : [];
    const tagIdByName = new Map(remoteTags.map(tag => [tag.name_normalized, tag.id]));
    for (const product of store.products) {
      await api(`/rest/v1/product_variations?product_id=eq.${encodeURIComponent(product.id)}`, { method: "DELETE" });
      await api(`/rest/v1/product_tags?product_id=eq.${encodeURIComponent(product.id)}`, { method: "DELETE" });
      await api(`/rest/v1/product_media?product_id=eq.${encodeURIComponent(product.id)}&kind=eq.external_url`, { method: "DELETE" });
      const createdVariations = (product.variations?.length ?? 0)
        ? await api<Array<{ id: string; name: string }>>("/rest/v1/product_variations", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(product.variations!.map(variation => ({
            organization_id: organizationId, product_id: product.id, name: variation.name.trim(),
          }))),
        })
        : [];
      for (const variation of createdVariations) {
        const source = product.variations?.find(item => item.name.trim() === variation.name);
        await upsert("product_variation_options", (source?.options ?? []).filter(Boolean).map(value => ({
          variation_id: variation.id, value: value.trim(),
        })));
      }
      await upsert("product_tags", (product.tags ?? []).map(tag => ({
        product_id: product.id, tag_id: tagIdByName.get(normalise(tag)),
      })).filter(tag => Boolean(tag.tag_id)));
      if (product.imageUrl) {
        await upsert("product_media", [{
          organization_id: organizationId, product_id: product.id, storage_path: product.imageUrl, kind: "external_url",
        }]);
      }
    }
    await upsert("collections", store.collections.map(collection => ({
      id: collection.id, organization_id: organizationId, name: collection.name.trim(), description: collection.description ?? null,
    })));
  } else {
    await upsert("customers", customers.filter(customer => !newCustomerIds.has(customer.id)));
  }
  const remoteMembers = await rows<Membership>("organization_members", `organization_id=eq.${encodeURIComponent(organizationId)}&select=id,organization_id,profile_id,role,is_active`);
  const profileIdMap = new Map<string, string>([[actorId, actorId]]);
  if (canManage) {
    const retainedResellers = new Set(store.users.filter(user => user.role === "revendedora").map(user => user.id));
    const removedMembers = remoteMembers.filter(member => member.role === "reseller" && !retainedResellers.has(member.profile_id));
    for (const removed of removedMembers) {
      await api(`/rest/v1/organization_members?id=eq.${encodeURIComponent(removed.id)}`, { method: "DELETE" });
    }
  }
  for (const user of canManage ? store.users.filter(user => user.role === "revendedora") : []) {
    const resolved = await ensureResellerMember(organizationId, user, remoteMembers);
    profileIdMap.set(user.id, resolved.profile_id);
    if (!remoteMembers.some(member => member.id === resolved.id)) remoteMembers.push(resolved);
  }
  const memberByProfile = new Map(remoteMembers.map(item => [item.profile_id, item.id]));
  const ordersToSync = canManage
    ? store.orders
    : store.orders.filter(order => order.origin === "reseller" && order.resellerId === actorId);
  if (!canManage && ordersToSync.length) {
    const submittedIds = ordersToSync.map(order => order.id);
    const storedOrders = await rows<{ id: string; reseller_member_id: string | null }>(
      "orders",
      `organization_id=eq.${encodeURIComponent(organizationId)}&id=${inFilter(submittedIds)}&select=id,reseller_member_id`,
    );
    for (const storedOrder of storedOrders) {
      if (storedOrder.reseller_member_id !== membership.id) {
        throw new Error("Você não pode alterar pedidos de outra revendedora.");
      }
    }
  }
  const orders = ordersToSync.map(order => ({
    id: order.id, organization_id: organizationId, created_by_profile_id: actorId,
    reseller_member_id: canManage
      ? (order.resellerId ? memberByProfile.get(profileIdMap.get(order.resellerId) ?? order.resellerId) ?? null : null)
      : membership.id,
    customer_id: order.customerId ?? null, origin: order.origin, entry_type: order.entryType,
    status: order.status === "draft" ? "pending" : order.status,
    payment_method: order.paymentMethod === "pending" ? "other" : order.paymentMethod,
    payment_status: order.paymentStatus, sale_date: order.saleDate,
    manual_description: order.entryType === "general" ? order.items[0]?.productName ?? "Venda geral" : null,
    total_amount: order.total, commission_amount: order.commission, commission_rate: order.commissionRate,
    customer_name_snapshot: order.customerName ?? null, customer_phone_snapshot: order.customerContact ?? null,
    legacy_payload: { notes: order.notes ?? null, proofReference: order.proofReference ?? null },
    request_id: order.requestId ?? order.id,
  }));
  await upsert("orders", orders);
  for (const order of ordersToSync) {
    await api(`/rest/v1/order_items?order_id=eq.${encodeURIComponent(order.id)}`, { method: "DELETE" });
    await api(`/rest/v1/order_status_history?order_id=eq.${encodeURIComponent(order.id)}`, { method: "DELETE" });
    await upsert("order_items", order.items.map(item => ({
      order_id: order.id, product_id: item.productId === "general-sale" ? null : item.productId,
      item_type: item.productId === "general-sale" ? "general" : "product",
      product_name_snapshot: item.productName, unit_price: item.unitPrice, quantity: item.quantity, subtotal: item.subtotal,
    })));
    await upsert("order_status_history", order.history.map(history => ({
      organization_id: organizationId, order_id: order.id, to_status: history.status === "draft" ? "pending" : history.status,
      changed_by_profile_id: actorId, changed_at: history.at,
    })));
  }
  for (const collection of canManage ? store.collections : []) {
    await api(`/rest/v1/collection_products?collection_id=eq.${encodeURIComponent(collection.id)}`, { method: "DELETE" });
    await upsert("collection_products", collection.productIds.map(productId => ({ collection_id: collection.id, product_id: productId })));
  }
  const ownedNotificationIds = new Set(existing.notifications.map(notification => notification.id));
  const notificationsToSync = canManage
    ? store.notifications
    : store.notifications.filter(notification => ownedNotificationIds.has(notification.id));
  await upsert("notifications", notificationsToSync.map(notification => ({
    id: notification.id, organization_id: organizationId, recipient_profile_id: actorId, type: "platform",
    title: notification.title, message: notification.message, read_at: notification.read ? new Date().toISOString() : null,
  })));
  return loadSupabaseStore(req);
}

export async function saveSupabaseProductCost(req: Request, productId: string, costBase: number) {
  const actor = await getSupabaseActor(req);
  if (!actor) throw new Error("Sessão inválida.");
  const membership = await organizationFor(actor);
  if (!["owner", "manager"].includes(membership.role)) throw new Error("Somente gestoras podem registrar custos.");
  if (!Number.isFinite(costBase) || costBase < 0) throw new Error("Informe um custo válido.");
  const products = await rows<{ id: string }>("products", `id=eq.${encodeURIComponent(productId)}&organization_id=eq.${encodeURIComponent(membership.organization_id)}&select=id`);
  if (!products[0]) throw new Error("Produto não encontrado na sua operação.");
  await upsert("product_private_costs", [{
    organization_id: membership.organization_id,
    product_id: productId,
    cost_base: costBase,
  }]);
}

export async function loadSupabaseProductCost(req: Request, productId: string) {
  const actor = await getSupabaseActor(req);
  if (!actor) throw new Error("Sessão inválida.");
  const membership = await organizationFor(actor);
  if (!["owner", "manager"].includes(membership.role)) throw new Error("Somente gestoras podem consultar custos.");
  const costs = await rows<{ cost_base: string }>(
    "product_private_costs",
    `organization_id=eq.${encodeURIComponent(membership.organization_id)}&product_id=eq.${encodeURIComponent(productId)}&select=cost_base&limit=1`,
  );
  return costs[0] ? Number(costs[0].cost_base) : null;
}

export function registerSupabaseRoutes(app: {
  get: (path: string, handler: (req: Request, res: Response) => unknown) => void;
  post: (path: string, handler: (req: Request, res: Response) => unknown) => void;
  put: (path: string, handler: (req: Request, res: Response) => unknown) => void;
}) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, phone, password, role, inviteToken } = req.body ?? {};
      if (!name || !email || !phone || typeof password !== "string" || password.length < 6 || !["gestora", "revendedora"].includes(role)) {
        return res.status(400).json({ message: "Revise os dados de cadastro." });
      }
      const user = await registerSupabaseAccount(res, { name, email, phone, password, role, inviteToken });
      return res.status(201).json({ user });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Não foi possível criar a conta." });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body ?? {};
      const user = await loginSupabaseAccount(res, { email, password, role });
      return res.json({ user });
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : "Não foi possível entrar." });
    }
  });
  app.get("/api/auth/session", async (req, res) => {
    try {
      const user = await currentSupabaseUser(req);
      return res.json({ user });
    } catch {
      clearSupabaseSession(res);
      return res.json({ user: null });
    }
  });
  app.post("/api/auth/logout", (_req, res) => {
    clearSupabaseSession(res);
    return res.json({ success: true });
  });
  app.get("/api/store", async (req, res) => {
    try {
      return res.json(await loadSupabaseStore(req));
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : "Sessão inválida." });
    }
  });
  app.put("/api/store", async (req, res) => {
    try {
      return res.json(await saveSupabaseStore(req, req.body as RemoteStore));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Não foi possível salvar no Supabase." });
    }
  });
  app.put("/api/products/:productId/private-cost", async (req, res) => {
    try {
      await saveSupabaseProductCost(req, req.params.productId, Number(req.body?.costBase));
      return res.status(204).end();
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Não foi possível salvar o custo." });
    }
  });
  app.get("/api/products/:productId/private-cost", async (req, res) => {
    try {
      return res.json({ costBase: await loadSupabaseProductCost(req, req.params.productId) });
    } catch (error) {
      return res.status(403).json({ message: error instanceof Error ? error.message : "Não foi possível consultar o custo." });
    }
  });
}