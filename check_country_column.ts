
import { createClient } from 'npm:@supabase/supabase-js'
import { load } from "https://deno.land/std@0.220.0/dotenv/mod.ts";

const env = await load();
const supabaseUrl = env["VITE_SUPABASE_URL"] || Deno.env.get("VITE_SUPABASE_URL");
const supabaseKey = env["VITE_SUPABASE_ANON_KEY"] || Deno.env.get("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    Deno.exit(1)
}

console.log(`Connecting to ${supabaseUrl}...`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking profiles table schema...')

    // 1. Try to select country from a profile
    const { data: profiles, error: selectError } = await supabase
        .from('profiles')
        .select('id, username, country')
        .limit(1)

    if (selectError) {
        console.error('Select failed:', selectError)
        // If error mentions 'country' does not exist, we know the issue
    } else {
        console.log('Select successful. Data:', profiles)
    }

    // 2. Try to update country for a test user (or the user from the list)
    if (profiles && profiles.length > 0) {
        const userId = profiles[0].id
        console.log(`Attempting to update country for user ${userId}...`)

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ country: 'CI' })
            .eq('id', userId)

        if (updateError) {
            console.error('Update failed:', updateError)
        } else {
            console.log('Update successful!')
        }
    } else {
        console.log('No profiles found to test update.')
    }
}

checkSchema()
