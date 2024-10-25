import { redirect } from '@sveltejs/kit'

export const load = async ({ params, fetch }) => {
    if (params.encrypted) {
        const decrypted = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'decrypt', value: params.encrypted })
        }).then(r => r.json()).then(r => r.decrypted)

        if (!decrypted) redirect(301, '/')

        return { decrypted }
    }
}