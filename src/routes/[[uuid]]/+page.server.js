import { error, json } from '@sveltejs/kit'
import { sb } from '$lib/server/supabase'

export const load = async ({ params, fetch }) => {
    if (params.uuid) {

        const deleteEncryptedPassword = async () => {
            const { error } = await sb.from('encrypted_passwords').delete().eq('id', params.uuid)
            if (error) error(500, error.message || 'Something went wrong when trying to delete the encrypted password')
        }

        // get the encrypted password from the database
        const { data, error: err } = await sb
            .from('encrypted_passwords')
            .select('ciphertext, created_at')
            .eq('id', params.uuid)
            .maybeSingle()

        if (err) error(500, err.message || 'Something went wrong when trying to retrieve the encrypted password')
        if (!data) error(404, 'The encrypted password does not exist')

        console.log(data)

        const { ciphertext, created_at } = data

        await deleteEncryptedPassword()

        // check if it's older than 1 week
        if (Date.now() - new Date(created_at).getTime() > 604800000) return { expired: true }

        return { ciphertext }
    }
}

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData()
        const { ciphertext } = Object.fromEntries(data)

        // insert the encrypted password into the database
        const { data: res, error: err } = await sb
            .from('encrypted_passwords')
            .insert({ ciphertext })
            .select('id')
            .single()

        if (err) error(500, err.message || 'Something went wrong when trying to save the encrypted password')

        return { id: res.id }
    }
}