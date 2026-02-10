import { NextFunction, Request, Response } from "express";
import { AUTH_URL, SERVICE_ROLE_KEY } from "../firebase.js";

type SupabaseUserResponse = {
  id?: string;
};

const unauthorizedResponse = (res: Response) =>
  res
    .status(401)
    .json({ message: "Usuário não autenticado / User not authorized" });

function getBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

async function fetchUserId(token: string): Promise<string> {
  const response = await fetch(`${AUTH_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });
  if (!response.ok) {
    throw new Error("token_invalido");
  }
  const body = (await response.json().catch(() => ({}))) as SupabaseUserResponse;
  if (!body?.id) {
    throw new Error("token_invalido");
  }
  return body.id;
}

export async function requireUserId(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.header("authorization") ?? "");

  if (!token) {
    return unauthorizedResponse(res);
  }

  try {
    const userId = await fetchUserId(token);
    (res.locals as { userId?: string }).userId = userId;
    return next();
  } catch (error) {
    return unauthorizedResponse(res);
  }
}

export function getUserId(res: Response): string {
  return (res.locals as { userId?: string }).userId ?? "";
}

