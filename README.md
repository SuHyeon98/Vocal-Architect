<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18ElJKQv2VZ8rWfTuU2wJHIWh5b5FL-F9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in `.env.local` to your Gemini API key when you want to use AI analysis features
3. Run the app:
   `npm run dev`

## Security notes

- Keep real keys in `.env.local`. Do not commit `.env`, `.env.local`, or `.env.production`.
- `VITE_` variables are exposed to the browser bundle, so they are not suitable for unrestricted secret keys.
- For production, call Gemini from a backend API/proxy and keep the Gemini key on the server. The frontend should call your own API endpoint instead of calling Gemini directly.
- The app stores local history, prompts, lyrics, folders, and theme settings in `localStorage`. It does not store API keys, tokens, or passwords there.
- If a real key was ever committed to GitHub, revoke and recreate it in Google AI Studio or Google Cloud, then remove it from Git history before making the repository public.
- Google social login uses Firebase Auth browser SDK. Configure Firebase Authentication and authorized domains/redirect URI in the Firebase console.
- Kakao and Naver login require a backend OAuth proxy or Firebase Custom Auth token minting flow. Do not put OAuth Client Secret values in frontend code or `.env` files exposed to Vite.
