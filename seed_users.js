import { createClient } from "@supabase/supabase-js";

// CONFIGURATION - PASTE YOUR KEYS FROM YOUR SUPABASE PROJECT SETTINGS -> API
const SUPABASE_URL = "https://qggyknvftdtkhnjfrscm.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZ3lrbnZmdGR0a2huamZyc2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3NDQ3MiwiZXhwIjoyMDg4MTUwNDcyfQ.dZbXt62G5WXhCzP8c4FhanLAjSFJvvI6oZM9hyQ29GE";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS_TO_CREATE = [
  { name: "Francis", role: "Topman" },
  { name: "Royeth", role: "Boarder" },
  { name: "Lito", role: "Boarder" },
  { name: "Miko", role: "Boarder" },
  { name: "Mikmik", role: "Boarder" },
  { name: "Adrian", role: "Boarder" },
  { name: "Andrew", role: "Boarder" },
  { name: "Roniel", role: "Boarder" },
];

async function seed() {
  console.log("🚀 Starting automation: Creating users...");

  for (const user of USERS_TO_CREATE) {
    const email = `${user.name.toLowerCase()}@local.app`;
    const password = "password123"; // Standard password for everyone

    console.log(`Creating ${user.name} (${email})...`);

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: user.name },
      });

    if (authError) {
      console.error(
        `❌ Error creating auth for ${user.name}:`,
        authError.message,
      );
      continue;
    }

    const { error: profError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        username: user.name.toLowerCase(),
        name: user.name,
        role: user.role,
        status: "Pending",
      },
    ]);

    if (profError) {
      console.error(
        `❌ Error creating profile for ${user.name}:`,
        profError.message,
      );
    } else {
      console.log(`✅ Success: ${user.name} created.`);
    }
  }

  console.log(
    '✨ Finished! Everyone can now log in with their name@local.app and "password123"',
  );
}

seed();
