import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlgvxjahadswvulkrcjc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ3Z4amFoYWRzd3Z1bGtyY2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzQ3NjAsImV4cCI6MjA4MzY1MDc2MH0.lDKJNXw8qkuyAS55MQgfzomIV6ayo_LxfFWPMVQ-FSI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function registerUser() {
    const { data, error } = await supabase.auth.signUp({
        email: 'shrisanwariyaroadlines@gmail.com',
        password: 'Sanwariya_1228',
    })

    if (error) {
        console.error('Registration failed:', error.message)
    } else {
        console.log('Registration successful:', data.user ? 'User created' : 'Check email for confirmation')
    }
}

registerUser()
