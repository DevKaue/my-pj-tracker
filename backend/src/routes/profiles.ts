import { Router } from "express";
import { profileSchema } from "../schemas.js";
import { requireUserId, getUserId, fetchUser } from "../middleware/user.js";
import { getProfile, updateProfile, createProfile, claimProfileByEmail } from "../repositories/profiles.js";

export const profilesRouter = Router();

profilesRouter.use(requireUserId);

profilesRouter.get("/me", async (req, res, next) => {
    try {
        const userId = getUserId(res);
        let profile = await getProfile(userId);

        if (!profile) {
            // Auto-create profile if strict columns are met or we can fetch data
            try {
                const token = req.headers.authorization?.split(" ")[1];
                if (token) {
                    const user = await fetchUser(token);
                    if (user && user.email) {
                        const userDocument = user.user_metadata?.document;
                        profile = await createProfile({
                            userId,
                            email: user.email,
                            document: userDocument || null,
                            companyName: null,
                            companyCnpj: null,
                            logoUrl: null,
                            phone: null,
                        });
                    }
                }
            } catch (error: any) {
                console.error("Auto-create profile failed", error);

                // If violation is unique email, try to claim the profile (orphaned profile case)
                if (String(error).includes("profiles_email_key") || String(error).includes("duplicate key")) {
                    try {
                        const token = req.headers.authorization?.split(" ")[1];
                        if (token) {
                            const user = await fetchUser(token);
                            if (user && user.email) {
                                // Claim
                                profile = await claimProfileByEmail(userId, user.email);
                            }
                        }
                    } catch (e) {
                        console.error("Claim failed", e);
                    }
                }

                // Check if profile was recovered
                if (!profile) {
                    // Try to fetch again one last time?
                    // Re-throw or return error
                    return res.status(500).json({
                        message: "Falha ao criar perfil automaticamente / Failed to auto-create profile",
                        details: error.message || String(error)
                    });
                }
            }
        }

        if (!profile) {
            return res.status(404).json({ message: "Perfil não encontrado / Profile not found" });
        }
        res.json(profile);
    } catch (err) {
        next(err);
    }
});

profilesRouter.patch("/me", async (req, res, next) => {
    try {
        // Only allow updating specific fields
        const parsed = profileSchema.parse(req.body);
        const userId = getUserId(res);

        // We can't update userId or email here usually
        const updated = await updateProfile(userId, parsed);
        if (!updated) {
            return res.status(404).json({ message: "Perfil não encontrado / Profile not found" });
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
});
