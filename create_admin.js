import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlgvxjahadswvulkrcjc.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ3Z4amFoYWRzd3Z1bGtyY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3NDc2MCwiZXhwIjoyMDgzNjUwNzYwfQ.4acmRm9y0j_mnob1YSFYDD4zbHcMrrI9Wu1B7LKkKvg'

// Use the service_role key to bypass confirmation
const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createAdminUser() {
    console.log('Attempting to create/confirm admin user...')

    const { data, error } = await supabase.auth.admin.createUser({
        email: 'mohityadav16.2009@gmail.com',
        password: 'Sanwariya_1228',
        email_confirm: true,
        user_metadata: { role: 'admin' }
    })

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('User already exists. Attempting to confirm and update password...')
            // If user exists, we might need to find them and update if confirmation was the only issue
            // But since we are here, let's just try to update the user if they exist
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
            if (listError) {
                console.error('Error listing users:', listError.message)
                return
            }
            const user = listData.users.find(u => u.email === 'shrisanwariyaroadlines@gmail.com')
            if (user) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                    email_confirm: true,
                    password: 'Sanwariya_1228'
                })
                if (updateError) {
                    console.error('Error updating user:', updateError.message)
                } else {
                    console.log('User updated and confirmed successfully.')
                }
            }
        } else {
            console.error('Operation failed:', error.message)
        }
    } else {
        console.log('Admin user created and confirmed successfully.')
    }
}

createAdminUser()
