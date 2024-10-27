import { sb } from '$lib/server/supabase'
import { json, error } from '@sveltejs/kit'

const deleteEncryptedPassword = async (uuid) => {
    const { error } = await sb.from('encrypted_passwords').delete().eq('id', uuid)
    if (error) error(500, error.message || 'Something went wrong when trying to delete the encrypted password')
}

// decrypt
export const GET = async ({ params }) => {
    const { uuid } = params

    if (!uuid) error(400, 'Please supply a valid UUID')

    // get the encrypted password from the database
    const { data, error: err } = await sb
        .from('encrypted_passwords')
        .select('created_at, expiry_days, expiry_views, ciphertext')
        .eq('id', uuid)
        .maybeSingle()

    if (err) error(500, err.message || 'Something went wrong when trying to retrieve the encrypted password')
    if (!data) error(404, 'The encrypted password does not exist')

    const { created_at, expiry_days, expiry_views, ciphertext } = data

    // check if it's expired (time)
    const expiryDate = new Date(created_at)
    expiryDate.setDate(expiryDate.getDate() + expiry_days)
    if (expiryDate < new Date()) {
        await deleteEncryptedPassword(uuid)
        error(410, 'The encrypted password has expired')
    }

    // reduce the number of views
    if (expiry_views === 1) await deleteEncryptedPassword(uuid)
    else {
        const { error } = await sb.from('encrypted_passwords').update({ expiry_views: expiry_views - 1 }).eq('id', uuid)
        if (error) error(500, error.message || 'Something went wrong - sorry about that!')
    }

    return json({ ciphertext })
}

export const POST = async ({ request }) => {
    const data = await request.json()
    const { ciphertext, expiryDays, expiryViews } = data

    // insert the encrypted password into the database
    const { data: res, error: err } = await sb
        .from('encrypted_passwords')
        .insert({ ciphertext, expiry_days: expiryDays, expiry_views: expiryViews })
        .select('id')
        .single()

    if (err) error(500, err.message || 'Something went wrong when trying to save the encrypted password')
    
    return json({ id: res.id })
}