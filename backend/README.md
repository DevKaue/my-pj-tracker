## Backend (API)

### Rodar local
```bash
cd backend
npm install
npm run dev
```
API em `http://localhost:4000` com Swagger UI em `/docs`.

### Deploy (recomendação)
Use um host de Node com processo persistente (Render, Railway, Fly.io, etc.).
- Sete `PORT` se o host exigir.
- Mantenha o arquivo `data.sqlite` em volume/persistência do provedor ou troque por Postgres e ajuste o código.

> Observação: Vercel serverless não mantém arquivo SQLite e não roda processo persistente; não é recomendada para este backend sem reescrever para outro storage.
