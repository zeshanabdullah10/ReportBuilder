'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { updateProfileSchema } from '@/lib/validations/auth'

export async function loginAction(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signupAction(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to verify your account')
}

export async function updateProfileAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate input
  const validated = updateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    company: formData.get('company'),
  })

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Update profile in database
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: validated.data.fullName,
      company: validated.data.company || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
