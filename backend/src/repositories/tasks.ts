import { randomUUID } from "crypto";
import { firestore } from "../firebase.js";
import { mapTask } from "./helpers.js";
import { Task, TaskData } from "../types.js";

type TaskFilters = { projectId?: string; organizationId?: string };

export async function listTasks(filters?: TaskFilters): Promise<Task[]> {
  const { projectId, organizationId } = filters || {};

  if (projectId) {
    const snap = await firestore
      .collection("tasks")
      .where("projectId", "==", projectId)
      .orderBy("date", "desc")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map(mapTask).filter((item): item is Task => item !== null);
  }

  if (organizationId) {
    const projectsSnap = await firestore.collection("projects").where("organizationId", "==", organizationId).get();
    const projectIds = projectsSnap.docs.map((doc) => doc.id);
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
    tasks.sort((a, b) => (b.date > a.date ? 1 : -1));
    return tasks;
  }

  const snap = await firestore.collection("tasks").orderBy("date", "desc").orderBy("createdAt", "desc").get();
  return snap.docs.map(mapTask).filter((item): item is Task => item !== null);
}

export async function createTask(data: Omit<TaskData, "createdAt">): Promise<Task> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const payload: TaskData = { ...data, createdAt };
  await firestore.collection("tasks").doc(id).set(payload);
  const task = await firestore.collection("tasks").doc(id).get();
  return mapTask(task)!;
}

export async function updateTask(id: string, data: Partial<TaskData>): Promise<Task | null> {
  const docRef = firestore.collection("tasks").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;
  await docRef.set({ ...(existing.data() as TaskData), ...data }, { merge: true });
  const task = await docRef.get();
  return mapTask(task);
}

export async function deleteTask(id: string): Promise<boolean> {
  const docRef = firestore.collection("tasks").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return false;
  await docRef.delete();
  return true;
}
