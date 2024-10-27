import { error } from '@sveltejs/kit'
import { sb } from '$lib/server/supabase'

export const load = async ({ params, request }) => {

    const lang = request.headers.get('accept-language').split('-')[0] === 'da' ? 'da' : 'en'

    if (params.uuid) {

        // get the encrypted password from the database
        const { data, error: err } = await sb
            .from('encrypted_passwords')
            .select('created_at, expiry_days')
            .eq('id', params.uuid)
            .maybeSingle()

        if (err) error(500, err.message || 'Something went wrong when trying to retrieve the encrypted password')
        if (!data) error(404, 'The encrypted password does not exist')

        const { created_at, expiry_days } = data

        // check if it's expired
        const expiryDate = new Date(created_at)
        expiryDate.setDate(expiryDate.getDate() + expiry_days)
        if (expiryDate < new Date()) error(410, lang === 'da' ? 'Den krypterede adgangskode er udløbet' : 'The encrypted password has expired')
    }
    
    return { lang }
}