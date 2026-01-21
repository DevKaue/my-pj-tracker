export const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "PJ Manager API",
    description: "API REST para organizacoes, projetos e tarefas (PT/EN)",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [
    { name: "Organizations", description: "Organizacoes / Organizations" },
    { name: "Projects", description: "Projetos / Projects" },
    { name: "Tasks", description: "Tarefas / Tasks" },
  ],
  paths: {
    "/organizations": {
      get: { tags: ["Organizations"], summary: "Lista organizacoes", responses: { 200: { description: "OK" } } },
      post: { tags: ["Organizations"], summary: "Cria organizacao", requestBody: { required: true }, responses: { 201: { description: "Criado" } } },
    },
    "/organizations/{id}": {
      put: { tags: ["Organizations"], summary: "Atualiza organizacao", parameters: [{ name: "id", in: "path", required: true }], requestBody: { required: true }, responses: { 200: { description: "OK" } } },
      delete: { tags: ["Organizations"], summary: "Remove organizacao", parameters: [{ name: "id", in: "path", required: true }], responses: { 204: { description: "Removido" } } },
    },
    "/projects": {
      get: { tags: ["Projects"], summary: "Lista projetos (organizationId opcional)", parameters: [{ name: "organizationId", in: "query", required: false }], responses: { 200: { description: "OK" } } },
      post: { tags: ["Projects"], summary: "Cria projeto", requestBody: { required: true }, responses: { 201: { description: "Criado" } } },
    },
    "/projects/{id}": {
      put: { tags: ["Projects"], summary: "Atualiza projeto", parameters: [{ name: "id", in: "path", required: true }], requestBody: { required: true }, responses: { 200: { description: "OK" } } },
      delete: { tags: ["Projects"], summary: "Remove projeto", parameters: [{ name: "id", in: "path", required: true }], responses: { 204: { description: "Removido" } } },
    },
    "/tasks": {
      get: { tags: ["Tasks"], summary: "Lista tarefas (filtros opcional)", parameters: [{ name: "projectId", in: "query" }, { name: "organizationId", in: "query" }], responses: { 200: { description: "OK" } } },
      post: { tags: ["Tasks"], summary: "Cria tarefa", requestBody: { required: true }, responses: { 201: { description: "Criado" } } },
    },
    "/tasks/{id}": {
      put: { tags: ["Tasks"], summary: "Atualiza tarefa", parameters: [{ name: "id", in: "path", required: true }], requestBody: { required: true }, responses: { 200: { description: "OK" } } },
      delete: { tags: ["Tasks"], summary: "Remove tarefa", parameters: [{ name: "id", in: "path", required: true }], responses: { 204: { description: "Removido" } } },
    },
    "/health": {
      get: { tags: ["Health"], summary: "Healthcheck", responses: { 200: { description: "OK" } } },
    },
  },
};
