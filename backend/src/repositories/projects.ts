import { randomUUID } from "crypto";
import { firestore } from "../firebase.js";
import { createBatchWithLimit, mapProject } from "./helpers.js";
import { Project, ProjectData } from "../types.js";

export async function listProjects(organizationId?: string): Promise<Project[]> {
  let query: FirebaseFirestore.Query = firestore.collection("projects");
  if (organizationId) {
    query = query.where("organizationId", "==", organizationId);
  }
  const snap = await query.orderBy("createdAt", "desc").get();
  return snap.docs.map(mapProject).filter((item): item is Project => item !== null);
}

export async function createProject(data: Omit<ProjectData, "createdAt">): Promise<Project> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await firestore.collection("projects").doc(id).set({ ...data, createdAt });
  const project = await firestore.collection("projects").doc(id).get();
  return mapProject(project)!;
}

export async function updateProject(id: string, data: Partial<ProjectData>): Promise<Project | null> {
  const docRef = firestore.collection("projects").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;
  await docRef.set({ ...(existing.data() as ProjectData), ...data }, { merge: true });
  const project = await docRef.get();
  return mapProject(project);
}

export async function deleteProjectCascade(projectId: string): Promise<boolean> {
  const projectRef = firestore.collection("projects").doc(projectId);
  const project = await projectRef.get();
  if (!project.exists) return false;

  const { batch, batches, push, enqueueDelete } = createBatchWithLimit();

  const tasksSnap = await firestore.collection("tasks").where("projectId", "==", projectId).get();
  tasksSnap.forEach((doc) => enqueueDelete(doc.ref));

  enqueueDelete(projectRef);
  push();

  for (const b of batches) {
    await b.commit();
  }
  await batch.commit();

  return true;
}

export async function getProject(id: string): Promise<Project | null> {
  const snap = await firestore.collection("projects").doc(id).get();
  return mapProject(snap);
}
