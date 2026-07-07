# G3 AudCon — Plataforma de Cursos e Certificação

## Deploy (uma vez só)

1. Suba esta pasta para um repositório no GitHub (pode ser pela própria interface web do GitHub: "Add file → Upload files").
2. No Netlify: **Add new site → Import from an existing project → GitHub** e escolha esse repositório.
   - Build command: `npm install` (já vem configurado no `netlify.toml`)
   - Publish directory: `public` (já configurado)
3. Aguarde o primeiro deploy terminar.

## Ativar o Identity (login de administradora e participantes)

1. No painel do site no Netlify: **Site configuration → Identity → Enable Identity**.
2. Em **Registration**, deixe como **Open** — assim qualquer participante pode criar a própria conta pela tela "Minha Área" da plataforma.
   - Se preferir revisar quem se cadastra, pode deixar **Invite only**, mas aí você precisa convidar cada participante manualmente (Identity → Invite users).
3. Em **External providers**, não precisa ativar nada (login é só por e-mail/senha).
4. Em **Emails**, o Netlify já envia confirmação de cadastro automaticamente. Se quiser, personalize o template depois.

## Criar sua conta de administradora master

1. Vá até a própria plataforma publicada e clique em **"Área Administrativa"** → **Entrar** → **"I don't have an account" / criar conta** (ou peça um convite direto pelo painel: Identity → Invite users → seu e-mail).
2. Depois de criar a conta, volte ao painel do Netlify: **Identity → Users**, clique no seu usuário.
3. No campo **Roles**, adicione a role: `admin` (exatamente essa palavra, minúscula).
4. Salve. Da próxima vez que você entrar na plataforma com esse e-mail, ela reconhece você como administradora e libera o Painel Administrativo.

**Importante:** só contas com a role `admin` conseguem gerenciar cursos, emitir/revogar certificados e ver a fila de solicitações. Qualquer outra conta criada (participantes) só enxerga a própria "Minha Área".

## Como participantes usam a plataforma

1. Acessam a plataforma → **"Minha Área"** → **"Criar minha conta"** (nome, e-mail, senha).
2. Confirmam o e-mail (o Netlify Identity envia automaticamente).
3. Voltam à plataforma, entram, e em **"Minha Área"** escolhem o curso que concluíram, preenchem CPF (opcional) e data de conclusão, e enviam a solicitação.
4. Acompanham o status ("Em análise" / "Aprovada" / "Rejeitada") na mesma tela.
5. Quando aprovada, o certificado aparece em **"Meus certificados"**, com botão para visualizar, baixar em PNG/PDF e o QR Code de validação.

## Limites do plano gratuito a saber

- **Netlify Blobs**: sem limite rígido divulgado para uso normal de um site pequeno/médio.
- **Upload de arquivos de curso**: limite prático de ~4MB por arquivo (limitação das Netlify Functions). Para vídeos ou PDFs maiores, use um link do YouTube (pode ser "não listado"), Vimeo ou Google Drive no campo "Link do material".
- **Netlify Identity**: gratuito até 1.000 usuários ativos/mês nos planos iniciais — mais que suficiente para o volume esperado de participantes.
