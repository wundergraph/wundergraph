import { createClient, type PublicUser } from '$lib/generated/client';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {    
    let user: PublicUser | null;
    const client = createClient({
        customFetch: event.fetch
    })

    // protected route if the user is not authenticated it will redirect
    try {
        user = await client.fetchUser();
    }  catch (err) {
        user = null
        throw(redirect(302, '/signin'))
    }

    return {
        user
    }
}