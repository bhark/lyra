<script>

    import { getIcon } from '$lib/icons'
    import { fly } from 'svelte/transition'
    import { page } from '$app/stores'
    import { browser } from '$app/environment'
    import { Buffer } from 'buffer'

    // fixed values
    const saltLength = 32
    const secretLength = 32
    const ivLength = 16

    // reactive values
    let link = $state('')
    let generatingLink = $state(false)
    let decrypted = $state('')
    let inputValue = $state('')

    // derivatives
    let { ciphertext } = $derived($page.data)
    let lang = $derived(browser ? navigator.language.split('-')[0] : 'en')
    let product = $derived($page.url.searchParams.get('product'))

    const deriveKey = async (password, salt) => {
        const encoder = new TextEncoder()
        return await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'])
            .then(key => crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']))
    }

    const encode = (uint8array) => {
        return Buffer.from(uint8array).toString('base64')
    }

    const decode = (base64) => {
        if (!base64) return
        return Uint8Array.from(Buffer.from(base64, 'base64'))
    }

    const encrypt = async (secret) => {
        const encoder = new TextEncoder()

        const salt = crypto.getRandomValues(new Uint8Array(saltLength))
        const iv = crypto.getRandomValues(new Uint8Array(ivLength))
        const decryptionSecret = crypto.getRandomValues(new Uint8Array(secretLength))

        const key = await deriveKey(decryptionSecret, salt)
        const ciphertext = encode(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(secret)))

        let product = new Uint8Array([...salt, ...iv, ...decryptionSecret])
        product = encode(product)
        
        return {
            product,
            ciphertext
        }
    }

    const decrypt = async (product) => {

        if (!product || product == '') return

        const decoder = new TextDecoder()

        product = decode(product)
        const decodedCiphertext = decode(ciphertext)

        // extract salt, iv and decryption secret
        const salt = product.slice(0, saltLength)
        const iv = product.slice(saltLength, saltLength + ivLength)
        const decryptionSecret = product.slice(saltLength + ivLength)

        const key = await deriveKey(decryptionSecret, salt)

        decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, decodedCiphertext)
            .then(buffer => decoder.decode(buffer))
    }

    const generateLink = async (secret) => {

        try {
            generatingLink = true

            // encrypt the secret, retrieve ciphertext and product
            const { ciphertext, product } = await encrypt(secret)

            // store ciphertext on server
            const formData = new FormData()
            formData.append('ciphertext', ciphertext)

            const id = await fetch('/', {
                method: 'POST', 
                body: formData 
            }).then(res => res.json()).then(data => JSON.parse(data.data)[1])

            // set link
            link = `${$page.url.origin}/${id}?product=${encodeURIComponent(product)}`

            // copy link to clipboard
            navigator.clipboard.writeText(link)

        } catch (error) {
            console.error(error)
        } finally {
            generatingLink = false
        }
    }

    const texts = {
        da: {
            continue: 'Fortsæt',
            copied: 'Kopieret',
            find: 'Find din adgangskode her',
            write: 'Skriv en adgangskode her',
            get: 'Hent din adgangskode her',
            getPass: 'Hent adgangskode',
            share: 'Sikker deling af adgangskoder',
            infoDecrypted: 'Din adgangskode forlader aldrig din enhed. Alt kryptering foregår offline, og Lyra opbevarer kun sikkert krypterede værdier. Adgangskoder slettes efter en uge, eller når de er blevet åbnet første gang. Du finder adgangskoden du har modtaget under "Find din adgangskode her".',
            info: 'Din adgangskode forlader aldrig din enhed. Alt kryptering foregår offline, og Lyra opbevarer kun sikkert krypterede værdier. Adgangskoder slettes efter en uge, eller når de er blevet åbnet første gang. Skriv en adgangskode du vil dele, og tryk "fortsæt" for at få et sikkert link.'
        },
        en: {
            continue: 'Continue',
            copied: 'Copied',
            find: 'Find your password here',
            write: 'Write a password here',
            get: 'Get your password here',
            getPass: 'Get password',
            share: 'Secure sharing of passwords',
            infoDecrypted: 'Your password never leaves your device. All encryption happens offline, and Lyra only stores securely encrypted values. Passwords are deleted after a week, or when they are opened for the first time. You will find the password you received under "Find your password here".',
            info: 'Your password never leaves your device. All encryption happens offline, and Lyra only stores securely encrypted values. Passwords are deleted after a week, or when they are opened for the first time. Write a password you want to share, and press "continue" to get a secure link.'
        }
    }

</script>

<svelte:head>
    <title>Lyra by Tetrabit</title>
</svelte:head>

<div {lang} id="lyra" action="?/encrypt">
    <div class="marquee">
        <div class="marquee-inner">
            {#each { length: 2 } as _}
                {#each { length: 10 } as _}
                    <span class="h1">LYRA</span>
                {/each}
            {/each}
        </div>

        <button onclick={() => generateLink(inputValue)} class="go" class:hidden={decrypted || ((!inputValue || inputValue === '') && !link)}>
            {#if !link}
                <div class="inner" out:fly={{ duration: 300, y: 60 }}>
                    <span class="text">{texts[lang]['continue']}</span>
                    <span class="icon">{@html getIcon('arrow')}</span>
                </div>
            {:else}
                <div class="inner" in:fly={{ duration: 500, y: -60, delay: 300 }}>
                    <span class="text">{texts[lang]['copied']}</span>
                    <span class="icon">{@html getIcon('check')}</span>
                </div>
            {/if}
        </button>
    </div>

    <div class="sections">
        <div class="section input">
            <h3>
                <span class="icon">{@html getIcon('password')}</span>
                <span class="text">
                    {#if $page.params.uuid && !decrypted}
                        {texts[lang]['get']}
                    {:else if decrypted}
                        {texts[lang]['find']}
                    {:else}
                        {texts[lang]['write']}
                    {/if}
                </span>
            </h3>
            {#if $page.params.uuid && !decrypted}
                <button class="get" onclick={() => decrypt(product)}>{texts[lang]['getPass']}</button>
            {:else if decrypted}
                <input type="text" bind:value={decrypted} readonly />
            {:else}
                <input type="text" bind:value={inputValue} />
            {/if}
        </div>

        <div class="section">
            <h3>
                <span class="icon">{@html getIcon('secure')}</span>
                <span class="text">{texts[lang]['share']}</span>
            </h3>
            {#if decrypted}
                <p>{texts[lang]['infoDecrypted']}</p>
            {:else}
                <p>{texts[lang]['info']}</p>
            {/if}
        </div>
    </div>

    <div class="tetra">
        <img src="/tetraboys.png" alt="Tetrabit logo" />
    </div>
</div>

<style lang="scss">

    @use 'src/styles/variables.scss' as *;

    #lyra {
        min-height: calc(100dvh - 80px);
        display: flex;
        flex-direction: column;
    }

    .tetra {
        width: 100dvw;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: $standard-padding;
        filter: grayscale(100%) contrast(200%);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-grow: 1;

        img {
            width: 50px;
        }
    }

    .sections {
        display: flex;
        flex-direction: row;
        border-bottom: solid 1px $black;

        .section {
            padding: $standard-padding;
            flex-basis: 50%;
            position: relative;

            h3 {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                border-bottom: solid 1px $black;
                width: calc(100% + 2 * #{$standard-padding});
                margin-left: -#{$standard-padding};
                padding: 0 $standard-padding;
                padding-bottom: 10px;
                text-transform: uppercase;
                margin-top: -20px;
                padding-top: 12px;
                position: relative;
                z-index: 2;
                background-color: $sand;
            }

            button.get {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: $black;
                color: $sand;
                font-size: 3rem;
                text-transform: uppercase;
                cursor: pointer;
                padding-top: 40px;
            }

            &:last-child { border-left: solid 1px $black; }
        }

        .section.input {
            position: relative;

            input {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                font-size: 2rem;
                border: none;
                background-color: transparent;
                padding-top: 40px;
            }
        }
    }

    .marquee {
        gap: 10px;
        border-bottom: solid 1px $black;
        padding: $standard-padding;
        overflow: hidden;
        height: 200px;
        position: relative;

        button.go {
            text-transform: uppercase;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2;
            height: 100%;
            width: 100%;
            border: none;
            background-color: $black;
            color: $sand;
            font-size: 10rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            transition: ease all 800ms;
            gap: 0px;
            cursor: pointer;

            .inner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
            }

            &:hover { gap: 20px; }

            &.hidden {
                transform: translateX(-201%);
            }

            .icon {
                height: 150px;
                width: 150px;
            }
        }

        .marquee-inner {
            display: inline-flex;
            flex-direction: row;
            animation: scroll 50s linear infinite;
            position: absolute;
            top: -35px;
            left: 0;
        }

        span.h1 {
            font-size: 14rem;
            font-weight: bold;
        }
    }

    @keyframes scroll {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-50%);
        }
    }

    @media (max-width: 800px) {
        .marquee button.go {
            font-size: 3rem;

            .icon {
                height: 50px;
                width: 50px;
            }
        }
        .sections {
            flex-direction: column;

            .section {
                min-height: 200px;

                &.input input { padding-top: 40px; }
                &:last-child { border-left: none; }
                &:first-child { border-bottom: solid 1px $black; }
            }
        }
    }

</style>