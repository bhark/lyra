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
    let expiryDays = $state(7)
    let expiryViews = $state(1)

    // derivatives
    let lang = $derived($page.data.lang)
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

        const ciphertext = await fetch(`/${$page.params.uuid}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).then(r => r.json()).then(data => data.ciphertext).catch(err => console.error(err))

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

            const id = await fetch('/', {
                method: 'POST', 
                body: JSON.stringify({
                    ciphertext,
                    expiryDays,
                    expiryViews
                })
            }).then(r => r.json()).then(data => data.id)

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

    const texts = $derived({
        da: {
            title: 'Lyra af Tetrabit',
            continue: 'Fortsæt',
            copied: 'Kopieret',
            find: 'Find din adgangskode her',
            write: 'Skriv en adgangskode her',
            get: 'Hent din adgangskode her',
            getPass: 'Hent adgangskode',
            share: 'Sikker deling af adgangskoder',
            infoDecrypted: `Din adgangskode forlader aldrig din enhed. Alt kryptering foregår offline, og Lyra opbevarer kun sikkert krypterede værdier. Adgangskoden slettes efter ${expiryDays} dage, eller når den er blevet åbnet ${expiryViews} ${expiryViews === 1 ? 'gang' : 'gange'}.`,
            info: `Din adgangskode forlader aldrig din enhed. Alt kryptering foregår offline, og Lyra opbevarer kun sikkert krypterede værdier. Adgangskoden slettes efter ${expiryDays} dage, eller når den er blevet åbnet ${expiryViews} ${expiryViews === 1 ? 'gang' : 'gange'}. Skriv en adgangskode du vil dele, og tryk "fortsæt" for at få et sikkert link.`
        },
        en: {
            title: 'Lyra by Tetrabit',
            continue: 'Continue',
            copied: 'Copied',
            find: 'Find your password here',
            write: 'Write a password here',
            get: 'Get your password here',
            getPass: 'Get password',
            share: 'Secure password sharing',
            infoDecrypted: `Your password never leaves your device. All encryption happens offline, and Lyra only stores securely encrypted values. The password will be deleted after ${expiryDays} days, or when it's been opened ${expiryViews} ${expiryViews === 1 ? 'time' : 'times'}.`,
            info: `Your password never leaves your device. All encryption happens offline, and Lyra only stores securely encrypted values. The password will be deleted after ${expiryDays} days, or when it's been opened ${expiryViews} ${expiryViews === 1 ? 'time' : 'times'}. Write a password you want to share, and press "continue" to get a secure link.`
        }
    })

</script>

<svelte:head>
    <title>{texts[lang]['title']}</title>
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
            <div class="section-head">
                <div class="element">
                    <span class="icon">{@html getIcon('password')}</span>
                    <h3 class="text">
                        {#if $page.params.uuid && !decrypted}
                            {texts[lang]['get']}
                        {:else if decrypted}
                            {texts[lang]['find']}
                        {:else}
                            {texts[lang]['write']}
                        {/if}
                    </h3>
                </div>
            </div>
            {#if $page.params.uuid}
                <button class="get" class:unveil={decrypted} onclick={() => decrypt(product)}>{texts[lang]['getPass']}</button>

                {#if decrypted}
                    <input type="text" bind:value={decrypted} readonly />
                {/if}
            {:else}
                <input type="text" bind:value={inputValue} />
            {/if}
        </div>

        <div class="section controls mobile" class:hidden={$page.params.uuid}>
            <div class="control">
                <span class="icon label">
                    {@html getIcon('timer')}
                </span>
                <button class="less" class:disabled={expiryDays <= 1} onclick={() => expiryDays -= 1}>
                    <span class="icon">{@html getIcon('navArrowLeft')}</span>
                </button>
                <span class="count">{expiryDays}</span>
                <button class="more" class:disabled={expiryDays >= 30} onclick={() => expiryDays += 1}>
                    <span class="icon">{@html getIcon('navArrowRight')}</span>
                </button>
            </div>
    
            <div class="control">
                <span class="icon label">
                    {@html getIcon('eye')}
                </span>
                <button class="less" class:disabled={expiryViews <= 1} onclick={() => expiryViews -= 1}>
                    <span class="icon">{@html getIcon('navArrowLeft')}</span>
                </button>
                <span class="count">{expiryViews}</span>
                <button class="more" class:disabled={expiryViews >= 5} onclick={() => expiryViews += 1}>
                    <span class="icon">{@html getIcon('navArrowRight')}</span>
                </button>
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <div class="element">
                    <span class="icon">{@html getIcon('secure')}</span>
                    <h3 class="text">{texts[lang]['share']}</h3>
                </div>
            </div>
            {#if decrypted || $page.params.uuid}
                <p>{texts[lang]['infoDecrypted']}</p>
            {:else}
                <p>{texts[lang]['info']}</p>
            {/if}
        </div>
    </div>

    <div class="controls desktop" class:hidden={$page.params.uuid}>
        <div class="control">
            <span class="icon label">
                {@html getIcon('timer')}
            </span>
            <button class="less" class:disabled={expiryDays <= 1} onclick={() => expiryDays -= 1}>
                <span class="icon">{@html getIcon('navArrowLeft')}</span>
            </button>
            <span class="count">{expiryDays}</span>
            <button class="more" class:disabled={expiryDays >= 30} onclick={() => expiryDays += 1}>
                <span class="icon">{@html getIcon('navArrowRight')}</span>
            </button>
        </div>

        <div class="control">
            <span class="icon label">
                {@html getIcon('eye')}
            </span>
            <button class="less" class:disabled={expiryViews <= 1} onclick={() => expiryViews -= 1}>
                <span class="icon">{@html getIcon('navArrowLeft')}</span>
            </button>
            <span class="count">{expiryViews}</span>
            <button class="more" class:disabled={expiryViews >= 5} onclick={() => expiryViews += 1}>
                <span class="icon">{@html getIcon('navArrowRight')}</span>
            </button>
        </div>
    </div>

    <div class="tetra">
        <img src="/tetraboys.png" alt="Tetrabit logo" />
    </div>
</div>

<style lang="scss">

    @use 'src/styles/variables.scss' as *;

    .controls {
        display: flex;
        flex-direction: row;
        border: solid 1px $black;
        border-top: none;
        align-self: flex-start;

        &.hidden { display: none; }

        .control {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: $standard-padding;

            &:first-child { border-right: solid 1px $black; }

            button {
                padding: 0;
                background-color: transparent;
                border: none;
                cursor: pointer;
                transition: ease all 300ms;

                &.disabled { opacity: .5; pointer-events: none; }
            }

            span.count { font-size: 1.2rem; }
            span.label { margin-right: 20px; }
        }
    }

    @media (max-width: 600px) {
        .controls {
            align-self: stretch;

            .control {
                flex-grow: 1;
                flex-basis: 50%;
            }
        }
    }

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
            overflow: hidden;

            .section-head {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                justify-content: space-between;
                width: calc(100% + 2 * #{$standard-padding});
                margin-left: -#{$standard-padding};
                background-color: $sand;
                padding: 0 $standard-padding 15px $standard-padding;
                border-bottom: solid 1px $black;

                h3 {
                    text-transform: uppercase;
                }

                .element {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                }
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
                transition: ease all 500ms;
                z-index: 2;

                &.unveil { transform: translateY(-101%); }
                &:hover:not(.unveil) { transform: translateY(-10px); }
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

    @media (max-width: 600px) {
        .desktop { display: none; }

        .section.controls {
            min-height: auto;
            padding: 0;

            > .control { padding: $standard-padding; }
        }
    }

    @media (min-width: 600px) {
        .mobile { display: none; }
    }

</style>