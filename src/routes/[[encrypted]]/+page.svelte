<script>

    import { getIcon } from '$lib/icons'
    import { fly } from 'svelte/transition'
    import { page } from '$app/stores'
    import { browser } from '$app/environment'

    let { decrypted } = $derived($page.data)
    let value = $state(decrypted || '')
    let link = $state(null)
    let lang = $derived(browser ? navigator.language.split('-')[0] : 'en')

    const go = async () => {
        const { encrypted } = await fetch('/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, action: 'encrypt' })
        }).then(r => r.json())

        link = encrypted
        navigator.clipboard.writeText(`${$page.url.origin}/${encodeURIComponent(encrypted)}`)
    }

    const texts = {
        da: {
            continue: 'Fortsæt',
            copied: 'Kopieret',
            find: 'Find din adgangskode her',
            write: 'Skriv en adgangskode her',
            share: 'Sikker deling af adgangskoder',
            infoDecrypted: 'Lyra opbevarer aldrig delte adgangskoder. Ingen andre end de personer der har linket, kan tilgå adgangskoden - selv ikke Tetrabit. Linket virker i én uge. Du finder adgangskoden du har modtaget under "Find din adgangskode her".',
            info: 'Lyra opbevarer aldrig delte adgangskoder. Ingen andre end de personer der har linket, kan tilgå adgangskoden - selv ikke Tetrabit. Linket virker i én uge. Skriv en adgangskode du vil dele, og tryk "fortsæt" for at få et sikkert link.'
        },
        en: {
            continue: 'Continue',
            copied: 'Copied',
            find: 'Find your password here',
            write: 'Write a password here',
            share: 'Secure sharing of passwords',
            infoDecrypted: 'Lyra never stores shared passwords. No one but the people who have the link can access the password - not even Tetrabit. The link is valid for one week. You will find the password you received under "Find your password here".',
            info: 'Lyra never stores shared passwords. No one but the people who have the link can access the password - not even Tetrabit. The link is valid for one week. Write a password you want to share, and press "continue" to get a secure link.'
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

        <button onclick={go} class="go" class:hidden={decrypted || ((!value || value === '') && !link)}>
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
                <span class="text">{#if decrypted}{texts[lang]['find']}{:else}{texts[lang]['write']}{/if}</span>
            </h3>
            <input type="text" bind:value readonly={decrypted} />
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
        height: 270px;
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
            animation: scroll 20s linear infinite;
            position: absolute;
            top: 0;
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