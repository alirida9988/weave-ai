# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/77d0b280-419e-45a6-8de3-54b91697fc2a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/77d0b280-419e-45a6-8de3-54b91697fc2a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Supabase: link project and run migrations

After transferring the project to a new repo, rewire the Supabase project and apply migrations:

1. **Link this repo to your Supabase project** (you’ll be prompted for your **database password** in the terminal):

   ```sh
   npm run supabase:link
   ```

   Or with the CLI directly:

   ```sh
   npx supabase link --project-ref znjtxrzmlprhqaylimqm
   ```

2. **Apply migrations to the linked database**:

   ```sh
   npm run supabase:db-push
   ```

   Or:

   ```sh
   npx supabase db push
   ```

   If you have no migrations in `supabase/migrations/`, this step does nothing until you add migration files. Your app still works; it uses the schema already in the Supabase project (or the one you set up in the dashboard).

## Deploy Edge Functions (new project)

The app uses two Supabase Edge Functions. Deploy them to your **new** project (`znjtxrzmlprhqaylimqm`) so “Generate ideas” and image generation work.

### 1. Link the project (if not already done)

You’ll be prompted for your **database password**:

```sh
npm run supabase:link
```

### 2. Set the Gemini API key secret

Both functions need `GEMINI_API_KEY`. Set it in the linked project:

```sh
npx supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). Replace `your_gemini_api_key_here` with your real key.

### 3. Deploy all edge functions

```sh
npm run supabase:functions-deploy
```

Or deploy one at a time:

```sh
# Ideas (Step 2 – “Generate ideas”)
npm run supabase:functions-deploy-ideas

# Image generation (Step 3)
npm run supabase:functions-deploy-image
```

### 4. Verify

- In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Edge Functions**, you should see `ai-creative-assistant` and `ai-image-generator`.
- In the app: sign up, go to Step 2, click **Generate ideas**. The request should go to `https://znjtxrzmlprhqaylimqm.supabase.co/functions/v1/ai-creative-assistant` and succeed if the secret is set.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/77d0b280-419e-45a6-8de3-54b91697fc2a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
