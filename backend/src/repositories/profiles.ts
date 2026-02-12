import { supabaseRequest } from "../firebase.js";
import { Profile, ProfileData } from "../types.js";

const mapProfileRow = (row: Partial<ProfileData> & { id?: string; user_id?: string; company_name?: string; company_cnpj?: string; logo_url?: string }): Profile | null => {
    if (!row?.id) return null;
    return {
        id: row.id,
        userId: row.user_id ?? row.userId ?? "",
        email: row.email ?? "",
        document: row.document ?? "",
        companyName: row.company_name ?? row.companyName ?? null,
        companyCnpj: row.company_cnpj ?? row.companyCnpj ?? null,
        logoUrl: row.logo_url ?? row.logoUrl ?? null,
        phone: row.phone ?? null,
    };
};

export async function getProfile(userId: string): Promise<Profile | null> {
    // Query by user_id
    const rows = await supabaseRequest<any[]>(`profiles`, {
        params: {
            user_id: `eq.${userId}`,
            select: "*",
        },
    });

    if (!rows || rows.length === 0) return null;
    return mapProfileRow(rows[0]);
}

export async function updateProfile(userId: string, data: Partial<ProfileData>): Promise<Profile | null> {
    const profile = await getProfile(userId);
    if (!profile) return null;

    const payload: Record<string, unknown> = {};
    if (data.companyName !== undefined) payload.company_name = data.companyName;
    if (data.companyCnpj !== undefined) payload.company_cnpj = data.companyCnpj;
    if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
    if (data.phone !== undefined) payload.phone = data.phone;
    // email and document are usually read-only or handled separately

    const rows = await supabaseRequest<any[]>(`profiles`, {
        method: "PATCH",
        body: payload,
        params: {
            id: `eq.${profile.id}`,
            select: "*",
        },
        headers: { Prefer: "return=representation" },
    });

    if (!rows || rows.length === 0) return null;
    return mapProfileRow(rows[0]);
}
export async function createProfile(data: ProfileData): Promise<Profile | null> {
    const payload = {
        user_id: data.userId,
        email: data.email,
        document: data.document,
        company_name: data.companyName,
        company_cnpj: data.companyCnpj,
        logo_url: data.logoUrl,
        phone: data.phone,
    };

    const rows = await supabaseRequest<any[]>(`profiles`, {
        method: "POST",
        body: payload,
        headers: { Prefer: "return=representation" },
    });

    if (!rows || rows.length === 0) return null;
    return mapProfileRow(rows[0]);
}

export async function claimProfileByEmail(userId: string, email: string): Promise<Profile | null> {
    // Update the profile to link to new user_id
    const rows = await supabaseRequest<any[]>(`profiles`, {
        method: "PATCH",
        params: {
            email: `eq.${email}`,
            select: "*"
        },
        body: { user_id: userId },
        headers: { Prefer: "return=representation" },
    });

    if (!rows || rows.length === 0) return null;
    return mapProfileRow(rows[0]);
}
