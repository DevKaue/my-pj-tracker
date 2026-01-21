import { firestore } from "../firebase.js";
import { Org, OrgData, Project, ProjectData, Task, TaskData } from "../types.js";

export const mapOrg = (doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Org | null => {
  const data = doc.data() as OrgData | undefined;
  if (!data) return null;
  return { id: doc.id, ...data };
};

export const mapProject = (doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Project | null => {
  const data = doc.data() as ProjectData | undefined;
  if (!data) return null;
  return { id: doc.id, ...data };
};

export const mapTask = (doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Task | null => {
  const data = doc.data() as TaskData | undefined;
  if (!data) return null;
  return { id: doc.id, ...data };
};

export const createBatchWithLimit = () => {
  let batch = firestore.batch();
  let ops = 0;
  const batches: FirebaseFirestore.WriteBatch[] = [];

  const push = () => {
    if (ops > 0) {
      batches.push(batch);
      batch = firestore.batch();
      ops = 0;
    }
  };

  const enqueueDelete = (ref: FirebaseFirestore.DocumentReference) => {
    batch.delete(ref);
    ops += 1;
    if (ops >= 450) push();
  };

  return { batch, batches, push, enqueueDelete };
};
