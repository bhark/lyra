import { error } from '@sveltejs/kit'
import { sb } from '$lib/server/supabase'
import { validate as validateUUID } from 'uuid'

export const load = async ({ params, request }) => {

    const lang = request.headers.get('accept-language').split('-')[0] === 'da' ? 'da' : 'en'

    if (params.uuid) {

        // validate the uuid
        if (!validateUUID(params.uuid)) error(400, lang === 'da' ? 'Ugyldigt link' : 'Invalid link')

        // get the encrypted password from the database
        const { data, error: err } = await sb
            .from('encrypted_passwords')
            .select('created_at, expiry_days')
            .eq('id', params.uuid)
            .maybeSingle()

        if (err) error(500, err.message || lang === 'da' ? 'Vi stødte på en uventet fejl - beklager!' : 'We encountered an unexpected error - sorry!')
        if (!data) error(404, lang === 'da' ? 'Den krypterede adgangskode findes ikke' : 'The encrypted password does not exist')

        const { created_at, expiry_days } = data

        // check if it's expired
        const expiryDate = new Date(created_at)
        expiryDate.setDate(expiryDate.getDate() + expiry_days)
        if (expiryDate < new Date()) error(410, lang === 'da' ? 'Den krypterede adgangskode er udløbet' : 'The encrypted password has expired')
    }
    
    return { lang }
}