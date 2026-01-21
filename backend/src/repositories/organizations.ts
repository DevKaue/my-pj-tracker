import { randomUUID } from "crypto";
import { firestore } from "../firebase.js";
import { mapOrg, mapProject, mapTask, createBatchWithLimit } from "./helpers.js";
import { Org, OrgData, Project, Task } from "../types.js";

export async function listOrganizations(): Promise<Org[]> {
  const snap = await firestore.collection("organizations").orderBy("createdAt", "desc").get();
  return snap.docs.map(mapOrg).filter((item): item is Org => item !== null);
}

export async function createOrganization(data: Omit<OrgData, "createdAt">): Promise<Org> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await firestore.collection("organizations").doc(id).set({ ...data, createdAt });
  const org = await firestore.collection("organizations").doc(id).get();
  return mapOrg(org)!;
}

export async function updateOrganization(id: string, data: Partial<OrgData>): Promise<Org | null> {
  const docRef = firestore.collection("organizations").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;
  await docRef.set({ ...(existing.data() as OrgData), ...data }, { merge: true });
  const updated = await docRef.get();
  return mapOrg(updated);
}

export async function deleteOrganizationCascade(orgId: string): Promise<boolean> {
  const orgRef = firestore.collection("organizations").doc(orgId);
  const org = await orgRef.get();
  if (!org.exists) return false;

  const { batch, batches, push, enqueueDelete } = createBatchWithLimit();

  const projectsSnap = await firestore.collection("projects").where("organizationId", "==", orgId).get();
  for (const projectDoc of projectsSnap.docs) {
    const tasksSnap = await firestore.collection("tasks").where("projectId", "==", projectDoc.id).get();
    tasksSnap.forEach((task) => enqueueDelete(task.ref));
    enqueueDelete(projectDoc.ref);
  }

  enqueueDelete(orgRef);
  push();

  for (const b of batches) {
    await b.commit();
  }
  await batch.commit();

  return true;
}

export async function getOrganization(id: string): Promise<Org | null> {
  const snap = await firestore.collection("organizations").doc(id).get();
  return mapOrg(snap);
}

export async function listProjectsByOrg(orgId: string): Promise<Project[]> {
  const snap = await firestore.collection("projects").where("organizationId", "==", orgId).get();
  return snap.docs.map(mapProject).filter((item): item is Project => item !== null);
}

export async function listTasksByProjectIds(projectIds: string[]): Promise<Task[]> {
  const tasks: Task[] = [];
  for (const pid of projectIds) {
    const snap = await firestore
      .collection("tasks")
      .where("projectId", "==", pid)
      .orderBy("date", "desc")
      .orderBy("createdAt", "desc")
      .get();
    tasks.push(...snap.docs.map(mapTask).filter((item): item is Task => item !== null));
  }
  return tasks;
}
